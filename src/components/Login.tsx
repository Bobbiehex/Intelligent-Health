import React, { useState } from 'react';
import { HeartPulse, Lock, Mail, UserPlus, LogIn, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface LoginProps {
  onLoginSuccess: (data: { accessToken: string; refreshToken: string; user: any }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'DOCTOR' | 'PATIENT' | 'RECEPTIONIST' | 'PHARMACIST' | 'LABORATORY' | 'ADMIN' | 'NURSE'>('PATIENT');
  
  // Patient details
  const [dob, setDob] = useState('1990-01-01');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [history, setHistory] = useState('');
  
  // Doctor details
  const [department, setDepartment] = useState('Cardiology');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (res: Response, data: any): string => {
    if (res.status === 400) {
      return data?.error || 'Bad Request: Please check that your email and password are in the correct format.';
    }

    if (res.status === 401) {
      return data?.error || 'Session Expired or Unauthorized: Please log in again.';
    }

    if (res.status === 403) {
      const errMsg = (data?.error || '').toLowerCase();
      if (errMsg.includes('deactivated') || errMsg.includes('inactive')) {
        return 'Account Deactivated: This clinic account has been deactivated. Please contact the administrator.';
      }
      if (errMsg.includes('exist')) {
        return 'Account Not Found: This email does not exist in our clinic records.';
      }
      return data?.error || 'Invalid Credentials: The email or password you entered is incorrect.';
    }

    if (res.status === 404) {
      return 'Backend Service Offline (404): The login endpoint could not be reached. If you are running on Vercel, make sure the serverless functions are configured correctly, or verify that the node process is running on port 3000.';
    }

    if (res.status === 500) {
      if (data) {
        if (data.error === 'Configuration Error') {
          const missing = data.missingVariables ? data.missingVariables.join(', ') : 'unknown';
          return `Configuration Error (500): The server is missing critical environment variables: [${missing}]. ${data.instructions || ''}`;
        }
        const errMsg = (data.error || data.message || '').toLowerCase();
        if (
          errMsg.includes('database') ||
          errMsg.includes('prisma') ||
          errMsg.includes('query') ||
          errMsg.includes('connect')
        ) {
          return 'Database Connection Error (500): The application could not connect to the database. Please verify your DATABASE_URL environment variable is correct and your database is online.';
        }
        return data.error || data.message || 'Internal Server Error (500): An unexpected database or configuration issue occurred.';
      }
      return 'Internal Server Error (500): The server returned an empty or invalid 500 response. This usually indicates a database connectivity issue, invalid credentials, or missing JWT_SECRET environment variables.';
    }

    return data?.error || `Error (${res.status}): Something went wrong.`;
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });
      let data: any;
      try {
        data = await res.json();
      } catch (err) {
        const errorMsg = getFriendlyErrorMessage(res, null);
        throw new Error(errorMsg);
      }
      if (!res.ok) {
        const errorMsg = getFriendlyErrorMessage(res, data);
        throw new Error(errorMsg);
      }
      toast.success('Logged in successfully!');
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        const payload = {
          email,
          password,
          name,
          role,
          dob: role === 'PATIENT' ? dob : undefined,
          phone: role === 'PATIENT' ? phone : undefined,
          gender: role === 'PATIENT' ? gender : undefined,
          bloodGroup: role === 'PATIENT' ? bloodGroup : undefined,
          medicalHistoryNotes: role === 'PATIENT' ? history : undefined,
          department: role === 'DOCTOR' ? department : undefined
        };

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let data: any;
        try {
          data = await res.json();
        } catch (err) {
          const errorMsg = getFriendlyErrorMessage(res, null);
          throw new Error(errorMsg);
        }
        if (!res.ok) {
          const errorMsg = getFriendlyErrorMessage(res, data);
          throw new Error(errorMsg);
        }

        toast.success('Registration successful! Please log in.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Login flow
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        let data: any;
        try {
          data = await res.json();
        } catch (err) {
          const errorMsg = getFriendlyErrorMessage(res, null);
          throw new Error(errorMsg);
        }
        if (!res.ok) {
          const errorMsg = getFriendlyErrorMessage(res, data);
          throw new Error(errorMsg);
        }
        toast.success('Access granted to secure portal.');
        onLoginSuccess(data);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-full flex-1 bg-[#fafafa] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8"
    >
      
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-rose-500 text-white p-2.5 rounded-2xl shadow-sm">
          <HeartPulse className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-gray-900 leading-none">Intelligent Health</h1>
          <p className="text-xs font-mono text-gray-400 mt-0.5">SECURED CLINICAL ENTERPRISE SUITE</p>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm w-full"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              {isRegister ? 'Register Clinic Account' : 'Sign In'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isRegister ? 'Create standard credentials for staff or patients' : 'Provide your authorized login to enter portal'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm p-4 rounded-xl flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-sm"
                    id="reg-name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@clinic.com"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-sm"
                  id="auth-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-sm"
                  id="auth-password"
                />
              </div>
            </div>

            {isRegister && (
              <div className="border-t border-gray-50 pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Blood Cohort</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Contact</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Allergies & History Notes</label>
                    <textarea
                      value={history}
                      onChange={(e) => setHistory(e.target.value)}
                      placeholder="e.g. Asthma history, penicillin allergen..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm h-20"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-6"
              id="btn-auth-submit"
            >
              {loading ? (
                <span>Executing authentication...</span>
              ) : (
                <>
                  {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  <span>{isRegister ? 'Authorize Account Registration' : 'Secure Sign In'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-sm font-medium text-rose-500 hover:text-rose-600"
              id="btn-toggle-auth-mode"
            >
              {isRegister ? 'Already registered? Sign In' : 'Need standard patient/staff account? Register Here'}
            </button>
          </div>
        </motion.div>

        {/* Demo Fast Logins Grid */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="lg:col-span-6 bg-gray-50 border border-gray-100 p-8 rounded-3xl w-full"
        >
          <div className="mb-6">
            <h3 className="text-base font-bold tracking-tight text-gray-800">Reviewer Quick-Login Sandbox</h3>
            <p className="text-xs text-gray-500 mt-1">
              Pre-seeded clinical accounts. Click any badge to sign in instantly with strict RBAC credentials:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {demoUsers.map((u, idx) => (
              <button
                key={idx}
                onClick={() => handleDemoLogin(u.email, u.pass)}
                disabled={loading}
                className="bg-white hover:bg-rose-50/40 border border-gray-100 hover:border-rose-100 p-4 rounded-2xl text-left transition-all flex justify-between items-center group shadow-xs disabled:opacity-50"
                id={`demo-login-${idx}`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-gray-800 group-hover:text-rose-600">{u.name}</span>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                      {u.email.split('@')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{u.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-rose-400 transition-transform group-hover:translate-x-1 shrink-0 ml-4" />
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

const demoUsers = [
  { name: 'Patient (Bobbie)', email: 'patient@clinic.com', pass: 'patient123', desc: 'Symptom checker, prescriptions & lab charts' },
  { name: 'Dr. Sarah Lin', email: 'doctor@clinic.com', pass: 'doctor123', desc: 'SOAP scribe, patient records, AI Rx scanner' },
  { name: 'Nurse Nancy', email: 'nurse@clinic.com', pass: 'nurse123', desc: 'Vitals logging & nursing observation progress charts' },
  { name: 'Receptionist Clara', email: 'receptionist@clinic.com', pass: 'recep123', desc: 'Live waiting queue & slots check-in' },
  { name: 'Pharmacist David', email: 'pharmacist@clinic.com', pass: 'pharm123', desc: 'Formulary levels & dispense authorization' },
  { name: 'Lab Tech Jordan', email: 'lab@clinic.com', pass: 'lab123', desc: 'Pathology biomarker data & AI reports interpret' },
  { name: 'Chief Admin Arthur', email: 'admin@clinic.com', pass: 'admin123', desc: 'Operations analytics & system audit telemetries' }
];
