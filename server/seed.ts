import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

export async function seedDatabase() {
  try {
    // Check if we already have users
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('🌱 Database already seeded. Skipping initial seeding.');
      return;
    }

    console.log('🌱 Database is empty. Seeding initial clinical records and accounts...');

    // Hash passwords
    const adminHash = await bcrypt.hash('admin123', 10);
    const doctorHash = await bcrypt.hash('doctor123', 10);
    const nurseHash = await bcrypt.hash('nurse123', 10);
    const patientHash = await bcrypt.hash('patient123', 10);
    const recepHash = await bcrypt.hash('recep123', 10);
    const pharmHash = await bcrypt.hash('pharm123', 10);
    const labHash = await bcrypt.hash('lab123', 10);

    // 1. Create standard clinical accounts
    console.log('👤 Creating standard accounts...');
    
    // Admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@clinic.com',
        name: 'Chief Admin Arthur',
        passwordHash: adminHash,
        role: 'ADMIN'
      }
    });

    // Doctor
    const doctor = await prisma.user.create({
      data: {
        email: 'doctor@clinic.com',
        name: 'Dr. Sarah Lin',
        passwordHash: doctorHash,
        role: 'DOCTOR',
        department: 'Cardiology'
      }
    });

    // Nurse
    const nurse = await prisma.user.create({
      data: {
        email: 'nurse@clinic.com',
        name: 'Nurse Nancy',
        passwordHash: nurseHash,
        role: 'NURSE'
      }
    });

    // Patient
    const patient = await prisma.user.create({
      data: {
        email: 'patient@clinic.com',
        name: 'Bobbie Hex',
        passwordHash: patientHash,
        role: 'PATIENT',
        dob: '1990-05-15',
        phone: '+1 (555) 019-2834',
        gender: 'Female',
        bloodGroup: 'O+',
        medicalHistoryNotes: 'History of seasonal allergies. Mild asthmatic symptoms during high pollen seasons.'
      }
    });

    // Receptionist
    const receptionist = await prisma.user.create({
      data: {
        email: 'receptionist@clinic.com',
        name: 'Receptionist Clara',
        passwordHash: recepHash,
        role: 'RECEPTIONIST'
      }
    });

    // Pharmacist
    const pharmacist = await prisma.user.create({
      data: {
        email: 'pharmacist@clinic.com',
        name: 'Pharmacist David',
        passwordHash: pharmHash,
        role: 'PHARMACIST'
      }
    });

    // Lab Technician
    const labTech = await prisma.user.create({
      data: {
        email: 'lab@clinic.com',
        name: 'Lab Tech Jordan',
        passwordHash: labHash,
        role: 'LABORATORY'
      }
    });

    // 2. Create Patient Vitals Logs
    console.log('📊 Creating initial vitals logs...');
    await prisma.vitalsLog.create({
      data: {
        patientId: patient.id,
        bloodPressure: '124/82',
        heartRate: 72,
        temperature: 98.6,
        bmi: 22.4,
        recordedBy: 'Dr. Sarah Lin'
      }
    });

    // 3. Create Patient Conditions
    console.log('🩺 Creating patient conditions...');
    await prisma.condition.create({
      data: {
        patientId: patient.id,
        name: 'Essential Hypertension',
        notes: 'Mild, managed primarily by diet and physical exercises.',
        diagnosedBy: 'Dr. Sarah Lin'
      }
    });

    // 4. Create Patient Allergies
    console.log('⚠️ Creating patient allergies...');
    await prisma.allergy.create({
      data: {
        patientId: patient.id,
        allergen: 'Penicillin',
        severity: 'Moderate',
        notedBy: 'Dr. Sarah Lin'
      }
    });

    // 5. Create initial appointments
    console.log('📅 Creating initial appointments...');
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        dateTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days in future
        reason: 'Hypertension routine checkup and blood pathology review',
        status: 'Confirmed'
      }
    });

    // 6. Create Pharmacy Inventory (Formulary Stock)
    console.log('💊 Seeding pharmacy stock formulary...');
    
    // Create a Supplier first
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Global Pharma Solutions',
        company: 'Global Pharma Inc.',
        contactPerson: 'Alice Johnson',
        email: 'alice@globalpharma.com',
        phone: '+1 (555) 123-4567',
        address: '123 Pharma Way, New Jersey, NJ'
      }
    });

    const medications = [
      { 
        name: 'Lisinopril 10mg', 
        genericName: 'Lisinopril',
        category: 'Antihypertensive', 
        quantityInStock: 450, 
        unit: 'Box', 
        reorderLevel: 50, 
        purchasePrice: 10.00,
        sellingPrice: 12.50,
        dosageForm: 'Tablet',
        strength: '10mg',
        supplierId: supplier.id,
        batchNumber: 'BATCH-001',
        status: 'AVAILABLE' as any
      },
      { 
        name: 'Amoxicillin 500mg', 
        genericName: 'Amoxicillin',
        category: 'Antibiotic', 
        quantityInStock: 15, 
        unit: 'Bottle', 
        reorderLevel: 30, 
        purchasePrice: 15.00,
        sellingPrice: 18.00,
        dosageForm: 'Capsule',
        strength: '500mg',
        supplierId: supplier.id,
        batchNumber: 'BATCH-002',
        status: 'LOW_STOCK' as any
      },
      { 
        name: 'Metformin 500mg', 
        genericName: 'Metformin',
        category: 'Antidiabetic', 
        quantityInStock: 600, 
        unit: 'Box', 
        reorderLevel: 50, 
        purchasePrice: 6.50,
        sellingPrice: 8.90,
        dosageForm: 'Tablet',
        strength: '500mg',
        supplierId: supplier.id,
        batchNumber: 'BATCH-003',
        status: 'AVAILABLE' as any
      }
    ];

    for (const med of medications) {
      await prisma.medicine.create({
        data: med
      });
    }

    // Keep the old model seeded for backward compatibility if needed
    const stockItems = [
      { name: 'Lisinopril 10mg', category: 'Antihypertensive', stock: 450, unit: 'tablets', minStockLevel: 50, price: 12.50 },
      { name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 15, unit: 'capsules', minStockLevel: 30, price: 18.00 },
      { name: 'Metformin 500mg', category: 'Antidiabetic', stock: 600, unit: 'tablets', minStockLevel: 50, price: 8.90 },
      { name: 'Atorvastatin 20mg', category: 'Statin', stock: 350, unit: 'tablets', minStockLevel: 40, price: 21.00 },
      { name: 'Albuterol HFA Inhaler', category: 'Bronchodilator', stock: 8, unit: 'vials', minStockLevel: 15, price: 32.00 }
    ];

    for (const item of stockItems) {
      await prisma.medicineInventory.create({
        data: item
      });
    }

    // 7. Create Audit Log Entry
    console.log('🔍 Logging initial telemetry audit...');
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: admin.name,
        role: admin.role,
        action: 'System Initialization',
        details: 'Initial clinic records, staff credentials, patient charts, and pharmacy formulary levels populated.',
        severity: 'Low'
      }
    });

    console.log('🌱 Seeding database completed successfully!');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
  }
}
