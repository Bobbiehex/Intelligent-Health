import { Router } from 'express';
import { prisma } from './db';
import { authenticateToken, requireRole } from './authMiddleware';
import { pharmacyAssistantAnalysis } from './gemini';

const router = Router();

// Apply authentication and role authorization to all pharmacy routes
router.use(authenticateToken);
router.use(requireRole(['PHARMACIST', 'ADMIN']));

// --- Prescription Management ---

// Get all prescriptions assigned to the pharmacy
router.get('/prescriptions', async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, name: true, patientId: true, dob: true, gender: true }
        },
        doctor: {
          select: { id: true, name: true, department: true }
        },
        items: true,
        dispensingRecords: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Update prescription status
router.put('/prescriptions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        userName: (req as any).user.name,
        role: 'PHARMACIST',
        action: 'UPDATE_PRESCRIPTION_STATUS',
        details: `Updated prescription ${id} status to ${status}`,
        severity: 'Low'
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

// --- Medication Dispensing ---

// Dispense medications
router.post('/dispense', async (req, res) => {
  try {
    const { prescriptionId, medicineId, quantity, batchNumber, expiryDate, notes, counseling } = req.body;
    const pharmacistId = (req as any).user.id;

    // 1. Validate medicine availability and expiry
    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    if (medicine.quantityInStock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
    if (medicine.status === 'EXPIRED' || medicine.status === 'RECALLED') {
      return res.status(400).json({ error: 'Cannot dispense expired or recalled medication' });
    }

    // 2. Perform transaction: Create dispensing record, update inventory, create stock movement
    const result = await prisma.$transaction(async (tx) => {
      // Create Dispensing Record
      const record = await tx.dispensingRecord.create({
        data: {
          prescriptionId,
          medicineId,
          quantityDispensed: quantity,
          batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          dispensingNotes: notes,
          counselingNotes: counseling,
          pharmacistId
        }
      });

      // Update Medicine Inventory
      const updatedMedicine = await tx.medicine.update({
        where: { id: medicineId },
        data: {
          quantityInStock: { decrement: quantity },
          status: medicine.quantityInStock - quantity <= medicine.reorderLevel ? 'LOW_STOCK' : 'AVAILABLE'
        }
      });

      // Create Stock Movement
      await tx.stockMovement.create({
        data: {
          medicineId,
          type: 'OUTWARD',
          quantity,
          previousStock: medicine.quantityInStock,
          newStock: medicine.quantityInStock - quantity,
          reason: `Dispensed for prescription ${prescriptionId}`,
          pharmacistId
        }
      });

      // Update Prescription Status if needed
      // (Simplified: mark as Dispensed for now)
      await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'Dispensed' }
      });

      return record;
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: pharmacistId,
        userName: (req as any).user.name,
        role: 'PHARMACIST',
        action: 'DISPENSE_MEDICATION',
        details: `Dispensed ${quantity} of ${medicine.name} for prescription ${prescriptionId}`,
        severity: 'Medium'
      }
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to dispense medication' });
  }
});

// --- Inventory Management ---

// Get all medicines
router.get('/inventory', async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: {
        supplier: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add new medicine
router.post('/inventory', async (req, res) => {
  try {
    const data = req.body;
    const medicine = await prisma.medicine.create({
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        userName: (req as any).user.name,
        role: 'PHARMACIST',
        action: 'ADD_MEDICINE',
        details: `Added new medicine: ${medicine.name}`,
        severity: 'Low'
      }
    });

    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

// Update medicine
router.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
      }
    });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medicine' });
  }
});

// Adjust stock
router.post('/inventory/adjust', async (req, res) => {
  try {
    const { medicineId, quantity, type, reason } = req.body;
    const pharmacistId = (req as any).user.id;

    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    const newStock = type === 'ADD' ? medicine.quantityInStock + quantity : medicine.quantityInStock - quantity;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.medicine.update({
        where: { id: medicineId },
        data: {
          quantityInStock: newStock,
          status: newStock <= 0 ? 'OUT_OF_STOCK' : (newStock <= medicine.reorderLevel ? 'LOW_STOCK' : 'AVAILABLE')
        }
      });

      await tx.stockMovement.create({
        data: {
          medicineId,
          type: type === 'ADD' ? 'INWARD' : 'ADJUSTMENT',
          quantity,
          previousStock: medicine.quantityInStock,
          newStock,
          reason,
          pharmacistId
        }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// --- Suppliers ---

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { medicines: true },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// --- Purchase Orders ---

router.get('/purchase-orders', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: true,
        pharmacist: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/purchase-orders', async (req, res) => {
  try {
    const { supplierId, items, notes, totalAmount } = req.body;
    const pharmacistId = (req as any).user.id;

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        totalAmount,
        notes,
        pharmacistId,
        items: {
          create: items
        }
      },
      include: { items: true }
    });

    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.put('/purchase-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });

    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update PO status' });
  }
});

// --- AI & Decision Support ---

router.post('/ai/analyze', async (req, res) => {
  try {
    const { query, prescriptionId, context } = req.body;
    const pharmacistId = (req as any).user.id;

    const aiResult = await pharmacyAssistantAnalysis(query, context);

    const interaction = await prisma.pharmacyAIInteraction.create({
      data: {
        prescriptionId,
        query,
        response: aiResult.response,
        confidenceScore: aiResult.confidenceScore,
        rationale: aiResult.rationale,
        safetyWarnings: aiResult.safetyWarnings,
        alternatives: aiResult.alternatives,
        pharmacistId
      }
    });

    res.json(interaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Analysis failed' });
  }
});

router.put('/ai/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedbackStatus, feedbackRating, feedbackComments, feedbackCorrection } = req.body;

    const updated = await prisma.pharmacyAIInteraction.update({
      where: { id },
      data: {
        feedbackStatus,
        feedbackRating,
        feedbackComments,
        feedbackCorrection
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// --- Analytics ---

router.get('/analytics', async (req, res) => {
  try {
    const totalPrescriptions = await prisma.prescription.count();
    const dispensedCount = await prisma.prescription.count({ where: { status: 'Dispensed' } });
    const lowStockCount = await prisma.medicine.count({ where: { status: 'LOW_STOCK' } });
    const outOfStockCount = await prisma.medicine.count({ where: { status: 'OUT_OF_STOCK' } });
    const expiredCount = await prisma.medicine.count({ where: { status: 'EXPIRED' } });

    // Recent Dispensing Activity
    const recentActivity = await prisma.dispensingRecord.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        medicine: { select: { name: true } },
        prescription: {
          include: { patient: { select: { name: true } } }
        }
      }
    });

    res.json({
      summary: {
        totalPrescriptions,
        dispensedCount,
        lowStockCount,
        outOfStockCount,
        expiredCount
      },
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
