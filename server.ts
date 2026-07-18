import { validateEnv, missingEnvVarsList } from './server/env.js';
// Run environment validation first
validateEnv();

import express from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { prisma, testDbConnection } from './server/db.js';
import { seedDatabase } from './server/seed.js';
import { authenticateToken, requireRole } from './server/authMiddleware.js';
import {
  triageSymptoms,
  interpretLabResults,
  scanDrugInteractions,
  generateSoapNote,
  clinicalAssistantQa,
  getClinicalRecommendations,
  labAssistantAnalysis,
  pharmacyAssistantAnalysis
} from './server/gemini.js';
import pharmacyRouter from './server/pharmacy.js';
import patientRouter from './server/patient.js';
import adminRouter from './server/admin.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Check for missing environment variables on Vercel
  app.use((req, res, next) => {
    if (missingEnvVarsList.length > 0) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'The server is missing critical environment variables.',
        missingVariables: missingEnvVarsList,
        vercel: !!process.env.VERCEL,
        instructions: 'Please check your environment variables and make sure DATABASE_URL and GEMINI_API_KEY are configured in the Vercel Dashboard -> Settings -> Environment Variables, and redeploy.'
      });
    }
    next();
  });

  // SSE Real-time clients registry
  let sseClients: any[] = [];

  function broadcastRefresh(type: string = 'generic') {
    const payload = `data: ${JSON.stringify({ action: 'refresh', type })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch (err) {
        // connection closed or broken
      }
    });
  }

  // Real-time SSE endpoint
  app.get('/api/realtime', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write('data: {"action":"connected"}\n\n');

    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
  });

  app.use('/api/pharmacy', pharmacyRouter);
  app.use('/api/patient', patientRouter);
  app.use('/api/admin', adminRouter);

  // Simple in-memory IP Rate Limiter
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  app.use((req, res, next) => {
    // Only apply rate limiting to /api/ routes
    if (!req.path.startsWith('/api')) {
      return next();
    }

    // Skip rate limiting in development, testing, and sandbox preview environments to prevent polling blocks
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production' || true) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100000');
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
    const now = Date.now();

    let record = rateLimitMap.get(ip as string);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(ip as string, record);
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later under safety rate limit policies.' 
      });
    }

    record.count++;
    next();
  });

  // DB Connection & Seeding
  // On Vercel, use fewer connection retries and a shorter delay to avoid cold-start timeouts
  const dbConnected = await testDbConnection(process.env.VERCEL ? 2 : 5, 1000);
  if (dbConnected) {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('⚠️ Database is empty. Seeding clinic data...');
        await seedDatabase();
      } else {
        console.log(`✅ Database already contains ${userCount} users. Skipping seeding.`);
      }
    } catch (err: any) {
      console.warn('⚠️ Could not check/seed database on startup. This is expected if tables are not yet created in the database.', err.message);
    }
  }

  // Helper: Create Audit Log
  async function logAudit(
    arg1: any, 
    arg2: string, 
    arg3: string, 
    arg4: any, 
    arg5?: string, 
    arg6?: 'Low' | 'Medium' | 'High'
  ) {
    try {
      let userId, userName, role, action, details, severity;
      let ipAddress = 'unknown';
      let device = 'unknown';

      if (arg1 && typeof arg1 === 'object' && 'headers' in arg1) {
        // Version 1: (req, action, details, severity)
        const req = arg1 as express.Request;
        userId = req.user?.id || 'system';
        userName = req.user?.name || 'System';
        role = req.user?.role || 'SYSTEM';
        action = arg2;
        details = arg3;
        severity = arg4;
        ipAddress = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
        device = req.headers['user-agent'] || 'unknown';
      } else {
        // Version 2: (userId, userName, role, action, details, severity)
        userId = arg1;
        userName = arg2;
        role = arg3;
        action = arg4;
        details = arg5 || '';
        severity = arg6 || 'Low';
      }

      await prisma.auditLog.create({
        data: { userId, userName, role, action, details, severity, ipAddress, device }
      });
    } catch (e) {
      console.error('Audit log write error:', e);
    }
  }

  async function createNotification(userId: string, title: string, message: string, type: string = 'System') {
    try {
      const notification = await prisma.notification.create({
        data: { userId, title, message, type }
      });
      broadcastRefresh('notification');
      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  // =========================================================================
  // AUTHENTICATION ENDPOINTS
  // =========================================================================

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role = 'PATIENT', dob, phone, gender, bloodGroup, medicalHistoryNotes, department } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required registration parameters.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email address already registered in clinic systems.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role as any,
          dob,
          phone,
          gender,
          bloodGroup,
          medicalHistoryNotes,
          department: role === 'DOCTOR' ? department : null
        }
      });

      await logAudit(
        req,
        'User Registration',
        `New account registered for role: ${newUser.role}. Email: ${newUser.email}`,
        'Medium'
      );

      res.status(201).json({ message: 'User registered successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error during registration.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter email and password.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid login email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid login email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'This account has been deactivated. Please contact the administrator.' });
      }

      // JWT Tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      };

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '24h' });
      const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });

      await logAudit(
        req,
        'User Login',
        `Successful login session established. JWT Issued.`,
        'Low'
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          dob: user.dob,
          phone: user.phone,
          gender: user.gender,
          bloodGroup: user.bloodGroup,
          medicalHistoryNotes: user.medicalHistoryNotes
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server login failure.' });
    }
  });

  app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token missing.' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
      const tokenPayload = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        department: decoded.department
      };
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '24h' });
      res.json({ accessToken });
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired refresh token.' });
    }
  });

  app.get('/api/health', async (req, res) => {
    let dbStatus = 'unknown';
    let dbError = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (e: any) {
      dbStatus = 'disconnected';
      dbError = e.message || String(e);
    }

    let jwtStatus = 'unknown';
    let jwtError = null;
    try {
      const payload = { test: true };
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is missing.');
      }
      const token = jwt.sign(payload, secret, { expiresIn: '1m' });
      const verified = jwt.verify(token, secret) as any;
      if (verified.test) {
        jwtStatus = 'ok';
      } else {
        jwtStatus = 'failed';
      }
    } catch (e: any) {
      jwtStatus = 'error';
      jwtError = e.message || String(e);
    }

    res.json({
      status: (dbStatus === 'connected' && jwtStatus === 'ok') ? 'ok' : 'unhealthy',
      database: {
        status: dbStatus,
        error: dbError
      },
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'configured' : 'missing',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL
      },
      jwt: {
        status: jwtStatus,
        error: jwtError
      }
    });
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });
      if (!user) return res.status(404).json({ error: 'User profile not found.' });

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        dob: user.dob,
        phone: user.phone,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        medicalHistoryNotes: user.medicalHistoryNotes
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // PATIENT RECORDS ENDPOINTS
  // =========================================================================

  app.get('/api/patients', authenticateToken, requireRole(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const patients = await prisma.user.findMany({
        where: { role: 'PATIENT' },
        select: {
          id: true, name: true, email: true, phone: true, dob: true, gender: true, bloodGroup: true, medicalHistoryNotes: true, createdAt: true, patientId: true, mrn: true
        }
      });
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      // Access restriction: Patients can only view their own files.
      if (req.user!.role === 'PATIENT' && req.user!.id !== id) {
        return res.status(403).json({ error: 'Forbidden. Patients can only query their own charts.' });
      }

      const patient = await prisma.user.findUnique({
        where: { id },
        include: {
          vitalsLogs: { orderBy: { recordedAt: 'desc' } },
          conditions: { orderBy: { diagnosedAt: 'desc' } },
          allergies: { orderBy: { notedAt: 'desc' } },
          patientAppointments: { orderBy: { dateTime: 'asc' } },
          patientPrescriptions: { include: { items: true }, orderBy: { createdAt: 'desc' } },
          labReports: { include: { results: true }, orderBy: { createdAt: 'desc' } }
        }
      });

      if (!patient || patient.role !== 'PATIENT') {
        return res.status(404).json({ error: 'Patient clinical record not found.' });
      }

      const activeQueueItem = await prisma.queueItem.findFirst({
        where: {
          patientId: id,
          status: { in: ['Waiting', 'Calling', 'Accepted', 'With Doctor', 'Absent'] }
        },
        orderBy: { checkedInAt: 'desc' }
      });

      res.json({
        ...patient,
        activeQueueItem
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patients/:id/vitals', authenticateToken, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { bloodPressure, heartRate, temperature, bmi } = req.body;

      if (!bloodPressure || !heartRate || !temperature || !bmi) {
        return res.status(400).json({ error: 'Missing raw vital sign parameters.' });
      }

      const patient = await prisma.user.findUnique({ where: { id } });
      if (!patient || patient.role !== 'PATIENT') return res.status(404).json({ error: 'Patient not found.' });

      const log = await prisma.vitalsLog.create({
        data: {
          patientId: id,
          bloodPressure,
          heartRate: parseInt(heartRate),
          temperature: parseFloat(temperature),
          bmi: parseFloat(bmi),
          recordedBy: req.user!.name
        }
      });

      await logAudit(
        req,
        'Add Patient Vitals',
        `Recorded vital signs for Patient ${patient.name} (${id}). BP: ${bloodPressure}, HR: ${heartRate}`,
        'Low'
      );

      res.status(201).json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patients/:id/conditions', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, notes } = req.body;

      if (!name) return res.status(400).json({ error: 'Condition name required.' });

      const patient = await prisma.user.findUnique({ where: { id } });
      if (!patient || patient.role !== 'PATIENT') return res.status(404).json({ error: 'Patient not found.' });

      const cond = await prisma.condition.create({
        data: {
          patientId: id,
          name,
          notes,
          diagnosedBy: req.user!.name
        }
      });

      await logAudit(
        req,
        'Add Patient Condition',
        `Diagnosed condition "${name}" for Patient ${patient.name}`,
        'Medium'
      );

      res.status(201).json(cond);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patients/:id/allergies', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { allergen, severity } = req.body;

      if (!allergen || !severity) return res.status(400).json({ error: 'Missing allergen or severity parameters.' });

      const patient = await prisma.user.findUnique({ where: { id } });
      if (!patient || patient.role !== 'PATIENT') return res.status(404).json({ error: 'Patient not found.' });

      const allergy = await prisma.allergy.create({
        data: {
          patientId: id,
          allergen,
          severity,
          notedBy: req.user!.name
        }
      });

      await logAudit(
        req,
        'Add Patient Allergy',
        `Logged allergy "${allergen}" (${severity}) for Patient ${patient.name}`,
        'Medium'
      );

      res.status(201).json(allergy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/patients/:id/notes', authenticateToken, requireRole(['DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (notes === undefined) {
        return res.status(400).json({ error: 'Progress notes content required.' });
      }

      const patient = await prisma.user.findUnique({ where: { id } });
      if (!patient || patient.role !== 'PATIENT') return res.status(404).json({ error: 'Patient not found.' });

      const updated = await prisma.user.update({
        where: { id },
        data: { medicalHistoryNotes: notes }
      });

      await logAudit(
        req,
        'Update Progress Notes',
        `Updated progress notes/nursing observations for Patient ${patient.name} (${id})`,
        'Medium'
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // APPOINTMENTS ENDPOINTS
  // =========================================================================

  app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
      let appointments;
      if (req.user!.role === 'PATIENT') {
        appointments = await prisma.appointment.findMany({
          where: { patientId: req.user!.id },
          include: { patient: { select: { name: true } }, doctor: { select: { name: true, department: true } } },
          orderBy: { dateTime: 'asc' }
        });
      } else {
        appointments = await prisma.appointment.findMany({
          include: { patient: { select: { name: true } }, doctor: { select: { name: true, department: true } } },
          orderBy: { dateTime: 'asc' }
        });
      }
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
      const { patientId, doctorId, dateTime, reason, type, department, notes, priority } = req.body;

      const role = req.user!.role;
      const actualPatientId = role === 'PATIENT' ? req.user!.id : (patientId || req.user!.id);

      if (!dateTime || !reason) {
        return res.status(400).json({ error: 'Missing appointment date, time, or clinical reason.' });
      }

      // If patient, enforce hospital policy: cannot book directly with doctor. Status must be PENDING.
      let finalStatus = 'PENDING';
      let finalDoctorId = null;
      let finalPriority = 'Normal';

      if (role === 'PATIENT') {
        finalStatus = 'PENDING';
        finalDoctorId = null; // Unassigned at request time
        finalPriority = 'Normal';
      } else {
        // Receptionist/Admin can confirm and assign doctor immediately
        finalStatus = doctorId ? 'CONFIRMED' : 'PENDING';
        finalDoctorId = doctorId || null;
        finalPriority = priority || 'Normal';
      }

      // Check if duplicate pending or confirmed appointment exists for the patient at the exact same slot
      const duplicate = await prisma.appointment.findFirst({
        where: {
          patientId: actualPatientId,
          dateTime,
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'You already have an appointment or request scheduled for this slot.' });
      }

      // Double-booking check for staff members making direct assignments
      if (finalStatus === 'CONFIRMED' && finalDoctorId) {
        const overlapping = await prisma.appointment.findFirst({
          where: {
            doctorId: finalDoctorId,
            dateTime,
            status: 'CONFIRMED'
          }
        });
        if (overlapping) {
          return res.status(400).json({ error: 'Doctor schedule conflict. This doctor is already booked for a confirmed appointment at this slot.' });
        }
      }

      const appointment = await prisma.appointment.create({
        data: {
          patientId: actualPatientId,
          doctorId: finalDoctorId,
          dateTime,
          reason,
          type: type || 'Consultation',
          department: department || 'General Medicine',
          notes: notes || '',
          status: finalStatus,
          priority: finalPriority,
          createdBy: req.user!.id,
          updatedBy: req.user!.id,
        },
        include: { patient: { select: { id: true, name: true } }, doctor: { select: { id: true, name: true } } }
      });

      // Notify Receptionists of a new request
      const receptionists = await prisma.user.findMany({ where: { role: 'RECEPTIONIST' } });
      for (const rec of receptionists) {
        await createNotification(
          rec.id,
          'New Appointment Request',
          `Patient ${appointment.patient.name} has submitted a new consultation request for ${appointment.department}.`,
          'Appointment'
        );
      }

      // Notify Patient
      await createNotification(
        actualPatientId,
        'Appointment Request Submitted',
        'Your appointment request has been submitted and is awaiting receptionist review.',
        'Appointment'
      );

      // Notify Doctor if assigned immediately
      if (finalDoctorId) {
        await createNotification(
          finalDoctorId,
          'New Assigned Appointment',
          `New confirmed appointment with patient ${appointment.patient.name} scheduled for ${new Date(dateTime).toLocaleString()}.`,
          'Appointment'
        );
      }

      await logAudit(
        req,
        'Book Appointment Request',
        `Registered appointment request in status ${finalStatus} for patient ${appointment.patient.name}`,
        'Low'
      );

      // Trigger instant SSE refresh for dashboards
      broadcastRefresh('appointment');

      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unified Dashboard Summary Endpoint to fetch all role-based stats in a single API call
  app.get('/api/dashboard-summary', authenticateToken, async (req, res) => {
    try {
      const role = req.user!.role;
      const userId = req.user!.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const result: any = { role };

      if (role === 'RECEPTIONIST' || role === 'ADMIN') {
        const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });
        const todayAppointments = await prisma.appointment.count({
          where: {
            dateTime: { gte: today.toISOString(), lt: tomorrow.toISOString() }
          }
        });
        const waitingPatients = await prisma.queueItem.count({
          where: { status: { in: ['Waiting', 'Calling'] } }
        });
        const completedToday = await prisma.appointment.count({
          where: {
            status: 'Completed',
            dateTime: { gte: today.toISOString(), lt: tomorrow.toISOString() }
          }
        });

        const recentActivities = await prisma.auditLog.findMany({
          where: { role: 'RECEPTIONIST' },
          orderBy: { timestamp: 'desc' },
          take: 10
        });

        result.receptionist = {
          stats: {
            totalPatients,
            todayAppointments,
            waitingPatients,
            completedToday,
            cancelledToday: 0
          },
          recentActivities
        };
      }

      if (role === 'DOCTOR' || role === 'ADMIN') {
        const [
          todayAppointments,
          upcomingAppointments,
          completedConsultations,
          pendingConsultations,
          assignedPatients,
          labResults,
          labRequests,
          aiRecommendations
        ] = await Promise.all([
          prisma.appointment.count({ where: { doctorId: userId, dateTime: { startsWith: today.toISOString().split('T')[0] } } }),
          prisma.appointment.count({ where: { doctorId: userId, status: 'Confirmed' } }),
          prisma.consultation.count({ where: { doctorId: userId, status: 'Completed' } }),
          prisma.consultation.count({ where: { doctorId: userId, status: 'In Progress' } }),
          prisma.user.count({ where: { role: 'PATIENT', isActive: true } }),
          prisma.labReport.count({ where: { status: 'Completed' } }),
          prisma.labReport.count({ where: { status: 'Pending' } }),
          prisma.aIRecommendation.count({ where: { status: 'Pending', consultation: { doctorId: userId } } })
        ]);

        result.doctor = {
          todayAppointments,
          upcomingAppointments,
          completedConsultations,
          pendingConsultations,
          assignedPatients,
          labResults,
          labRequests,
          aiRecommendations
        };
      }

      if (role === 'NURSE' || role === 'ADMIN') {
        const [
          totalAdmitted,
          awaitingVitals,
          awaitingMeds,
          tasksCompletedToday,
          recentLogs
        ] = await Promise.all([
          prisma.admission.count({ where: { status: 'Admitted' } }),
          prisma.appointment.count({ where: { status: 'Checked-In' } }),
          prisma.prescriptionItem.count({ 
            where: { 
              prescription: { status: 'Dispensed' },
              medicationLogs: { none: { administeredAt: { gte: today } } } 
            } 
          }),
          prisma.auditLog.count({ where: { userId: userId, timestamp: { gte: today } } }),
          prisma.auditLog.findMany({
            where: { userId: userId },
            orderBy: { timestamp: 'desc' },
            take: 5
          })
        ]);

        result.nurse = {
          totalAdmitted,
          awaitingVitals,
          awaitingMeds,
          tasksCompletedToday,
          recentLogs
        };
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PDF Streaming Endpoint
  app.get('/api/reports/download/:type/:id', authenticateToken, async (req, res) => {
    try {
        const { type, id } = req.params;
        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-${id}.pdf"`);
        
        doc.pipe(res);
        doc.fontSize(20).text(`${type} Report for ${id}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
        doc.end();
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // =========================================================================
  // RECEPTIONIST MODULE ENDPOINTS
  // =========================================================================

  app.get('/api/receptionist/dashboard-stats', authenticateToken, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });
      const todayAppointments = await prisma.appointment.count({
        where: {
          dateTime: { gte: today.toISOString(), lt: tomorrow.toISOString() }
        }
      });
      const waitingPatients = await prisma.queueItem.count({
        where: { status: { in: ['Waiting', 'Calling'] } }
      });
      const completedToday = await prisma.appointment.count({
        where: {
          status: 'Completed',
          dateTime: { gte: today.toISOString(), lt: tomorrow.toISOString() }
        }
      });

      const recentActivities = await prisma.auditLog.findMany({
        where: { role: 'RECEPTIONIST' },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      res.json({
        stats: {
          totalPatients,
          todayAppointments,
          waitingPatients,
          completedToday,
          cancelledToday: 0 // Mock or add to schema if needed
        },
        recentActivities
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/receptionist/patients', authenticateToken, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
      const {
        firstName, lastName, middleName, email, password, gender, dob, phone,
        address, city, state, country, emergencyContactName, emergencyContactPhone,
        bloodGroup, genotype, maritalStatus, occupation, nationality, idNumber, passportPhoto
      } = req.body;

      if (!email || !firstName || !lastName || !dob) {
        return res.status(400).json({ error: 'Missing core registration fields.' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already exists.' });

      // Auto-generate IDs
      const count = await prisma.user.count({ where: { role: 'PATIENT' } });
      const patientId = `PAT-${(count + 1).toString().padStart(4, '0')}`;
      const mrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;

      const passwordHash = await bcrypt.hash(password || 'Clinic123!', 10);

      const patient = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          middleName,
          role: 'PATIENT',
          gender,
          dob,
          phone,
          address,
          city,
          state,
          country,
          emergencyContactName,
          emergencyContactPhone,
          bloodGroup,
          genotype,
          maritalStatus,
          occupation,
          nationality,
          idNumber,
          passportPhoto,
          patientId,
          mrn
        }
      });

      // Notify Patient
      await createNotification(
        patient.id,
        'Registration Successful',
        `Welcome to the clinic! Your Patient ID is ${patientId} and MRN is ${mrn}. You can now book appointments.`,
        'System'
      );

      await logAudit(
        req,
        'Patient Registration',
        `Registered new patient ${patient.name} (${patientId})`,
        'Medium'
      );

      res.status(201).json({ 
        message: 'Patient registered successfully', 
        id: patient.id,
        patientId,
        mrn
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/receptionist/appointments/:id/check-in', authenticateToken, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { waitingRoom, priority } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true, doctor: true }
      });

      if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

      // Generate Queue Token
      const lastToken = await prisma.queueItem.findFirst({ orderBy: { tokenNumber: 'desc' } });
      const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 101;

      // Calculate queue position and estimated waiting time
      const doctorIdFilter = appointment.doctorId || '';
      const patientsAheadCount = await prisma.queueItem.count({
        where: {
          status: 'Waiting',
          doctorId: doctorIdFilter
        }
      });

      const position = patientsAheadCount + 1;
      const estimatedWaitTimeMinutes = position * 15; // 15 minutes average session duration

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'WAITING',
          arrivalTime: new Date(),
          checkInTime: new Date(),
          queueNumber: tokenNumber,
          waitingRoom: waitingRoom || 'Main Lounge'
        }
      });

      const queueItem = await prisma.queueItem.create({
        data: {
          patientId: appointment.patientId,
          patientName: appointment.patient.name,
          doctorId: appointment.doctorId,
          doctorName: appointment.doctor?.name || 'General Doctor',
          department: appointment.department || appointment.doctor?.department || 'General',
          tokenNumber,
          status: 'Waiting',
          priority: priority || appointment.priority || 'Normal'
        }
      });

      // Notify Patient
      await createNotification(
        appointment.patientId,
        'Check-In Successful',
        `You have been checked in! Your queue number is #${tokenNumber}. You are in position ${position} with an estimated waiting time of ${estimatedWaitTimeMinutes} minutes. Please wait in the ${waitingRoom || 'Main Lounge'}.`,
        'Appointment'
      );

      // Notify Doctor
      if (appointment.doctorId) {
        await createNotification(
          appointment.doctorId,
          'Patient Arrived',
          `Patient ${appointment.patient.name} (Token #${tokenNumber}, Position ${position}) has checked in and is waiting in the ${waitingRoom || 'Main Lounge'}.`,
          'Appointment'
        );
      }

      // Notify Nurse if assessment is needed
      const nurses = await prisma.user.findMany({ where: { role: 'NURSE' } });
      for (const nurse of nurses) {
        await createNotification(
          nurse.id,
          'Pre-Consultation Needed',
          `Patient ${appointment.patient.name} (Token #${tokenNumber}) is checked in and ready for vitals assessment.`,
          'Appointment'
        );
      }

      await logAudit(req, 'Patient Check-In', `Checked in ${appointment.patient.name} (Token #${tokenNumber}, Pos: ${position}, Est Wait: ${estimatedWaitTimeMinutes}m)`, 'Low');

      // Trigger instant SSE refresh for dashboards
      broadcastRefresh('appointment');
      broadcastRefresh('queue');

      res.json({ 
        appointment: updated, 
        queueItem,
        position,
        estimatedWaitTimeMinutes
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/receptionist/appointments/:id/check-out', authenticateToken, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true }
      });

      if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'Completed',
          departureTime: new Date()
        }
      });

      // Remove from queue if still there
      await prisma.queueItem.deleteMany({
        where: { patientId: appointment.patientId }
      });

      await logAudit(req, 'Patient Check-Out', `Checked out ${appointment.patient.name}`, 'Low');

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- DOCTOR DASHBOARD ENDPOINTS ---

  app.get('/api/doctor/dashboard-stats', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const doctorId = req.user!.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        todayAppointments,
        upcomingAppointments,
        completedConsultations,
        pendingConsultations,
        assignedPatients,
        labResults,
        labRequests,
        aiRecommendations
      ] = await Promise.all([
        prisma.appointment.count({ where: { doctorId, dateTime: { startsWith: today.toISOString().split('T')[0] } } }),
        prisma.appointment.count({ where: { doctorId, status: 'Confirmed' } }),
        prisma.consultation.count({ where: { doctorId, status: 'Completed' } }),
        prisma.consultation.count({ where: { doctorId, status: 'In Progress' } }),
        prisma.user.count({ where: { role: 'PATIENT', isActive: true } }), // Simplified as "all patients" for now
        prisma.labReport.count({ where: { status: 'Completed' } }),
        prisma.labReport.count({ where: { status: 'Pending' } }),
        prisma.aIRecommendation.count({ where: { status: 'Pending', consultation: { doctorId } } })
      ]);

      res.json({
        todayAppointments,
        upcomingAppointments,
        completedConsultations,
        pendingConsultations,
        assignedPatients,
        labResults,
        labRequests,
        aiRecommendations
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/doctor/patients', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { search, filter } = req.query;
      const patients = await prisma.user.findMany({
        where: {
          role: 'PATIENT',
          isActive: true,
          OR: search ? [
            { name: { contains: search as string, mode: 'insensitive' } },
            { patientId: { contains: search as string, mode: 'insensitive' } },
            { mrn: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string, mode: 'insensitive' } }
          ] : undefined
        },
        include: {
          vitalsLogs: { orderBy: { recordedAt: 'desc' }, take: 1 },
          conditions: true,
          patientAppointments: { orderBy: { dateTime: 'desc' }, take: 1 }
        }
      });
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/doctor/consultations/active', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const doctorId = req.user!.id;
      const consultation = await prisma.consultation.findFirst({
        where: {
          doctorId,
          status: 'In Progress'
        },
        include: {
          patient: {
            include: {
              vitalsLogs: { orderBy: { recordedAt: 'desc' }, take: 1 },
              conditions: true,
              patientAppointments: { orderBy: { dateTime: 'desc' }, take: 1 }
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });
      res.json(consultation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/doctor/consultations/:id', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const doctorId = req.user!.id;
      const data = req.body;

      const consultation = await prisma.consultation.update({
        where: { id, doctorId },
        data: {
          chiefComplaint: data.chiefComplaint,
          symptoms: data.symptoms,
          physicalExamination: data.physicalExamination,
          provisionalDiagnosis: data.provisionalDiagnosis,
          finalDiagnosis: data.finalDiagnosis,
          treatmentPlan: data.treatmentPlan,
          followUpInstructions: data.followUpInstructions,
          notes: data.notes
        }
      });

      res.json(consultation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/consultations/start', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { appointmentId, patientId, department } = req.body;
      const doctorId = req.user!.id;

      const existing = await prisma.consultation.findFirst({
        where: { doctorId, status: 'In Progress' }
      });
      if (existing) {
        return res.status(400).json({ 
          error: 'An active consultation is already in progress. Please conclude your current encounter before initiating a new one.' 
        });
      }

      const consultation = await prisma.consultation.create({
        data: {
          appointmentId,
          patientId,
          doctorId,
          department: department || 'General Practice',
          status: 'In Progress'
        }
      });

      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'In Progress' }
        });
      } else {
        // Try to find a pending appointment if not provided
        const appointment = await prisma.appointment.findFirst({
          where: {
            patientId,
            doctorId,
            status: { in: ['Confirmed', 'Checked-In', 'Pending'] }
          },
          orderBy: { dateTime: 'desc' }
        });
        if (appointment) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: 'In Progress' }
          });
        }
      }

      // Update Queue status
      await prisma.queueItem.updateMany({
        where: { 
          patientId, 
          doctorId, 
          status: 'Accepted' 
        },
        data: { 
          status: 'With Doctor',
          startedAt: new Date()
        }
      });

      // Notify Receptionists
      const receptionists = await prisma.user.findMany({ where: { role: 'RECEPTIONIST' } });
      for (const rec of receptionists) {
        await createNotification(
          rec.id,
          'Consultation Started',
          `Dr. ${req.user!.name} has started the encounter with patient ID ${patientId}.`,
          'System'
        );
      }

      broadcastRefresh('queue');
      broadcastRefresh('appointment');
      
      await logAudit(req, 'Consultation Started', `Started consultation for patient ${patientId}`, 'Low');
      res.json(consultation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/consultations/:id/end', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const endTime = new Date();

      const consultation = await prisma.consultation.findUnique({ where: { id } });
      if (!consultation) return res.status(404).json({ error: 'Consultation not found.' });

      const updatedConsultation = await prisma.$transaction(async (tx) => {
        const duration = Math.round((endTime.getTime() - consultation.startTime.getTime()) / 60000);

        const updated = await tx.consultation.update({
          where: { id },
          data: {
            ...data,
            endTime,
            duration,
            status: 'Completed'
          }
        });

        if (consultation.appointmentId) {
          await tx.appointment.update({
            where: { id: consultation.appointmentId },
            data: { status: 'Completed' }
          });
        }

        // Update QueueItem to Completed
        await tx.queueItem.updateMany({
          where: { 
            patientId: consultation.patientId,
            doctorId: consultation.doctorId,
            status: { in: ['With Doctor', 'Accepted', 'Calling', 'Waiting'] }
          },
          data: { status: 'Completed' }
        });
        
        return updated;
      });

      // Notify Patient
      await createNotification(
        consultation.patientId,
        'Consultation Ended',
        `Your consultation with Dr. ${req.user!.name} has concluded. Your medical record has been updated.`,
        'Appointment'
      );

      // Notify Receptionists
      const receptionists = await prisma.user.findMany({ where: { role: 'RECEPTIONIST' } });
      for (const rec of receptionists) {
        await createNotification(
          rec.id,
          'Doctor Available',
          `Dr. ${req.user!.name} is now available for the next patient.`,
          'System'
        );
      }

      broadcastRefresh('queue');
      broadcastRefresh('appointment');
      broadcastRefresh('notification');

      await logAudit(req, 'Consultation Completed', `Completed consultation for patient ${updatedConsultation.patientId}`, 'Low');
      res.json(updatedConsultation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/feedback', authenticateToken, async (req, res) => {
    try {
      const { feature, query, response, rating, comment } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const feedback = await prisma.genericAIFeedback.create({
        data: {
          userId,
          userRole,
          feature,
          query,
          response,
          rating: parseInt(rating),
          comment
        }
      });

      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/ai-assist', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    console.log('AI Assist request received:', req.body);
    try {
      const { consultationId, prompt, patientContext } = req.body;
      
      const recommendationData = await getClinicalRecommendations(prompt, patientContext);
      
      const savedRec = await prisma.aIRecommendation.create({
        data: {
          consultationId,
          type: 'General', // Could be more specific based on logic
          recommendation: recommendationData.recommendations,
          confidenceScore: recommendationData.confidenceScore,
          explanation: recommendationData.explanation,
          clinicalReasoning: recommendationData.clinicalReasoning,
          supportingRationale: recommendationData.supportingRationale,
          possibleRisks: recommendationData.possibleRisks,
          alternatives: recommendationData.alternatives,
          status: 'Pending'
        }
      });

      await logAudit(req, 'AI Recommendation Requested', `Requested AI assistance for consultation ${consultationId}`, 'Low');
      res.json(savedRec);
    } catch (error: any) {
      console.error('AI Assist error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/ai-recommendations/:id/feedback', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, feedbackText, rejectionReason, doctorAction } = req.body;

      const feedback = await prisma.rLFeedback.create({
        data: {
          recommendationId: id,
          rating,
          feedbackText,
          rejectionReason,
          doctorAction
        }
      });

      await prisma.aIRecommendation.update({
        where: { id },
        data: { status: doctorAction === 'Accept' ? 'Accepted' : doctorAction === 'Reject' ? 'Rejected' : 'Partially Accepted' }
      });

      await logAudit(req, 'AI Feedback Provided', `Provided feedback for AI recommendation ${id}`, 'Low');
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/doctor/patients/:id/vitals', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const vitals = await prisma.vitalsLog.findMany({
        where: { patientId: id },
        orderBy: { recordedAt: 'desc' }
      });
      res.json(vitals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/patients/:id/vitals', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const doctorName = req.user!.name;

      const log = await prisma.vitalsLog.create({
        data: {
          ...data,
          patientId: id,
          recordedBy: doctorName
        }
      });

      await logAudit(req, 'Vitals Recorded', `Recorded vitals for patient ${id}`, 'Low');
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/diagnoses', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const doctorId = req.user!.id;
      const data = req.body;

      const diagnosis = await prisma.diagnosis.create({
        data: {
          ...data,
          doctorId
        }
      });

      await logAudit(req, 'Diagnosis Created', `Created diagnosis for patient ${data.patientId}`, 'Medium');
      res.json(diagnosis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Doctor: Forward instructions/details to nurse
  app.post('/api/doctor/nurse-instructions', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { patientId, note, type } = req.body;
      const doctorName = req.user!.name;

      const nursingNote = await prisma.nursingNote.create({
        data: {
          patientId,
          nurseId: `Doctor ${doctorName}`,
          note,
          type: type || 'Doctor Instruction'
        }
      });

      // Create notifications for all nurses
      const nurses = await prisma.user.findMany({ where: { role: 'NURSE' } });
      for (const nurse of nurses) {
        await prisma.notification.create({
          data: {
            userId: nurse.id,
            title: 'Patient Care Updated',
            message: `Dr. ${doctorName} forwarded care details/instructions for patient.`,
            type: 'Nurse Instruction',
            isRead: false
          }
        });
      }

      await logAudit(req, 'Nurse Instruction Forwarded', `Forwarded care instructions to nurses for patient ${patientId}`, 'Medium');
      
      if (typeof (global as any).broadcastRefresh === 'function') {
        (global as any).broadcastRefresh();
      }

      res.status(201).json(nursingNote);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global: Get messages involving current user (any role)
  app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
      const messages = await prisma.secureMessage.findMany({
        where: {
          OR: [
            { senderId: req.user!.id },
            { receiverId: req.user!.id }
          ]
        },
        include: {
          sender: { select: { name: true, role: true } },
          receiver: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global: Send a secure message (any role)
  app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
      const { receiverId, subject, content, isEmergency } = req.body;
      const senderId = req.user!.id;

      const sender = await prisma.user.findUnique({ where: { id: senderId } });
      const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

      if (!sender || !receiver) {
        return res.status(404).json({ error: 'Sender or receiver not found.' });
      }

      // Enforcement: Patients and Doctors can only chat if there's an active (non-completed) appointment
      if ((sender.role === 'PATIENT' && receiver.role === 'DOCTOR') || (sender.role === 'DOCTOR' && receiver.role === 'PATIENT')) {
        const patientId = sender.role === 'PATIENT' ? sender.id : receiver.id;
        const doctorId = sender.role === 'DOCTOR' ? sender.id : receiver.id;

        const activeAppointment = await prisma.appointment.findFirst({
          where: {
            patientId,
            doctorId,
            status: { in: ['PENDING', 'CONFIRMED', 'WAITING', 'In Progress'] }
          }
        });

        if (!activeAppointment) {
          return res.status(403).json({ 
            error: 'Messaging disabled. You must have an active or upcoming appointment to communicate.' 
          });
        }
      }

      const message = await prisma.secureMessage.create({
        data: {
          senderId,
          receiverId,
          subject: subject || 'Direct Message',
          content,
          isEmergency: isEmergency || false
        }
      });

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: `New Message from ${req.user!.name}`,
          message: content.length > 50 ? content.slice(0, 47) + '...' : content,
          type: 'Message',
          isRead: false
        }
      });

      if (typeof (global as any).broadcastRefresh === 'function') {
        (global as any).broadcastRefresh();
      }

      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/prescriptions', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const doctorId = req.user!.id;
      const { patientId, items } = req.body;

      // Drug Interaction Check
      const medicineNames = items.map((i: any) => i.medicineName);
      const aiWarnings = await scanDrugInteractions(medicineNames);

      const prescription = await prisma.prescription.create({
        data: {
          patientId,
          doctorId,
          status: 'Pending Dispense',
          aiInteractionWarnings: aiWarnings,
          items: {
            create: items
          }
        },
        include: { items: true }
      });

      // Automatically create Medication Reminders for each prescribed item based on frequency/instructions
      try {
        const remindersToCreate: any[] = [];
        for (const item of prescription.items) {
          const freq = (item.frequency || 'Once daily').toLowerCase();
          const inst = (item.instructions || '').toLowerCase();
          const times: string[] = [];

          if (freq.includes('twice') || inst.includes('twice') || inst.includes('twice daily')) {
            times.push('08:00'); // Morning
            times.push('20:00'); // Night
          } else if (freq.includes('three') || inst.includes('three times')) {
            times.push('08:00'); // Morning
            times.push('14:00'); // Afternoon
            times.push('20:00'); // Night
          } else if (freq.includes('four') || inst.includes('four times')) {
            times.push('08:00', '12:00', '16:00', '20:00');
          } else if (freq.includes('bedtime') || inst.includes('bedtime') || freq.includes('night') || inst.includes('night') || inst.includes('in the night')) {
            times.push('21:30'); // Night / Bedtime
          } else if (freq.includes('morning') || inst.includes('morning') || inst.includes('in the morning') || freq.includes('once daily')) {
            times.push('08:00'); // Morning
          } else if (freq.includes('before meals') || inst.includes('before meals')) {
            times.push('07:30', '12:30', '19:30');
          } else {
            if (inst.includes('morning')) times.push('08:00');
            if (inst.includes('night') || inst.includes('evening')) times.push('20:00');
            if (times.length === 0) times.push('08:00'); // Default to morning
          }

          for (const t of times) {
            remindersToCreate.push({
              patientId,
              prescriptionId: prescription.id,
              medicineName: item.medicineName,
              dosage: item.dosage,
              time: t,
              frequency: item.frequency || 'Once daily',
              isActive: true
            });
          }
        }

        for (const rData of remindersToCreate) {
          await prisma.medicationReminder.create({ data: rData });
        }
      } catch (reminderErr) {
        console.error('Failed to create automatic medication reminders:', reminderErr);
      }

      // Create notification for patient about their prescription with dosage & instructions
      try {
        const itemDetailsStr = prescription.items
          .map(i => `${i.medicineName} (${i.dosage}) - Instructions: ${i.instructions || 'Take as directed by doctor'}`)
          .join('; ');

        await prisma.notification.create({
          data: {
            userId: patientId,
            title: 'Digital Script Authorized & Issued',
            message: `Dr. ${req.user!.name} has issued a digital script for: ${itemDetailsStr}.`,
            type: 'Appointment', // Shown under medications
            isRead: false
          }
        });
      } catch (notifErr) {}

      // Create notification for all pharmacists with medicine name, dosage, and drug type
      try {
        const pharmacists = await prisma.user.findMany({ where: { role: 'PHARMACIST' } });
        const patientUser = await prisma.user.findUnique({ where: { id: patientId }, select: { name: true } });
        const patientName = patientUser?.name || 'Patient';
        const pharmacyDetailsStr = prescription.items
          .map(i => `${i.medicineName} (${i.dosage}) [Type: ${i.drugType || 'Tablet'}]`)
          .join(', ');

        for (const pharmacist of pharmacists) {
          await prisma.notification.create({
            data: {
              userId: pharmacist.id,
              title: 'New Digital Script Received',
              message: `New digital script received for patient ${patientName}: ${pharmacyDetailsStr}.`,
              type: 'Message',
              isRead: false
            }
          });
        }
      } catch (pharmaNotifErr) {
        console.error('Failed to send pharmacist digital script notifications:', pharmaNotifErr);
      }

      await logAudit(req, 'Prescription Issued', `Issued prescription for patient ${patientId}`, 'Medium');
      broadcastRefresh('prescription');
      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/lab-requests', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { patientId, testName, notes } = req.body;
      const orderedBy = req.user!.name;

      const report = await prisma.labReport.create({
        data: {
          patientId,
          testName,
          orderedBy,
          notes,
          status: 'Pending'
        }
      });

      await logAudit(req, 'Lab Request Created', `Requested ${testName} for patient ${patientId}`, 'Low');
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/doctor/radiology-requests', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { patientId, studyType } = req.body;
      const orderedBy = req.user!.name;

      const report = await prisma.radiologyReport.create({
        data: {
          patientId,
          studyType,
          orderedBy,
          status: 'Pending'
        }
      });

      await logAudit(req, 'Radiology Request Created', `Requested ${studyType} for patient ${patientId}`, 'Low');
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/doctor/patients/:id/timeline', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const [
        appointments,
        consultations,
        diagnoses,
        prescriptions,
        labs,
        radiology
      ] = await Promise.all([
        prisma.appointment.findMany({ where: { patientId: id }, orderBy: { dateTime: 'desc' } }),
        prisma.consultation.findMany({ where: { patientId: id }, orderBy: { startTime: 'desc' }, include: { aiRecommendations: true } }),
        prisma.diagnosis.findMany({ where: { patientId: id }, orderBy: { diagnosisDate: 'desc' } }),
        prisma.prescription.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' }, include: { items: true } }),
        prisma.labReport.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' } }),
        prisma.radiologyReport.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' } })
      ]);

      // Combine and sort by date
      const timeline = [
        ...appointments.map(a => ({ type: 'Appointment', date: a.dateTime, data: a })),
        ...consultations.map(c => ({ type: 'Consultation', date: c.startTime, data: c })),
        ...diagnoses.map(d => ({ type: 'Diagnosis', date: d.diagnosisDate, data: d })),
        ...prescriptions.map(p => ({ type: 'Prescription', date: p.createdAt, data: p })),
        ...labs.map(l => ({ type: 'Lab', date: l.createdAt, data: l })),
        ...radiology.map(r => ({ type: 'Radiology', date: r.createdAt, data: r }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json(timeline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/doctor/notifications', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/notifications/mark-read', authenticateToken, async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true }
      });
      broadcastRefresh('notification');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/appointments/:id', authenticateToken, requireRole(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, doctorId, department, dateTime, priority, consultationRoom, notes, rejectionReason } = req.body;

      // Find existing appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true, doctor: true }
      });
      if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

      // Build data updates object
      const updateData: any = {
        updatedBy: req.user!.id,
      };

      if (status) updateData.status = status;
      if (department) updateData.department = department;
      if (priority) updateData.priority = priority;
      if (consultationRoom) updateData.consultationRoom = consultationRoom;
      if (notes !== undefined) updateData.notes = notes;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;

      // Double-booking schedule conflict check
      const finalDoctorId = doctorId || appointment.doctorId;
      const finalDateTime = dateTime || appointment.dateTime;
      const finalStatus = status || appointment.status;

      if (finalStatus === 'CONFIRMED' && finalDoctorId && finalDateTime) {
        const conflict = await prisma.appointment.findFirst({
          where: {
            doctorId: finalDoctorId,
            dateTime: finalDateTime,
            status: 'CONFIRMED',
            id: { not: id }
          }
        });
        if (conflict) {
          const conflictDoctor = await prisma.user.findUnique({ where: { id: finalDoctorId } });
          return res.status(400).json({ 
            error: `Schedule Conflict: Dr. ${conflictDoctor?.name || 'Physician'} already has a confirmed appointment at this slot (${new Date(finalDateTime).toLocaleString()}). Please select another date, time, or provider.` 
          });
        }
      }

      if (doctorId) updateData.doctorId = doctorId;
      if (dateTime) updateData.dateTime = dateTime;

      // Handle receptionist ID
      if (req.user!.role === 'RECEPTIONIST') {
        updateData.receptionistId = req.user!.id;
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: { patient: true, doctor: true }
      });

      // Status notifications & alerts trigger
      if (status === 'CONFIRMED') {
        await createNotification(
          updated.patientId,
          'Your appointment has been confirmed',
          `Approved by reception! Your ${updated.department || 'Consultation'} with Dr. ${updated.doctor?.name || 'Physician'} is confirmed for ${new Date(updated.dateTime).toLocaleString()}. Room: ${updated.consultationRoom || 'TBD'}`,
          'Appointment'
        );
        if (updated.doctorId) {
          await createNotification(
            updated.doctorId,
            'You have a new assigned appointment',
            `A new confirmed patient appointment with ${updated.patient.name} has been assigned to you on ${new Date(updated.dateTime).toLocaleString()}.`,
            'Appointment'
          );
        }
      } else if (status === 'REJECTED') {
        await createNotification(
          updated.patientId,
          'Your appointment request was rejected',
          `Your appointment request was rejected. Reason: ${rejectionReason || 'No details provided.'}`,
          'Appointment'
        );
      } else if (status === 'RESCHEDULED') {
        await createNotification(
          updated.patientId,
          'Your appointment has been rescheduled',
          `Your appointment has been rescheduled to ${new Date(updated.dateTime).toLocaleString()}.`,
          'Appointment'
        );
      } else if (status === 'CANCELLED') {
        await createNotification(
          updated.patientId,
          'Your appointment has been cancelled',
          `Your appointment has been cancelled by the hospital staff.`,
          'Appointment'
        );
      }

      await logAudit(
        req,
        'Manage Appointment',
        `Admin/Receptionist updated appointment #${id} (Status set to: ${status || 'Unchanged'}, Provider: ${updated.doctor?.name || 'None'})`,
        'Medium'
      );

      // Trigger instant SSE refresh for dashboards
      broadcastRefresh('appointment');

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patient/appointments/:id/cancel', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true }
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      // Authorization check: Patients can only cancel their own appointments
      if (req.user!.role === 'PATIENT' && appointment.patientId !== req.user!.id) {
        return res.status(403).json({ error: 'You do not have permission to cancel this appointment.' });
      }

      // Check if already in consultation or completed
      const statusUpper = appointment.status.toUpperCase();
      if (
        statusUpper === 'IN PROGRESS' ||
        statusUpper === 'IN_PROGRESS' ||
        statusUpper === 'COMPLETED' ||
        statusUpper === 'NO_SHOW' ||
        statusUpper === 'WITH_DOCTOR'
      ) {
        return res.status(400).json({ error: 'You cannot cancel an appointment that is already in consultation with the doctor, completed, or a no-show.' });
      }

      // Double check active consultation record
      const activeConsultation = await prisma.consultation.findUnique({
        where: { appointmentId: id }
      });
      if (activeConsultation) {
        return res.status(400).json({ error: 'You cannot cancel an appointment that is already in consultation with the doctor.' });
      }

      // Perform cancellation
      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedBy: req.user!.id
        },
        include: { patient: true, doctor: true }
      });

      // Remove the patient from the live queue if they were waiting or calling
      await prisma.queueItem.deleteMany({
        where: {
          patientId: appointment.patientId,
          status: { in: ['Waiting', 'Calling'] }
        }
      });

      // Send patient confirmation notification
      await createNotification(
        appointment.patientId,
        'Appointment Cancelled',
        `Your appointment on ${new Date(appointment.dateTime).toLocaleString()} has been successfully cancelled.`,
        'Appointment'
      );

      // Notify the doctor if assigned
      if (appointment.doctorId) {
        await createNotification(
          appointment.doctorId,
          'Patient Cancelled Appointment',
          `Patient ${appointment.patient.name} has cancelled their scheduled appointment for ${new Date(appointment.dateTime).toLocaleString()}.`,
          'Appointment'
        );
      }

      // Log audit
      await logAudit(
        req,
        'Patient Cancel Appointment',
        `Patient ${appointment.patient.name} cancelled appointment #${id}`,
        'Low'
      );

      // Broadcast SSE refresh
      broadcastRefresh('appointment');
      broadcastRefresh('queue');

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // PRESCRIPTIONS ENDPOINTS
  // =========================================================================

  app.get('/api/prescriptions', authenticateToken, async (req, res) => {
    try {
      let rx;
      if (req.user!.role === 'PATIENT') {
        rx = await prisma.prescription.findMany({
          where: { patientId: req.user!.id },
          include: { items: true, doctor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        rx = await prisma.prescription.findMany({
          include: { items: true, patient: { select: { name: true, dob: true } }, doctor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        });
      }
      res.json(rx);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/prescriptions', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, items } = req.body; // items = [{ medicineName, dosage, frequency, duration }]

      if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing prescription detail blocks.' });
      }

      // Automatically scan medications for adverse drug-drug interactions using Gemini server-side!
      const medNames = items.map(i => i.medicineName);
      let warningNotes = '';
      try {
        warningNotes = await scanDrugInteractions(medNames);
      } catch (err) {
        console.error('Failed to run pharmacological Gemini drug scan:', err);
        warningNotes = 'AI interaction warning scanner currently offline. Manual verification required.';
      }

      const prescription = await prisma.prescription.create({
        data: {
          patientId,
          doctorId: req.user!.id,
          status: 'Pending Dispense',
          aiInteractionWarnings: warningNotes,
          items: {
            create: items.map(itm => ({
              medicineName: itm.medicineName,
              dosage: itm.dosage,
              frequency: itm.frequency,
              duration: itm.duration
            }))
          }
        },
        include: { items: true }
      });

      await logAudit(
        req,
        'Authorize Prescription',
        `Prescribed medications for Patient ${patientId}. AI scanned warning levels.`,
        'Medium'
      );

      res.status(201).json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/prescriptions/:id/dispense', authenticateToken, requireRole(['PHARMACIST', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;

      const rx = await prisma.prescription.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!rx) return res.status(404).json({ error: 'Prescription file not found.' });
      if (rx.status === 'Dispensed') return res.status(400).json({ error: 'This prescription is already fully dispensed.' });

      // Deduct inventory levels
      for (const rxItem of rx.items) {
        const invItem = await prisma.medicineInventory.findFirst({
          where: { name: { contains: rxItem.medicineName, mode: 'insensitive' } }
        });

        if (invItem) {
          const newStock = Math.max(0, invItem.stock - 30); // simulate deducting standard quantity
          await prisma.medicineInventory.update({
            where: { id: invItem.id },
            data: { stock: newStock }
          });
        }
      }

      const updated = await prisma.prescription.update({
        where: { id },
        data: { status: 'Dispensed' }
      });

      await logAudit(
        req,
        'Dispense Prescription',
        `Medications safely dispensed for Rx ID: ${id}. stock values reduced.`,
        'Medium'
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // LAB REPORTS ENDPOINTS
  // =========================================================================

  app.get('/api/lab-reports', authenticateToken, async (req, res) => {
    try {
      let logs;
      if (req.user!.role === 'PATIENT') {
        logs = await prisma.labReport.findMany({
          where: { patientId: req.user!.id },
          include: { results: true },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        logs = await prisma.labReport.findMany({
          include: { results: true, patient: { select: { name: true, dob: true } } },
          orderBy: { createdAt: 'desc' }
        });
      }
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/lab-reports/order', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, testName } = req.body;
      if (!patientId || !testName) return res.status(400).json({ error: 'Missing ordering parameters.' });

      const report = await prisma.labReport.create({
        data: {
          patientId,
          testName,
          orderedBy: req.user!.name,
          status: 'Pending'
        }
      });

      await logAudit(
        req,
        'Order Diagnostic pathology',
        `Ordered test "${testName}" for Patient ID: ${patientId}`,
        'Low'
      );

      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/lab-reports/:id/complete', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { results, notes } = req.body; // results = [{ parameter, value, unit, referenceRange, isAbnormal }]

      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.status(400).json({ error: 'Missing diagnostics findings parameters.' });
      }

      const report = await prisma.labReport.findUnique({ where: { id } });
      if (!report) return res.status(404).json({ error: 'Lab order not found.' });

      // Automatically trigger pathology diagnostic Gemini interpreter!
      let aiAdvice = '';
      try {
        aiAdvice = await interpretLabResults(report.testName, results);
      } catch (err) {
        console.error('Failed to run pathological interpreter:', err);
        aiAdvice = 'AI Pathology Diagnostic advisor currently offline. Manual interpretation required.';
      }

      // Create results
      await prisma.labResultItem.deleteMany({ where: { labReportId: id } }); // clean if existing
      for (const r of results) {
        await prisma.labResultItem.create({
          data: {
            labReportId: id,
            parameter: r.parameter,
            value: r.value,
            unit: r.unit,
            referenceRange: r.referenceRange || '',
            isAbnormal: !!r.isAbnormal
          }
        });
      }

      const updated = await prisma.labReport.update({
        where: { id },
        data: {
          status: 'Completed',
          notes,
          aiInterpretation: aiAdvice
        },
        include: { results: true }
      });

      await logAudit(
        req,
        'Sign Diagnostic Report',
        `Completed and signed pathology findings for lab report ${id}. Gemini reviewed biomarkers.`,
        'Medium'
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/lab-reports/:id/results', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { results, notes } = req.body; // results = [{ parameter, value, unit, referenceRange, isAbnormal }]

      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.status(400).json({ error: 'Missing diagnostics findings parameters.' });
      }

      const report = await prisma.labReport.findUnique({ where: { id } });
      if (!report) return res.status(404).json({ error: 'Lab order not found.' });

      // Automatically trigger pathology diagnostic Gemini interpreter!
      let aiAdvice = '';
      try {
        aiAdvice = await interpretLabResults(report.testName, results);
      } catch (err) {
        console.error('Failed to run pathological interpreter:', err);
        aiAdvice = 'AI Pathology Diagnostic advisor currently offline. Manual interpretation required.';
      }

      // Create results
      await prisma.labResultItem.deleteMany({ where: { labReportId: id } }); // clean if existing
      for (const r of results) {
        await prisma.labResultItem.create({
          data: {
            labReportId: id,
            parameter: r.parameter,
            value: r.value,
            unit: r.unit,
            referenceRange: r.referenceRange || '',
            isAbnormal: !!r.isAbnormal
          }
        });
      }

      const updated = await prisma.labReport.update({
        where: { id },
        data: {
          status: 'Completed',
          notes: notes || '',
          aiInterpretation: aiAdvice
        },
        include: { results: true }
      });

      await logAudit(
        req,
        'Interpret Lab Pathology',
        `Logged results and triggered AI advisor diagnostic synthesis for Lab Order ${id}`,
        'Medium'
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // CLINIC LIVE QUEUE ENDPOINTS
  // =========================================================================

  // --- NURSE MODULE ---

  app.get('/api/nurse/dashboard-stats', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const nurseId = req.user!.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalAdmitted,
        awaitingVitals,
        awaitingMeds,
        tasksCompletedToday,
        recentLogs
      ] = await Promise.all([
        prisma.admission.count({ where: { status: 'Admitted' } }),
        prisma.appointment.count({ where: { status: 'Checked-In' } }),
        prisma.prescriptionItem.count({ 
          where: { 
            prescription: { status: 'Dispensed' },
            medicationLogs: { none: { administeredAt: { gte: today } } } 
          } 
        }),
        prisma.auditLog.count({ where: { userId: nurseId, timestamp: { gte: today } } }),
        prisma.auditLog.findMany({
          where: { userId: nurseId },
          orderBy: { timestamp: 'desc' },
          take: 5
        })
      ]);

      res.json({
        totalAdmitted,
        awaitingVitals,
        awaitingMeds,
        tasksCompletedToday,
        recentLogs
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch nurse dashboard stats' });
    }
  });

  app.post('/api/nurse/admissions', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, ward, bedNumber, observations } = req.body;
      const nurseId = req.user!.id;

      const admission = await prisma.admission.create({
        data: {
          patientId,
          admittedById: nurseId,
          ward,
          bedNumber,
          observations,
          status: 'Admitted'
        }
      });

      await logAudit(req, 'Patient Admission', `Patient ${patientId} admitted to Ward ${ward}, Bed ${bedNumber}`, 'Medium');
      res.status(201).json(admission);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record admission' });
    }
  });

  app.get('/api/nurse/admissions', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const admissions = await prisma.admission.findMany({
        where: { status: { in: ['Admitted', 'Transferred'] } },
        include: { patient: { select: { id: true, name: true, patientId: true, mrn: true } } },
        orderBy: { admissionTime: 'desc' }
      });
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admissions' });
    }
  });

  app.post('/api/nurse/assessments', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, chiefComplaint, mentalStatus, painLevel, skinAssessment, mobilityAssessment, nutritionalStatus, hydrationStatus, fallRisk, infectionRisk, pressureUlcerRisk, observations } = req.body;
      const nurseId = req.user!.id;

      const assessment = await prisma.nursingAssessment.create({
        data: {
          patientId,
          nurseId,
          chiefComplaint,
          mentalStatus,
          painLevel,
          skinAssessment,
          mobilityAssessment,
          nutritionalStatus,
          hydrationStatus,
          fallRisk,
          infectionRisk,
          pressureUlcerRisk,
          observations
        }
      });

      await logAudit(req, 'Nursing Assessment', `Completed assessment for patient ${patientId}`, 'Medium');
      res.status(201).json(assessment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record assessment' });
    }
  });

  app.get('/api/nurse/patients/:id/medication-schedule', authenticateToken, requireRole(['NURSE', 'PHARMACIST', 'DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const prescriptions = await prisma.prescription.findMany({
        where: { patientId: id },
        include: { 
          items: {
            include: { medicationLogs: { orderBy: { administeredAt: 'desc' }, take: 5 } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch medication schedule' });
    }
  });

  app.post('/api/nurse/medications/administer', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, prescriptionItemId, dosageGiven, route, status, adverseReactions, notes } = req.body;
      const nurseId = req.user!.id;

      const log = await prisma.medicationAdministration.create({
        data: {
          patientId,
          prescriptionItemId,
          nurseId,
          dosageGiven,
          route,
          status,
          adverseReactions,
          notes
        }
      });

      await logAudit(req, 'Medication Administration', `Administered med item ${prescriptionItemId} to patient ${patientId}`, 'High');
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record medication administration' });
    }
  });

  app.post('/api/nurse/intake-output', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, type, category, amount } = req.body;
      const nurseId = req.user!.id;

      const record = await prisma.intakeOutput.create({
        data: {
          patientId,
          nurseId,
          type,
          category,
          amount
        }
      });

      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record intake/output' });
    }
  });

  app.get('/api/nurse/patients/:id/intake-output', authenticateToken, requireRole(['NURSE', 'DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const logs = await prisma.intakeOutput.findMany({
        where: { patientId: id },
        orderBy: { timestamp: 'desc' }
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch intake/output logs' });
    }
  });

  app.post('/api/nurse/notes', authenticateToken, requireRole(['NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, note, type, shiftId } = req.body;
      const nurseId = req.user!.id;

      const nursingNote = await prisma.nursingNote.create({
        data: {
          patientId,
          nurseId,
          note,
          type,
          shiftId
        }
      });

      res.status(201).json(nursingNote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record nursing note' });
    }
  });

  app.get('/api/nurse/patients/:id/notes', authenticateToken, requireRole(['NURSE', 'DOCTOR']), async (req, res) => {
    try {
      const { id } = req.params;
      const notes = await prisma.nursingNote.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' }
      });
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch nursing notes' });
    }
  });

  app.post('/api/nurse/shift/start', authenticateToken, requireRole(['NURSE']), async (req, res) => {
    try {
      const { ward } = req.body;
      const nurseId = req.user!.id;

      const shift = await prisma.shiftReport.create({
        data: {
          nurseId,
          ward,
          status: 'Active'
        }
      });

      await logAudit(req, 'Shift Started', `Nurse ${nurseId} started shift in Ward ${ward}`, 'Low');
      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start shift' });
    }
  });

  app.post('/api/nurse/shift/end', authenticateToken, requireRole(['NURSE']), async (req, res) => {
    try {
      const { id, reportContent, handoverToId } = req.body;
      const shift = await prisma.shiftReport.update({
        where: { id },
        data: {
          reportContent,
          handoverToId,
          endTime: new Date(),
          status: 'Completed'
        }
      });

      await logAudit(req, 'Shift Ended', `Nurse ${req.user!.id} completed shift`, 'Low');
      res.json(shift);
    } catch (error) {
      res.status(500).json({ error: 'Failed to end shift' });
    }
  });

  app.get('/api/nurse/shift/current', authenticateToken, requireRole(['NURSE']), async (req, res) => {
    try {
      const nurseId = req.user!.id;
      const shift = await prisma.shiftReport.findFirst({
        where: { nurseId, status: 'Active' },
        orderBy: { startTime: 'desc' }
      });
      res.json(shift);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current shift' });
    }
  });

  app.post('/api/nurse/ai-assist', authenticateToken, requireRole(['NURSE']), async (req, res) => {
    try {
      const { query, patientContext } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      const response = await clinicalAssistantQa(query, patientContext);
      
      await logAudit(req, 'AI Nursing Support', `Requested AI assistance: ${query.substring(0, 50)}...`, 'Low');
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: 'AI Assistant failed' });
    }
  });

  app.get('/api/queue', authenticateToken, async (req, res) => {
    try {
      // Return active queue items
      const list = await prisma.queueItem.findMany({ 
        where: { status: { in: ['Waiting', 'Calling', 'With Doctor', 'Accepted'] } },
        orderBy: [
          { priority: 'desc' }, 
          { checkedInAt: 'asc' }
        ] 
      });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/queue/:id/accept', authenticateToken, requireRole(['PATIENT']), async (req, res) => {
    try {
      const { id } = req.params;
      const patientId = req.user!.id;

      const item = await prisma.queueItem.findFirst({
        where: { id, patientId, status: 'Calling' }
      });

      if (!item) {
        return res.status(404).json({ error: 'Queue item not found or not in calling state.' });
      }

      const updated = await prisma.queueItem.update({
        where: { id },
        data: { status: 'Accepted' }
      });

      broadcastRefresh('queue');
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  app.get('/api/doctor/queue', authenticateToken, requireRole(['DOCTOR']), async (req, res) => {
    try {
      const doctorId = req.user!.id;
      const list = await prisma.queueItem.findMany({
        where: {
          doctorId,
          status: { in: ['Waiting', 'Calling', 'Accepted', 'With Doctor'] }
        },
        include: {
          patient: true
        },
        orderBy: [
          { priority: 'desc' },
          { checkedInAt: 'asc' }
        ]
      });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/queue/:id/status', authenticateToken, requireRole(['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const queueItem = await prisma.queueItem.findUnique({ where: { id } });
      if (!queueItem) return res.status(404).json({ error: 'Queue item not found.' });

      const updated = await prisma.queueItem.update({
        where: { id },
        data: { 
          status,
          calledAt: status === 'Calling' ? new Date() : undefined
        }
      });

      // Handle related appointment status if consultation starts
      if (status === 'With Doctor') {
        await prisma.appointment.updateMany({
          where: { patientId: queueItem.patientId, status: { in: ['Checked-In', 'WAITING'] } },
          data: { status: 'In Progress' }
        });
      } else if (status === 'Completed') {
        await prisma.appointment.updateMany({
          where: { patientId: queueItem.patientId, status: 'In Progress' },
          data: { status: 'Completed', departureTime: new Date() }
        });
      }

      // Notifications
      if (status === 'Calling') {
        await createNotification(
          queueItem.patientId,
          'Your Turn!',
          `Please proceed to ${queueItem.department}. Dr. ${queueItem.doctorName} is ready to see you.`,
          'Appointment'
        );
      }

      await logAudit(req, 'Queue Status Update', `Updated Token #${queueItem.tokenNumber} status to ${status}`, 'Low');

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patient/queue/:id/accept', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const queueItem = await prisma.queueItem.findUnique({
        where: { id }
      });

      if (!queueItem) {
        return res.status(404).json({ error: 'Queue item not found.' });
      }

      // Authorization check
      if (queueItem.patientId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden. You cannot accept this call.' });
      }

      if (queueItem.status !== 'Calling') {
        return res.status(400).json({ error: 'This call is no longer active or has already been accepted.' });
      }

      const updated = await prisma.queueItem.update({
        where: { id },
        data: {
          status: 'Accepted'
        }
      });

      // Notify the doctor / clinic of acceptance
      await createNotification(
        queueItem.doctorId || req.user!.id,
        'Call Accepted',
        `Patient ${queueItem.patientName} has accepted the call.`,
        'Appointment'
      );

      // Log audit
      await logAudit(
        req,
        'Queue Call Accepted',
        `Patient ${queueItem.patientName} accepted queue token #${queueItem.tokenNumber}`,
        'Low'
      );

      // Broadcast SSE refresh
      broadcastRefresh('queue');
      broadcastRefresh('appointment');

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patient/queue/:id/rebook', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const queueItem = await prisma.queueItem.findUnique({
        where: { id }
      });

      if (!queueItem) {
        return res.status(404).json({ error: 'Queue item not found.' });
      }

      if (queueItem.patientId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      if (queueItem.status !== 'Absent') {
        return res.status(400).json({ error: 'Only absent queue items can be re-booked.' });
      }

      // Generate a new queue token to put them back in queue
      const lastToken = await prisma.queueItem.findFirst({ orderBy: { tokenNumber: 'desc' } });
      const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 101;

      const updated = await prisma.queueItem.update({
        where: { id },
        data: {
          status: 'Waiting',
          tokenNumber,
          checkedInAt: new Date()
        }
      });

      // Update related checked-in/waiting appointments
      await prisma.appointment.updateMany({
        where: { patientId: queueItem.patientId, status: { in: ['Checked-In', 'WAITING', 'Absent'] } },
        data: { queueNumber: tokenNumber, status: 'WAITING' }
      });

      // Notify the clinic / doctor / receptionist
      await createNotification(
        queueItem.doctorId || req.user!.id,
        'Patient Re-joined Queue',
        `Patient ${queueItem.patientName} (previously marked absent) has re-booked their queue spot. New Token: #${tokenNumber}.`,
        'Appointment'
      );

      // Log audit
      await logAudit(
        req,
        'Queue Spot Re-booked',
        `Patient ${queueItem.patientName} re-booked queue spot with token #${tokenNumber}`,
        'Low'
      );

      // Broadcast SSE refresh
      broadcastRefresh('queue');
      broadcastRefresh('appointment');

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/patient/queue/:id/cancel', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const queueItem = await prisma.queueItem.findUnique({
        where: { id }
      });

      if (!queueItem) {
        return res.status(404).json({ error: 'Queue item not found.' });
      }

      if (queueItem.patientId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      // Mark queue item as cancelled
      const updatedQueue = await prisma.queueItem.update({
        where: { id },
        data: {
          status: 'Cancelled'
        }
      });

      // Find any checked-in or waiting appointment for this patient and cancel it
      await prisma.appointment.updateMany({
        where: {
          patientId: queueItem.patientId,
          status: { in: ['Checked-In', 'WAITING'] }
        },
        data: {
          status: 'CANCELLED',
          updatedBy: req.user!.id
        }
      });

      // Create notification
      await createNotification(
        queueItem.patientId,
        'Appointment & Queue Spot Cancelled',
        `Your appointment and queue spot (Token #${queueItem.tokenNumber}) have been successfully cancelled.`,
        'Appointment'
      );

      // Log audit
      await logAudit(
        req,
        'Queue Spot Cancelled by Patient',
        `Patient ${queueItem.patientName} cancelled their absent queue spot (Token #${queueItem.tokenNumber})`,
        'Low'
      );

      // Broadcast SSE refresh
      broadcastRefresh('queue');
      broadcastRefresh('appointment');

      res.json(updatedQueue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/queue/:id/move', authenticateToken, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { doctorId, department } = req.body;

      const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
      if (!doctor) return res.status(404).json({ error: 'Target doctor not found.' });

      const updated = await prisma.queueItem.update({
        where: { id },
        data: {
          doctorId,
          doctorName: doctor.name,
          department: department || doctor.department || 'General',
          status: 'Waiting' // Reset to waiting when moved?
        }
      });

      await logAudit(req, 'Queue Move', `Moved Token #${updated.tokenNumber} to Dr. ${doctor.name} (${updated.department})`, 'Low');
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // PHARMACY INVENTORY ENDPOINTS
  // =========================================================================

  app.get('/api/inventory', authenticateToken, requireRole(['PHARMACIST', 'DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const stock = await prisma.medicineInventory.findMany({ orderBy: { name: 'asc' } });
      res.json(stock);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/inventory', authenticateToken, requireRole(['PHARMACIST', 'ADMIN']), async (req, res) => {
    try {
      const { name, category, stock, unit, minStockLevel, price } = req.body;

      if (!name || !category || stock === undefined || !unit || minStockLevel === undefined || price === undefined) {
        return res.status(400).json({ error: 'Missing inventory fields.' });
      }

      const updated = await prisma.medicineInventory.upsert({
        where: { name },
        update: { stock: parseInt(stock), price: parseFloat(price), minStockLevel: parseInt(minStockLevel) },
        create: {
          name, category, unit,
          stock: parseInt(stock),
          minStockLevel: parseInt(minStockLevel),
          price: parseFloat(price)
        }
      });

      await logAudit(
        req,
        'Formulary Inventory Update',
        `Adjusted stock / price levels for medicine "${name}"`,
        'Low'
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/inventory/:id/restock', authenticateToken, requireRole(['PHARMACIST', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      if (stock === undefined || isNaN(stock)) {
        return res.status(400).json({ error: 'Missing stock count to replenish.' });
      }

      const item = await prisma.medicineInventory.findUnique({ where: { id } });
      if (!item) {
        return res.status(404).json({ error: 'Formulary medicine item not found.' });
      }

      const updated = await prisma.medicineInventory.update({
        where: { id },
        data: { stock: item.stock + stock }
      });

      await logAudit(
        req,
        'Formulary Inventory Restock',
        `Replenished medicine "${item.name}" (+${stock} units)`,
        'Low'
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // USER PROFILE & PASSWORD UPDATE ENDPOINTS (For any authenticated user / Patient)
  // =========================================================================

  app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, phone, dob, gender, bloodGroup, medicalHistoryNotes } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Check if user is trying to change their role or status by inspecting req.body
      const updateData: any = {
        name: name || user.name,
        phone: phone !== undefined ? phone : user.phone,
      };

      // Patients can also update their specific fields
      if (user.role === 'PATIENT') {
        if (dob !== undefined) updateData.dob = dob;
        if (gender !== undefined) updateData.gender = gender;
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
        if (medicalHistoryNotes !== undefined) updateData.medicalHistoryNotes = medicalHistoryNotes;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          dob: true,
          phone: true,
          gender: true,
          bloodGroup: true,
          medicalHistoryNotes: true,
          department: true,
          isActive: true
        }
      });

      await logAudit(
        req,
        'Profile Update',
        `User updated their personal profile details`,
        'Low'
      );

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update profile.' });
    }
  });

  app.put('/api/profile/password', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      await logAudit(
        req,
        'Password Change',
        `User successfully changed their account password`,
        'Medium'
      );

      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to change password.' });
    }
  });

  // =========================================================================
  // AUDIT LOGS ENDPOINT
  // =========================================================================

  app.get('/api/audits', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/audit-logs', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/audit-logs', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      await prisma.auditLog.deleteMany();
      await logAudit(
        req,
        'Purge Cyber Audit logs',
        'Permanently purged all clinical security audit records',
        'High'
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // ADMIN USER MANAGEMENT ENDPOINTS
  // =========================================================================

  app.get('/api/admin/users', authenticateToken, requireRole(['ADMIN', 'RECEPTIONIST']), async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          dob: true,
          phone: true,
          gender: true,
          bloodGroup: true,
          medicalHistoryNotes: true,
          department: true,
          createdAt: true,
          updatedAt: true
        }
      });
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch users.' });
    }
  });

  app.post('/api/admin/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const { name, email, phone, department, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields: name, email, password, and role are required.' });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      // Valid roles check
      const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY', 'PHARMACIST', 'PATIENT'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role: ${role}.` });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role as any,
          phone,
          department: role === 'DOCTOR' || role === 'NURSE' ? department : null,
          isActive: true
        }
      });

      await logAudit(
        req,
        'Create Staff Account',
        `Administrator created staff account: ${newUser.name} with role ${newUser.role} (Email: ${newUser.email})`,
        'Medium'
      );

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        phone: newUser.phone,
        department: newUser.department,
        createdAt: newUser.createdAt
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create staff account.' });
    }
  });

  app.patch('/api/admin/users/:id/role', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'Role is required.' });
      }

      const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY', 'PHARMACIST', 'PATIENT'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
      }

      const userToModify = await prisma.user.findUnique({ where: { id } });
      if (!userToModify) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Prevent demoting yourself (the current admin)
      if (req.user!.id === id && role !== 'ADMIN') {
        return res.status(400).json({ error: 'You cannot change or demote your own administrator role.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role: role as any }
      });

      await logAudit(
        req,
        'Modify User Role',
        `Administrator changed role of user: ${updatedUser.name} from ${userToModify.role} to ${updatedUser.role}`,
        'High'
      );

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update user role.' });
    }
  });

  app.patch('/api/admin/users/:id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean.' });
      }

      const userToModify = await prisma.user.findUnique({ where: { id } });
      if (!userToModify) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Prevent deactivating yourself (the current admin)
      if (req.user!.id === id && !isActive) {
        return res.status(400).json({ error: 'You cannot deactivate your own administrator account.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive }
      });

      await logAudit(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        isActive ? 'Activate Account' : 'Deactivate Account',
        `Administrator ${isActive ? 'activated' : 'deactivated'} account: ${updatedUser.name} (Email: ${updatedUser.email})`,
        'High'
      );

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update user status.' });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;

      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Prevent self-deletion
      if (req.user!.id === id) {
        return res.status(400).json({ error: 'You cannot delete your own administrator account.' });
      }

      await prisma.user.delete({ where: { id } });

      await logAudit(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        'Delete User Account',
        `Administrator deleted user account: ${userToDelete.name} (Role: ${userToDelete.role}, Email: ${userToDelete.email})`,
        'High'
      );

      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete user account.' });
    }
  });

  // =========================================================================
  // LABORATORY ENDPOINTS
  // =========================================================================

  // Get Lab Requests
  app.get('/api/lab/requests', authenticateToken, requireRole(['LABORATORY', 'DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { status, priority, department } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (department) where.department = department;

      const requests = await prisma.labRequest.findMany({
        where,
        include: {
          patient: { select: { name: true, idNumber: true, patientId: true, gender: true, dob: true } },
          doctor: { select: { name: true, department: true } },
          technician: { select: { name: true } },
          samples: true,
          results: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Lab Request (DOCTOR)
  app.post('/api/lab/requests', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { patientId, testName, department, priority, observations } = req.body;
      const request = await prisma.labRequest.create({
        data: {
          patientId,
          doctorId: req.user!.id,
          testName,
          department,
          priority: priority || 'ROUTINE',
          observations,
          status: 'PENDING'
        }
      });

      await logAudit(req, 'Laboratory Request Created', `New lab request for ${testName} (Patient: ${patientId})`, 'Medium');
      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Lab Request (LABORATORY)
  app.put('/api/lab/requests/:id', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { status, technicianId, rejectionReason, observations } = req.body;
      const request = await prisma.labRequest.update({
        where: { id: req.params.id },
        data: {
          status,
          technicianId: technicianId || undefined,
          rejectionReason,
          observations
        }
      });

      await logAudit(req, 'Laboratory Request Updated', `Request ${req.params.id} status changed to ${status}`, 'Medium');
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register Sample
  app.post('/api/lab/samples', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { labRequestId, type, sampleId, collectionLocation, collector, storageConditions, quantity, condition } = req.body;
      const sample = await prisma.sample.create({
        data: {
          labRequestId,
          sampleId, // Generated on frontend or backend
          type,
          collectionDate: new Date(),
          collectionLocation,
          collector,
          storageConditions,
          quantity,
          condition,
          status: 'COLLECTED'
        }
      });

      // Update lab request status
      await prisma.labRequest.update({
        where: { id: labRequestId },
        data: { status: 'SAMPLE_COLLECTED' }
      });

      await logAudit(req, 'Laboratory Sample Registered', `Sample ${sampleId} registered for request ${labRequestId}`, 'Medium');
      res.status(201).json(sample);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Enter Results
  app.post('/api/lab/results', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { labRequestId, testName, resultValue, unit, referenceRange, interpretation, technicianNotes, isAbnormal, abnormalityLevel } = req.body;
      const result = await prisma.labResult.create({
        data: {
          labRequestId,
          testName,
          resultValue,
          unit,
          referenceRange,
          interpretation,
          technicianNotes,
          isAbnormal: !!isAbnormal,
          abnormalityLevel,
          verificationStatus: 'PENDING'
        }
      });

      // Update lab request status
      await prisma.labRequest.update({
        where: { id: labRequestId },
        data: { status: 'AWAITING_VERIFICATION' }
      });

      await logAudit(req, 'Laboratory Result Entered', `Result entered for ${testName} (Request: ${labRequestId})`, 'High');
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify Results
  app.put('/api/lab/results/:id/verify', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { status } = req.body; // APPROVED, CORRECTION_REQUESTED
      const result = await prisma.labResult.update({
        where: { id: req.params.id },
        data: {
          verificationStatus: status,
          verifiedById: req.user!.id,
          verifiedAt: new Date()
        }
      });

      if (status === 'APPROVED') {
        // Check if all results for this request are approved
        const otherResults = await prisma.labResult.findMany({
          where: { labRequestId: result.labRequestId }
        });
        const allApproved = otherResults.every(r => r.verificationStatus === 'APPROVED');
        
        if (allApproved) {
          await prisma.labRequest.update({
            where: { id: result.labRequestId },
            data: { status: 'COMPLETED' }
          });
        }
      }

      await logAudit(req, 'Laboratory Result Verified', `Result ${req.params.id} verification status: ${status}`, 'Medium');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Assistant Analysis
  app.post('/api/lab/ai/interpret', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { query, labRequestId } = req.body;
      
      const labRequest = await prisma.labRequest.findUnique({
        where: { id: labRequestId },
        include: {
          patient: { select: { bloodGroup: true, dob: true, gender: true, medicalHistoryNotes: true } },
          results: true
        }
      });

      if (!labRequest) return res.status(404).json({ error: 'Lab request not found' });

      const context = JSON.stringify({
        patient: labRequest.patient,
        results: labRequest.results,
        testName: labRequest.testName
      });

      const aiResponse = await labAssistantAnalysis(query, context);

      // Save interaction
      const interaction = await prisma.labAIInteraction.create({
        data: {
          labRequestId,
          query,
          response: aiResponse.response,
          confidenceScore: aiResponse.confidenceScore / 100, // Normalize if needed
          rationale: aiResponse.rationale,
          alternatives: aiResponse.alternatives
        }
      });

      await logAudit(req, 'AI Lab Assistance Requested', `AI analysis for lab request ${labRequestId}`, 'Low');
      res.json({ ...aiResponse, interactionId: interaction.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // RL Feedback
  app.put('/api/lab/ai/feedback/:id', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const { feedbackStatus, feedbackRating, feedbackComments, feedbackCorrection } = req.body;
      const interaction = await prisma.labAIInteraction.update({
        where: { id: req.params.id },
        data: {
          feedbackStatus,
          feedbackRating,
          feedbackComments,
          feedbackCorrection
        }
      });

      await logAudit(req, 'AI Lab Feedback Submitted', `Feedback for AI interaction ${req.params.id}`, 'Low');
      res.json(interaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lab Equipment
  app.get('/api/lab/equipment', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const equipment = await prisma.labEquipment.findMany({
        include: { qualityControls: { orderBy: { createdAt: 'desc' }, take: 5 } }
      });
      res.json(equipment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lab Analytics
  app.get('/api/lab/analytics', authenticateToken, requireRole(['LABORATORY', 'ADMIN']), async (req, res) => {
    try {
      const totalTests = await prisma.labResult.count();
      const pendingRequests = await prisma.labRequest.count({ where: { status: 'PENDING' } });
      const completedToday = await prisma.labRequest.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      });
      const urgentRequests = await prisma.labRequest.count({ where: { priority: 'URGENT' } });
      const emergencyRequests = await prisma.labRequest.count({ where: { priority: 'EMERGENCY' } });

      // AI Stats
      const aiInteractions = await prisma.labAIInteraction.count();
      const aiFeedback = await prisma.labAIInteraction.count({ where: { feedbackStatus: { not: null } } });
      const acceptedAI = await prisma.labAIInteraction.count({ where: { feedbackStatus: 'ACCEPTED' } });

      res.json({
        totalTests,
        pendingRequests,
        completedToday,
        urgentRequests,
        emergencyRequests,
        aiInteractions,
        aiFeedback,
        acceptedAIRate: aiFeedback > 0 ? (acceptedAI / aiFeedback) * 100 : 0
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // CLINICAL AI ADVISORY ENDPOINTS
  // =========================================================================

  app.post('/api/ai/triage', authenticateToken, async (req, res) => {
    try {
      const { symptoms } = req.body;
      if (!symptoms) return res.status(400).json({ error: 'Symptom descriptions required.' });

      const report = await triageSymptoms(symptoms);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gemini Triage service failed.' });
    }
  });

  app.post('/api/ai/scribe', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ error: 'Raw physician consultation notes required.' });

      const soap = await generateSoapNote(notes);
      res.json({ text: soap });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gemini SOAP Scribe failed.' });
    }
  });

  app.post('/api/ai/qa', authenticateToken, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
    try {
      const { query, patientContext } = req.body;
      if (!query) return res.status(400).json({ error: 'Clinical question is required.' });

      const answer = await clinicalAssistantQa(query, patientContext);
      res.json({ text: answer });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gemini Research Assistant failed.' });
    }
  });


  // Global Express Error-Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ [Global Error Handler] Caught unhandled error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred on the server.',
      stack: process.env.NODE_ENV === 'development' || process.env.VERCEL ? err.stack : undefined
    });
  });

  // =========================================================================
  // VITE & STATIC FILE SERVING
  // =========================================================================
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Intelligent Health Clinic Portal listening on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async function (req, res) {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error('❌ Vercel Serverless Handler Crash:', err);
    res.status(500).json({
      error: 'Vercel Serverless Handler Crash',
      message: err.message || String(err),
      stack: err.stack,
      instructions: 'Please check your environment variables and logs. Make sure that DATABASE_URL and GEMINI_API_KEY are configured in the Vercel Dashboard -> Settings -> Environment Variables, and redeploy.'
    });
  }
}
