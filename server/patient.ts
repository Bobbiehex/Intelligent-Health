import express from 'express';
import { prisma } from './db';
import { authenticateToken, requireRole } from './authMiddleware';
import { getAiClient } from './gemini';
import PDFDocument from 'pdfkit';

const router = express.Router();

/**
 * Helper to log patient activities
 */
async function logActivity(userId: string, userName: string, action: string, details: string, ip?: string, device?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        role: 'PATIENT',
        action,
        details,
        severity: 'Low',
        ipAddress: ip,
        device
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// All routes here require PATIENT role
router.use(authenticateToken, requireRole(['PATIENT']));

router.get('/export', async (req, res) => {
  try {
    const { title } = req.query;
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${title}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text(`Report: ${title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Report generated on ' + new Date().toLocaleDateString());
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/analytics/export', async (req, res) => {
  try {
    const patientId = req.user!.id;
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      include: { vitalsLogs: { orderBy: { recordedAt: 'desc' }, take: 20 } }
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=health-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Health Analytics Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Patient: ${patient.name}`);
    doc.moveDown();

    doc.fontSize(16).text('Vitals History (Last 20 entries):');
    doc.moveDown();
    
    patient.vitalsLogs.forEach(v => {
      doc.fontSize(12).text(`${v.recordedAt.toDateString()}: BP ${v.bloodPressure}, HR ${v.heartRate}, Weight ${v.weight || 'N/A'}kg`);
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/export/prescription/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { items: true, doctor: { select: { name: true } } }
    });

    if (!prescription || prescription.patientId !== req.user!.id) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Prescription Details', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Doctor: Dr. ${prescription.doctor?.name}`);
    doc.fontSize(14).text(`Date: ${prescription.createdAt.toDateString()}`);
    doc.moveDown();
    prescription.items.forEach(item => {
      doc.fontSize(12).text(`${item.medicineName} - ${item.dosage} - ${item.frequency} - ${item.duration}`);
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/export/lab/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lab = await prisma.labReport.findUnique({
      where: { id },
      include: { results: true }
    });

    if (!lab || lab.patientId !== req.user!.id) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lab-report-${id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Lab Report Details', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Test: ${lab.testName}`);
    doc.fontSize(14).text(`Date: ${lab.createdAt.toDateString()}`);
    doc.moveDown();
    lab.results.forEach(r => {
      doc.fontSize(12).text(`${r.parameter}: ${r.value} ${r.unit} (Range: ${r.referenceRange})`);
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/export/radiology/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.radiologyReport.findUnique({
      where: { id }
    });

    if (!report || report.patientId !== req.user!.id) {
      return res.status(404).json({ error: 'Radiology report not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=radiology-report-${id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Radiology Report Details', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Study Type: ${report.studyType}`);
    doc.fontSize(14).text(`Date: ${report.createdAt.toDateString()}`);
    doc.moveDown();
    doc.fontSize(12).text(`Findings: ${report.findings}`);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const patientId = req.user!.id;

    const [
      upcomingAppointments,
      activePrescriptions,
      recentLabs,
      conditions,
      vitals
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId, status: { in: ['Pending', 'Confirmed', 'Checked-In', 'In Progress'] } },
        include: { doctor: { select: { name: true, department: true } } },
        orderBy: { dateTime: 'asc' },
        take: 3
      }),
      prisma.prescription.findMany({
        where: { patientId, status: { notIn: ['Expired', 'Cancelled'] } },
        include: { items: true, doctor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.labReport.findMany({
        where: { patientId, status: 'Completed' },
        include: { results: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      prisma.condition.findMany({
        where: { patientId },
        orderBy: { diagnosedAt: 'desc' }
      }),
      prisma.vitalsLog.findMany({
        where: { patientId },
        orderBy: { recordedAt: 'desc' },
        take: 5
      })
    ]);

    // Mock Assigned Doctor (usually the one from the most recent consultation or primary care)
    const lastConsultation = await prisma.consultation.findFirst({
      where: { patientId },
      include: { doctor: { select: { name: true, department: true } } },
      orderBy: { startTime: 'desc' }
    });

    res.json({
      upcomingAppointments,
      activePrescriptions,
      recentLabs,
      conditions,
      vitals,
      assignedDoctor: lastConsultation?.doctor || null,
      summary: {
        totalAppointments: await prisma.appointment.count({ where: { patientId } }),
        activeMedications: activePrescriptions.length,
        pendingLabs: await prisma.labReport.count({ where: { patientId, status: 'Pending' } })
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// --- Profile Management ---

router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        patientId: true,
        mrn: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        middleName: true,
        gender: true,
        dob: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        bloodGroup: true,
        genotype: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        allergies: true,
        conditions: true,
        medicalHistoryNotes: true,
        passportPhoto: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const { 
      phone, address, city, state, country, 
      emergencyContactName, emergencyContactPhone,
      bloodGroup, genotype, medicalHistoryNotes
    } = req.body;
    
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        phone,
        address,
        city,
        state,
        country,
        emergencyContactName,
        emergencyContactPhone,
        bloodGroup,
        genotype,
        medicalHistoryNotes
      }
    });

    await logActivity(req.user!.id, req.user!.name, 'Profile Updated', 'User updated contact and medical information');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// --- Appointment Management ---

router.get('/appointments', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user!.id },
      include: { doctor: { select: { name: true, department: true } } },
      orderBy: { dateTime: 'desc' }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/doctors', async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: { id: true, name: true, department: true }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { doctorId, dateTime, reason, department, type } = req.body;
    
    // Check for conflict (simpler version)
    const conflict = await prisma.appointment.findFirst({
      where: { doctorId, dateTime, status: { not: 'Cancelled' } }
    });

    if (conflict) {
      return res.status(400).json({ error: 'This time slot is already booked for the selected doctor.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user!.id,
        doctorId,
        dateTime,
        reason,
        department,
        type,
        status: 'Pending'
      }
    });

    await logActivity(req.user!.id, req.user!.name, 'Appointment Booked', `Booked appointment with ID ${appointment.id}`);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

router.patch('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dateTime } = req.body;

    // Ensure it's the patient's own appointment
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.patientId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status, dateTime }
    });

    await logActivity(req.user!.id, req.user!.name, `Appointment ${status}`, `Appointment ID ${id} was ${status.toLowerCase()}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// --- Medical Records ---

router.get('/records', async (req, res) => {
  try {
    const patientId = req.user!.id;
    const consultations = await prisma.consultation.findMany({
      where: { patientId },
      include: { doctor: { select: { name: true, department: true } } },
      orderBy: { startTime: 'desc' }
    });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch consultation history' });
  }
});

router.get('/diagnoses', async (req, res) => {
  try {
    const diagnoses = await prisma.diagnosis.findMany({
      where: { patientId: req.user!.id },
      orderBy: { diagnosisDate: 'desc' }
    });
    res.json(diagnoses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diagnoses' });
  }
});

router.get('/vitals', async (req, res) => {
  try {
    const vitals = await prisma.vitalsLog.findMany({
      where: { patientId: req.user!.id },
      orderBy: { recordedAt: 'desc' }
    });
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
});

router.get('/prescriptions', async (req, res) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.user!.id },
      include: { 
        items: true, 
        doctor: { select: { name: true } },
        dispensingRecords: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

router.get('/labs', async (req, res) => {
  try {
    const labs = await prisma.labReport.findMany({
      where: { patientId: req.user!.id },
      include: { results: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab reports' });
  }
});

router.get('/radiology', async (req, res) => {
  try {
    const radiology = await prisma.radiologyReport.findMany({
      where: { patientId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(radiology);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch radiology reports' });
  }
});

// --- AI Assistant & Insights ---

router.post('/ai/ask', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is missing' });
    }
    const patientId = req.user!.id;

    // Fetch patient context for better AI response
    const [conditions, medications, lastConsultation] = await Promise.all([
      prisma.condition.findMany({ where: { patientId }, select: { name: true } }),
      prisma.prescription.findMany({ 
        where: { patientId, status: 'Dispensed' }, 
        include: { items: true },
        take: 1
      }),
      prisma.consultation.findFirst({ 
        where: { patientId }, 
        orderBy: { startTime: 'desc' },
        select: { provisionalDiagnosis: true, finalDiagnosis: true, treatmentPlan: true }
      })
    ]);

    const context = {
      conditions: conditions.map(c => c.name),
      currentMeds: medications[0]?.items.map(i => i.medicineName) || [],
      diagnosis: lastConsultation?.finalDiagnosis || lastConsultation?.provisionalDiagnosis || 'N/A',
      plan: lastConsultation?.treatmentPlan || 'N/A'
    };

    const ai = getAiClient();
    
    const prompt = `You are a helpful, empathetic healthcare assistant for a patient portal.
    Patient Context:
    - Chronic Conditions: ${context.conditions.join(', ')}
    - Medications: ${context.currentMeds.join(', ')}
    - Recent Diagnosis: ${context.diagnosis}
    - Treatment Plan: ${context.plan}

    Patient Question: "${query}"

    Instructions:
    - Explain in simple, non-technical language.
    - Provide educational information about diagnoses, medications, lifestyle, and nutrition.
    - NEVER diagnose new diseases.
    - NEVER prescribe medication or change dosages.
    - NEVER recommend dangerous treatments.
    - Always include a reminder to consult their healthcare provider.
    - Be supportive and concise.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    const text = result.text;

    await logActivity(patientId, req.user!.name, 'AI Assistant Used', `Asked: ${query.substring(0, 50)}...`);
    res.json({ response: text });
  } catch (error: any) {
    console.error('AI Error:', error);
    const errMsg = error?.message || 'Unknown server/AI error';
    res.json({ 
      response: `The AI service is temporarily unavailable. This is usually caused by an unconfigured or invalid GEMINI_API_KEY on the live server. \n\nDiagnostic: ${errMsg}\n\nIf you are the developer/admin, please ensure that GEMINI_API_KEY is correctly set in your environment variables/secrets on the hosted platform (e.g., Vercel / Cloud Run) and redeploy the application.` 
    });
  }
});

router.get('/ai/insights', async (req, res) => {
  try {
    const patientId = req.user!.id;
    
    // Fetch records for insight generation
    const [vitals, conditions, medications] = await Promise.all([
      prisma.vitalsLog.findMany({ where: { patientId }, orderBy: { recordedAt: 'desc' }, take: 10 }),
      prisma.condition.findMany({ where: { patientId } }),
      prisma.prescription.findMany({ where: { patientId, status: 'Dispensed' }, include: { items: true }, take: 5 })
    ]);

    const vitalsStr = vitals.map(v => `${v.recordedAt.toISOString().split('T')[0]}: BP ${v.bloodPressure}, HR ${v.heartRate}, Weight ${v.weight}kg`).join('\n');
    const medsStr = medications.flatMap(p => p.items.map(i => i.medicineName)).join(', ');

    const ai = getAiClient();
    const prompt = `Analyze this patient's data and provide 3-5 personalized health insights/recommendations.
    
    Vitals History:
    ${vitalsStr}
    
    Chronic Conditions: ${conditions.map(c => c.name).join(', ')}
    Current Medications: ${medsStr}

    Format as a JSON array of objects with 'title', 'content', and 'category' (Wellness, Risk, Adherence, Preventive).
    Provide educational, lifestyle, and preventive advice only.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    let text = result.text;
    
    // Clean up JSON if necessary
    text = text?.replace(/```json|```/g, '')?.trim() || '[]';
    const insights = JSON.parse(text);

    res.json(insights);
  } catch (error: any) {
    console.error('AI Error:', error);
    const errMsg = error?.message || 'Unknown server/AI error';
    res.json([
      {
        title: "AI Configuration/Availability Issue",
        content: `Personalized insights could not be generated. Diagnostic: ${errMsg}. Please verify that GEMINI_API_KEY is properly set in the server environment variables/secrets and redeploy.`,
        category: "Risk"
      }
    ]);
  }
});

// --- Messaging ---

router.get('/messages', async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { receiverId, subject, content, isEmergency } = req.body;
    
    const message = await prisma.secureMessage.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        subject,
        content,
        isEmergency
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- Feedback & Audit ---

router.post('/feedback', async (req, res) => {
  try {
    const { category, targetId, rating, comment } = req.body;
    const feedback = await prisma.patientFeedback.create({
      data: {
        patientId: req.user!.id,
        category,
        targetId,
        rating,
        comment
      }
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// --- Education & Library ---

router.get('/education', async (req, res) => {
  try {
    const resources = await prisma.educationalResource.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch educational resources' });
  }
});

// --- Medical Records Aggregated ---

router.get('/medical-records', async (req, res) => {
  try {
    const patientId = req.user!.id;
    const [consultations, diagnoses, vitals, prescriptions, labs, radiology, labRequests] = await Promise.all([
      prisma.consultation.findMany({
        where: { patientId },
        include: { doctor: { select: { name: true, department: true } } },
        orderBy: { startTime: 'desc' }
      }),
      prisma.diagnosis.findMany({
        where: { patientId },
        orderBy: { diagnosisDate: 'desc' }
      }),
      prisma.vitalsLog.findMany({
        where: { patientId },
        orderBy: { recordedAt: 'desc' }
      }),
      prisma.prescription.findMany({
        where: { patientId },
        include: { items: true, doctor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.labReport.findMany({
        where: { patientId },
        include: { results: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.radiologyReport.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.labRequest.findMany({
        where: { patientId },
        include: { doctor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Construct a timeline from these records
    const timeline = [
      ...consultations.map(c => ({ 
        id: c.id, 
        type: 'Appointment', 
        date: c.startTime.toISOString(), 
        title: `Consultation: ${c.department || 'General'}`, 
        description: `Provisional Diagnosis: ${c.provisionalDiagnosis || 'N/A'}` 
      })),
      ...diagnoses.map(d => ({ 
        id: d.id, 
        type: 'Diagnosis', 
        date: d.diagnosisDate.toISOString(), 
        title: `Diagnosis: ${d.primaryDiagnosis}`, 
        description: d.clinicalNotes || 'No notes available' 
      })),
      ...prescriptions.map(p => ({ 
        id: p.id, 
        type: 'Prescription', 
        date: p.createdAt.toISOString(), 
        title: 'New Prescription Issued', 
        description: `Medications: ${p.items.map(i => i.medicineName).join(', ')}` 
      })),
      ...labs.map(l => ({ 
        id: l.id, 
        type: 'Lab', 
        date: l.createdAt.toISOString(), 
        title: `Lab Test Result: ${l.testName}`, 
        description: `Status: ${l.status}` 
      })),
      ...labRequests.map(lr => ({
        id: lr.id,
        type: 'LabRequest',
        date: lr.createdAt.toISOString(),
        title: `Ordered Lab Test: ${lr.testName}`,
        description: `Status: ${lr.status} • Ordered by Dr. ${lr.doctor?.name || 'Staff'}`
      })),
      ...vitals.map(v => ({
        id: v.id,
        type: 'Vitals',
        date: v.recordedAt.toISOString(),
        title: 'Vitals Recorded',
        description: `BP: ${v.bloodPressure}, HR: ${v.heartRate}`
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      consultations,
      diagnoses,
      vitals,
      prescriptions,
      labs,
      radiology,
      labRequests,
      timeline
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// --- Timeline ---

router.get('/timeline', async (req, res) => {
  try {
    const patientId = req.user!.id;
    const [appointments, diagnoses, labs, radiology, prescriptions] = await Promise.all([
      prisma.appointment.findMany({ where: { patientId } }),
      prisma.diagnosis.findMany({ where: { patientId } }),
      prisma.labReport.findMany({ where: { patientId } }),
      prisma.radiologyReport.findMany({ where: { patientId } }),
      prisma.prescription.findMany({ where: { patientId } })
    ]);

    const timeline = [
      ...appointments.map(a => ({ id: a.id, type: 'Appointment', date: a.dateTime, title: a.reason, status: a.status })),
      ...diagnoses.map(d => ({ id: d.id, type: 'Diagnosis', date: d.diagnosisDate.toISOString(), title: d.primaryDiagnosis, status: d.status })),
      ...labs.map(l => ({ id: l.id, type: 'Lab', date: l.createdAt.toISOString(), title: l.testName, status: l.status })),
      ...radiology.map(r => ({ id: r.id, type: 'Radiology', date: r.createdAt.toISOString(), title: r.studyType, status: r.status })),
      ...prescriptions.map(p => ({ id: p.id, type: 'Prescription', date: p.createdAt.toISOString(), title: 'New Prescription', status: p.status }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// --- Medication Reminders ---

router.get('/medication-reminders', async (req, res) => {
  try {
    const patientId = req.user!.id;
    const reminders = await prisma.medicationReminder.findMany({
      where: { patientId },
      include: { adherenceLogs: { orderBy: { timestamp: 'desc' }, take: 10 } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

router.post('/medication-reminders', async (req, res) => {
  try {
    const patientId = req.user!.id;
    const { medicineName, dosage, time, frequency, prescriptionId } = req.body;
    const reminder = await prisma.medicationReminder.create({
      data: {
        patientId,
        medicineName,
        dosage,
        time,
        frequency,
        prescriptionId
      }
    });
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

router.patch('/medication-reminders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, lastTaken } = req.body;
    const reminder = await prisma.medicationReminder.update({
      where: { id },
      data: { isActive, lastTaken }
    });
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

router.post('/medication-reminders/:id/log', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const log = await prisma.adherenceLog.create({
      data: {
        reminderId: id,
        status
      }
    });
    
    if (status === 'Taken') {
      await prisma.medicationReminder.update({
        where: { id },
        data: { lastTaken: new Date() }
      });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log adherence' });
  }
});

export default router;
