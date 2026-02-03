
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { User, Business, Transaction, AppState, BusinessType } from './types';
import { Button, Card, Input, StatBox } from './components/UI';
import { supabase } from './services/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  PlusCircle, 
  MinusCircle, 
  TrendingUp, 
  TrendingDown, 
  User as UserIcon, 
  Store, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  LogOut,
  ChevronLeft,
  Search,
  ChevronDown,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Database,
  Copy,
  Check,
  XCircle,
  WifiOff,
  Phone,
  RefreshCw,
  Timer,
  MapPin,
  Lock,
  Unlock,
  Users
} from 'lucide-react';
import { getBusinessInsight } from './services/geminiService';

// --- Constants ---
const STORAGE_KEY = 'digishe_app_data_v2';

const initialState: AppState = {
  user: null,
  business: null,
  transactions: []
};

// --- SQL Setup Script ---
const SQL_SETUP = `-- Copy this to Supabase SQL Editor and click RUN
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  name text,
  is_admin boolean DEFAULT false,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  location text,
  is_active boolean DEFAULT false,
  start_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text CHECK (type IN ('sale', 'expense')),
  amount numeric NOT NULL,
  category text,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Basic Policies for MVP
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Access Businesses" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Public Access Transactions" ON public.transactions FOR ALL USING (true);

-- Migration for existing tables:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
-- ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;`;

// --- Helper Functions ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '233' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '233' + cleaned;
  }
  return cleaned;
};

const getWeeklyData = (transactions: Transaction[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDate(d);
  }).reverse();

  return last7Days.map(date => {
    const daily = transactions.filter(t => t.date === date);
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: date,
      sales: daily.filter(t => t.type === 'sale').reduce((acc, t) => acc + t.amount, 0),
      expenses: daily.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
    };
  });
};

const mapArkeselError = (code: string | number) => {
  const codeStr = String(code);
  const errors: Record<string, string> = {
    '1005': 'Invalid phone format. Please enter a valid number.',
    '1007': 'SMS service is currently unavailable. Contact support.',
    '1104': 'Incorrect verification code. Please try again.',
    '1105': 'Code expired. Please request a new one.',
  };
  return errors[codeStr] || `Error: ${codeStr}`;
};

// --- Components ---

const LogoutConfirmModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <Card className="max-w-sm w-full p-8 text-center space-y-6 shadow-2xl border-none">
      <div className="flex justify-center">
        <div className="bg-rose-50 p-4 rounded-full text-rose-500">
          <LogOut size={40} />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Log Out?</h2>
        <p className="text-slate-500">Are you sure you want to end your session and log out of DigiShe?</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button variant="primary" size="lg" className="w-full !bg-rose-500 hover:!bg-rose-600" onClick={onConfirm}>
          Yes, Log Out
        </Button>
        <button onClick={onCancel} className="py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">
          Cancel
        </button>
      </div>
    </Card>
  </div>
);

const DatabaseSetupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database size={24} />
            <h2 className="text-xl font-bold">Database Setup Guide</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
            <AlertCircle className="shrink-0" size={18} />
            <p>You <strong>must</strong> run this script in Supabase once to create the tables, or your authentication will fail.</p>
          </div>
          <div className="relative group">
            <div className="absolute right-4 top-4 z-10">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy SQL Script'}
              </button>
            </div>
            <pre className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre leading-relaxed h-[250px]">
              {SQL_SETUP}
            </pre>
          </div>
          <Button onClick={onClose} className="w-full">
            I've Run the Script
          </Button>
        </div>
      </Card>
    </div>
  );
};

// --- Pending Activation Page ---
const PendingActivationPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Card className="max-w-md w-full p-10 space-y-8 shadow-xl border-none">
        <div className="flex justify-center">
          <div className="bg-amber-50 p-6 rounded-full text-amber-500 animate-pulse">
            <Timer size={64} />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Reviewing Your Account</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Welcome to DigiShe! Our team is reviewing your business details. You will be activated shortly.
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3 text-left">
          <AlertCircle className="text-purple-600 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-slate-600">This helps us keep DigiShe safe for all entrepreneurs. You'll gain full access once your account is verified.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            <RefreshCw size={18} /> Check Status
          </Button>
          <button onClick={onLogout} className="text-slate-400 font-bold hover:text-rose-500 transition-colors py-2">
            Sign Out
          </button>
        </div>
      </Card>
    </div>
  );
};

