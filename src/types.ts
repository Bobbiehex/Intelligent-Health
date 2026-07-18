export interface User {
  id: string;
  email: string;
  name: string;
  role: 'DOCTOR' | 'PATIENT' | 'RECEPTIONIST' | 'PHARMACIST' | 'LABORATORY' | 'ADMIN' | 'NURSE';
  dob?: string | null;
  phone?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  genotype?: string | null;
  medicalHistoryNotes?: string | null;
  patientId?: string | null;
  mrn?: string | null;
  department?: string | null;
  vitalsLogs?: VitalsLog[];
  conditions?: Condition[];
  allergies?: Allergy[];
  patientAppointments?: Appointment[];
  patientPrescriptions?: Prescription[];
  labReports?: LabReport[];
  radiologyReports?: RadiologyReport[];
  consultations?: Consultation[];
  diagnoses?: Diagnosis[];
  activeQueueItem?: QueueItem;
}

export interface Consultation {
  id: string;
  appointmentId?: string | null;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  department: string;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  physicalExamination?: string | null;
  provisionalDiagnosis?: string | null;
  finalDiagnosis?: string | null;
  treatmentPlan?: string | null;
  followUpInstructions?: string | null;
  notes?: string | null;
  status: 'In Progress' | 'Completed';
  aiRecommendations?: AIRecommendation[];
}

export interface AIRecommendation {
  id: string;
  consultationId: string;
  type: string;
  recommendation: string;
  confidenceScore: number;
  explanation?: string | null;
  clinicalReasoning?: string | null;
  supportingRationale?: string | null;
  possibleRisks?: string | null;
  alternatives?: string | null;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Partially Accepted';
  createdAt: string;
  feedback?: RLFeedback | null;
}

export interface RLFeedback {
  id: string;
  recommendationId: string;
  rating: number;
  feedbackText?: string | null;
  rejectionReason?: string | null;
  doctorAction: 'Accept' | 'Reject' | 'Partial';
  timestamp: string;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  doctorId: string;
  primaryDiagnosis: string;
  secondaryDiagnosis?: string | null;
  icdCode?: string | null;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  clinicalNotes?: string | null;
  status: 'Active' | 'Resolved' | 'Chronic';
  diagnosisDate: string;
}

export interface RadiologyReport {
  id: string;
  patientId: string;
  studyType: string;
  orderedBy: string;
  status: 'Pending' | 'Completed';
  findings?: string | null;
  impression?: string | null;
  imageUrls?: string | null;
  aiInterpretation?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Appointment' | 'Lab' | 'Radiology' | 'Emergency' | 'AI';
  isRead: boolean;
  createdAt: string;
}

export interface VitalsLog {
  id: string;
  patientId: string;
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  bloodSugar?: number | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  recordedBy: string;
  recordedAt: string;
}

export interface Condition {
  id: string;
  patientId: string;
  name: string;
  notes?: string | null;
  diagnosedBy: string;
  diagnosedAt: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notedBy: string;
  notedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string | null;
  receptionistId?: string | null;
  dateTime: string;
  reason: string;
  status: string;
  type?: string | null;
  department?: string | null;
  consultationRoom?: string | null;
  priority?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  patient?: { name: string };
  doctor?: { name: string; department?: string | null };
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'Pending Dispense' | 'Dispensed';
  aiInteractionWarnings?: string | null;
  createdAt: string;
  items: PrescriptionItem[];
  patient?: { name: string; dob?: string | null };
  doctor?: { name: string };
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
  drugType?: string | null;
}

export interface LabReport {
  id: string;
  patientId: string;
  testName: string;
  orderedBy: string;
  status: 'Pending' | 'Completed';
  notes?: string | null;
  aiInterpretation?: string | null;
  createdAt: string;
  results: LabResultItem[];
  patient?: { name: string; dob?: string | null };
}

export interface LabResultItem {
  id: string;
  labReportId: string;
  parameter: string;
  value: string;
  unit: string;
  referenceRange?: string | null;
  isAbnormal: boolean;
}

export interface MedicineInventory {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStockLevel: number;
  price: number;
}

export interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  tokenNumber: number;
  status: string;
  checkedInAt: string;
  calledAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface SecureMessage {
  id: string;
  senderId: string;
  receiverId: string;
  subject?: string | null;
  content: string;
  attachments?: string | null;
  isRead: boolean;
  isEmergency: boolean;
  createdAt: string;
  sender?: { name: string; role: string };
  receiver?: { name: string; role: string };
}

export interface PatientFeedback {
  id: string;
  patientId: string;
  category: string;
  targetId?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  content: string;
  category: string;
  type: string;
  mediaUrl?: string | null;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}