// --- Admin Dashboard Page ---
const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAllBusinesses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          profiles:user_id (phone, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user.isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchAllBusinesses();
  }, [user]);

  const toggleActivation = async (businessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ is_active: !currentStatus })
        .eq('id', businessId);
      
      if (error) throw error;
      setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, is_active: !currentStatus } : b));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-purple-700 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black">DigiShe Admin</h1>
              <p className="text-purple-200 text-xs font-bold uppercase tracking-widest">Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="!text-white !border-white/30 hover:!bg-white/10" onClick={() => navigate('/dashboard')}>
              Main App
            </Button>
            <button onClick={onLogout} className="p-2 hover:text-rose-300 transition-colors">
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-6 flex-1">
        <Card className="overflow-hidden p-0 border-none shadow-xl">
          <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Managed Businesses</h2>
            <Button size="sm" onClick={fetchAllBusinesses} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh List
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Business & Owner</th>
                  <th className="px-6 py-4">Type / Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {businesses.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No businesses found.</td>
                  </tr>
                ) : (
                  businesses.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{b.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <UserIcon size={12} /> {b.profiles?.name} • {b.profiles?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-tighter mr-2">{b.type}</span>
                        <span className="text-xs text-slate-400 font-medium">{b.location || 'No location'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {b.is_active ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant={b.is_active ? 'outline' : 'primary'} 
                          className={b.is_active ? '!text-rose-500 !border-rose-100 hover:!bg-rose-50' : ''}
                          onClick={() => toggleActivation(b.id, b.is_active)}
                        >
                          {b.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                          {b.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

// --- Auth Page ---
const AuthPage: React.FC<{ 
  onAuthComplete: (userData: any) => void;
  onMissingTables: () => void;
}> = ({ onAuthComplete, onMissingTables }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleContinue = async () => {
    if (mode === 'register' && !name) {
      setError('Please enter your full name');
      return;
    }
    
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { action: 'send', phone: normalized, mode: mode }
      });

      if (funcError) {
        let errorMessage = funcError.message;
        if (errorMessage.toLowerCase().includes('profiles') && errorMessage.toLowerCase().includes('not found')) {
          onMissingTables();
          setIsLoading(false);
          return;
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (response?.code === 'USER_NOT_FOUND') {
        setError("Account not found. Click 'Register' below to create a new account.");
        setIsLoading(false);
        return;
      }

      if (response?.code === 'USER_ALREADY_EXISTS') {
        setError("Account already exists. Click 'Sign in' below to access your account.");
        setIsLoading(false);
        return;
      }

      if (response?.code === '1000' || response?.code === 1000) {
        setStep('otp');
        setResendTimer(60); 
      } else {
        setError(mapArkeselError(response?.code || 'unknown'));
      }
    } catch (err: any) {
      setError(err.message || 'Connection lost.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isLoading) return;
    setError('');
    setIsLoading(true);
    const normalized = normalizePhone(phone);

    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { action: 'send', phone: normalized, mode: mode }
      });

      if (funcError) {
        setError(funcError.message);
        setIsLoading(false);
        return;
      }

      if (response?.code === '1000' || response?.code === 1000) {
        setResendTimer(60); 
        setOtp('');
        setError('New code sent successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        setError(mapArkeselError(response?.code || 'unknown'));
      }
    } catch (err: any) {
      setError(err.message || 'Resend failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError('');
    const normalized = normalizePhone(phone);
    
    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { action: 'verify', phone: normalized, code: otp, name }
      });

      if (funcError) {
        setError(funcError.message);
        setIsLoading(false);
        return;
      }

      if (response?.success) {
        onAuthComplete(response.profile);
      } else {
        setError(mapArkeselError(response?.code || '1104'));
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-xl">
            <Store className="text-purple-600 w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black">DigiShe</h1>
          <p className="text-purple-100 text-lg font-medium">Digital bookkeeping for women entrepreneurs</p>
        </div>
        <Card className="p-8 space-y-6 text-slate-900">
          {step === 'input' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <div className="space-y-4">
                {mode === 'register' && (
                  <Input 
                    label="Full Name" 
                    placeholder="Enter your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="e.g. 0503088600" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-medium text-left border border-rose-100 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">Notice</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              <Button size="xl" className="w-full" onClick={handleContinue} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>Continue <ArrowRight size={20} /></>}
              </Button>
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                disabled={isLoading}
                className="text-purple-600 font-bold hover:underline disabled:opacity-50 pt-2"
              >
                {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign in"}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex justify-center">
                <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                  <ShieldCheck size={40} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800 text-center">Verify Phone</h2>
                <p className="text-slate-500 text-sm text-center">Code sent to <span className="font-bold text-slate-700">{normalizePhone(phone)}</span></p>
              </div>
              <div className="flex justify-center gap-2">
                <input 
                  type="text" maxLength={6}
                  className="w-full max-w-[220px] text-center text-3xl font-black tracking-[0.2em] py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  value={otp} placeholder="000000"
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading} autoFocus
                />
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <div className="w-full flex justify-center">
                  <button 
                    onClick={handleResend}
                    disabled={resendTimer > 0 || isLoading}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${resendTimer === 0 && !isLoading ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 active:scale-95' : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'}`}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend OTP Message'}
                  </button>
                </div>
              </div>

              {error && (
                <p className={`text-sm font-medium text-center ${error.includes('successfully') ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {error}
                </p>
              )}
              
              <Button size="xl" className="w-full" onClick={handleVerifyOtp} disabled={otp.length < 6 || isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Verify & Sign In'}
              </Button>
              
              <button onClick={() => setStep('input')} disabled={isLoading} className="text-slate-400 font-medium hover:text-slate-600 flex items-center justify-center gap-1 w-full pt-2">
                <ChevronLeft size={16} /> Edit Phone Number
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// --- Onboarding ---
const OnboardingPage: React.FC<{ onComplete: (business: Business) => Promise<void> }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<BusinessType>('Food');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const businessTypes: BusinessType[] = ['Food', 'Fashion', 'Trading', 'Production', 'Services'];

  const handleSubmit = async () => {
    setIsSaving(true);
    setError('');
    try {
      await onComplete({ name, type, location, startDate: new Date().toISOString(), isActive: false });
    } catch (err: any) {
      setError(err.message || 'Failed to save business info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900">Tell us about your business</h2>
          <p className="text-slate-500">Let's set up your digital ledger</p>
        </div>
        <Card className="space-y-6">
          <Input label="Business Name" placeholder="e.g. Mama's Kitchen" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
          <Input label="Business Location" placeholder="e.g. Makola Market, Accra" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isSaving} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Business Category</label>
            <div className="grid grid-cols-2 gap-2">
              {businessTypes.map(t => (
                <button 
                  key={t} type="button" disabled={isSaving} onClick={() => setType(t)} 
                  className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${type === t ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}
          <Button size="xl" className="w-full" onClick={handleSubmit} disabled={!name || isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <>Create My Business <ArrowRight size={20} /></>}
          </Button>
        </Card>
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard: React.FC<{ 
  state: AppState; 
  onLogout: () => void;
  insight: string;
}> = ({ state, onLogout, insight }) => {
  const navigate = useNavigate();
  const stats = useMemo(() => {
    const sales = state.transactions.filter(t => t.type === 'sale').reduce((acc, t) => acc + t.amount, 0);
    const expenses = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { sales, expenses, balance: sales - expenses };
  }, [state.transactions]);

  const chartData = useMemo(() => getWeeklyData(state.transactions), [state.transactions]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-6 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-xl">
              <Store className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{state.business?.name}</h1>
                {state.user?.isAdmin && (
                  <button onClick={() => navigate('/admin')} className="p-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors">
                    <ShieldCheck size={18} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">{state.business?.type}</p>
                {state.business?.location && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <MapPin size={10} /> {state.business.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-all active:scale-90">
            <LogOut size={24} />
          </button>
        </div>
      </header>
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none text-white overflow-hidden relative shadow-lg">
          <Sparkles className="absolute -right-4 -top-4 text-white/10 w-32 h-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-yellow-300" />
              <p className="text-sm font-bold text-purple-100 uppercase tracking-widest">Business Tip</p>
            </div>
            <p className="text-lg font-medium leading-relaxed italic">"{insight}"</p>
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Total Sales" value={`$${stats.sales.toLocaleString()}`} color="bg-emerald-500" icon={<TrendingUp size={20} />} />
          <StatBox label="Expenses" value={`$${stats.expenses.toLocaleString()}`} color="bg-rose-500" icon={<TrendingDown size={20} />} />
          <StatBox label="Balance" value={`$${stats.balance.toLocaleString()}`} color="bg-purple-500" icon={<UserIcon size={20} />} />
        </div>
        <Card className="flex flex-col gap-4">
          <h3 className="font-bold text-slate-800">Weekly Performance</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 px-1">Recent Transactions</h3>
          <div className="space-y-3">
            {state.transactions.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic">No transactions yet. Start recording!</p>
            ) : (
              state.transactions.slice().reverse().slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'sale' ? <PlusCircle size={18} /> : <MinusCircle size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{t.category || t.type}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${t.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'sale' ? '+' : '-'}${t.amount.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-8 safe-area-bottom">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
          <Button variant="sale" size="lg" className="w-full" onClick={() => navigate('/record/sale')}><PlusCircle size={20} /> Record Sale</Button>
          <Button variant="expense" size="lg" className="w-full" onClick={() => navigate('/record/expense')}><MinusCircle size={20} /> Record Expense</Button>
        </div>
      </div>
    </div>
  );
};

// --- Record Transaction Page ---
const RecordPage: React.FC<{ 
  type: 'sale' | 'expense'; 
  onSave: (amount: number, category: string) => void;
}> = ({ type, onSave }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0 && category) {
      onSave(val, category);
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className={`p-8 rounded-full mb-6 ${type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          <CheckCircle2 size={64} />
        </div>
        <h2 className="text-4xl font-black mb-2">{type === 'sale' ? 'Sale' : 'Expense'} Recorded!</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-6 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Record {type === 'sale' ? 'Sale' : 'Expense'}</h2>
      </header>
      <main className="p-6 space-y-6 max-w-2xl mx-auto w-full">
        <Card className="space-y-6">
          <Input label="Category" placeholder="e.g. Rent, Wholesale" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input label="Amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button size="xl" variant={type === 'sale' ? 'sale' : 'expense'} className="w-full" onClick={handleSave}>
            Save {type === 'sale' ? 'Sale' : 'Expense'}
          </Button>
        </Card>
      </main>
    </div>
  );
};

// --- Record Route Handler ---
const RecordRouteHandler: React.FC<{
  user: User | null;
  business: Business | null;
  onSave: (type: 'sale' | 'expense', amount: number, category: string) => void;
}> = ({ user, business, onSave }) => {
  const { type } = useParams<{ type: string }>();
  
  if (!user || !user.hasCompletedOnboarding || !business?.isActive) {
    return <Navigate to="/login" replace />;
  }

  // Fallback to sale if something goes wrong, but correctly identify expense
  const finalType = type === 'expense' ? 'expense' : 'sale';

  return <RecordPage type={finalType} onSave={(amt, cat) => onSave(finalType, amt, cat)} />;
};

// --- Main App ---
export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialState;
    } catch (e) { return initialState; }
  });
  const [insight, setInsight] = useState("Keep up the great work!");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.business?.isActive && state.transactions.length > 0) {
      getBusinessInsight(state.business, state.transactions).then(setInsight);
    }
  }, [state.business, state.transactions]);

  useEffect(() => {
    if (state.user?.phoneNumber) fetchDataFromSupabase(state.user.phoneNumber);
  }, [state.user?.phoneNumber]);

  const fetchDataFromSupabase = async (phone: string) => {
    const normalized = normalizePhone(phone);
    setIsSyncing(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('phone', normalized).maybeSingle();
      if (profile) {
        const { data: business } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
        let transactions: any[] = [];
        if (business) {
          const { data: txs } = await supabase.from('transactions').select('*').eq('business_id', business.id);
          transactions = txs || [];
        }
        setState(prev => ({
          ...prev,
          user: { phoneNumber: normalized, name: profile.name, isAdmin: profile.is_admin, hasCompletedOnboarding: profile.has_completed_onboarding },
          business: business ? { id: business.id, name: business.name, type: business.type as BusinessType, location: business.location, isActive: business.is_active, startDate: business.start_date } : null,
          transactions: transactions.map(t => ({ id: t.id, userId: normalized, type: t.type, amount: t.amount, category: t.category, date: t.date }))
        }));
      }
    } catch (err) { console.error("Sync error:", err); } 
    finally { setIsSyncing(false); }
  };

  const handleOnboarding = async (business: Business) => {
    if (!state.user) return;
    const normalized = normalizePhone(state.user.phoneNumber);
    const { data: profile } = await supabase.from('profiles').select('id').eq('phone', normalized).single();
    if (profile) {
      const { data: newBiz, error: bizError } = await supabase.from('businesses').insert({ 
        user_id: profile.id, 
        name: business.name, 
        type: business.type, 
        location: business.location,
        is_active: false,
        start_date: business.startDate 
      }).select().single();
      
      if (bizError) throw bizError;
      const { error: profileError } = await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', profile.id);
      if (profileError) throw profileError;
      
      setState(prev => ({ 
        ...prev, 
        business: { ...business, id: newBiz.id, isActive: false }, 
        user: prev.user ? { ...prev.user, hasCompletedOnboarding: true } : null 
      }));
    }
  };

  const addTransaction = async (type: 'sale' | 'expense', amount: number, category: string) => {
    if (!state.user || !state.business) return;
    const normalized = normalizePhone(state.user.phoneNumber);
    const tempId = Math.random().toString(36).substr(2, 9);
    const dateStr = formatDate(new Date());
    const newTx: Transaction = { id: tempId, userId: normalized, type, amount, category, date: dateStr };
    setState(prev => ({ ...prev, transactions: [...prev.transactions, newTx] }));
    const { data: profile } = await supabase.from('profiles').select('id').eq('phone', normalized).single();
    if (profile) {
      const { data: biz } = await supabase.from('businesses').select('id').eq('user_id', profile.id).single();
      if (biz) await supabase.from('transactions').insert({ business_id: biz.id, type, amount, category, date: dateStr });
    }
  };

  const performLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...initialState });
    setInsight("Keep up the great work!");
    setShowLogoutConfirm(false);
  };

  const user = state.user;
  const business = state.business;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <AuthPage onAuthComplete={(p) => setState(prev => ({...prev, user: { phoneNumber: p.phone, name: p.name, isAdmin: p.is_admin, hasCompletedOnboarding: p.has_completed_onboarding }}))} onMissingTables={() => setShowSetup(true)} /> : (user.hasCompletedOnboarding ? (business?.isActive ? <Navigate to="/dashboard" replace /> : <Navigate to="/pending" replace />) : <Navigate to="/onboarding" replace />)} />
        <Route path="/onboarding" element={user ? (user.hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <OnboardingPage onComplete={handleOnboarding} />) : <Navigate to="/login" replace />} />
        <Route path="/pending" element={user?.hasCompletedOnboarding ? (business?.isActive ? <Navigate to="/dashboard" replace /> : <PendingActivationPage onLogout={() => setShowLogoutConfirm(true)} />) : <Navigate to="/login" replace />} />
        <Route path="/admin" element={user?.isAdmin ? <AdminDashboard user={user} onLogout={() => setShowLogoutConfirm(true)} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={user?.hasCompletedOnboarding ? (business?.isActive ? <Dashboard state={state} onLogout={() => setShowLogoutConfirm(true)} insight={insight} /> : <Navigate to="/pending" replace />) : <Navigate to="/login" replace />} />
        <Route path="/record/:type" element={<RecordRouteHandler user={user} business={business} onSave={addTransaction} />} />
        <Route path="*" element={<Navigate to={user ? (user.hasCompletedOnboarding ? (business?.isActive ? "/dashboard" : "/pending") : "/onboarding") : "/login"} replace />} />
      </Routes>
      {showSetup && <DatabaseSetupModal onClose={() => setShowSetup(false)} />}
      {showLogoutConfirm && <LogoutConfirmModal onConfirm={performLogout} onCancel={() => setShowLogoutConfirm(false)} />}
    </HashRouter>
  );
}
