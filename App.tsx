
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
  WifiOff
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
const SQL_SETUP = `-- Copy this to Supabase SQL Editor
CREATE TABLE public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  name text,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text CHECK (type IN ('sale', 'expense')),
  amount numeric NOT NULL,
  category text,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.transactions FOR ALL USING (true);`;

// --- Helper Functions ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];

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
    '1005': 'Invalid phone number format.',
    '1007': 'System error: Insufficient SMS balance.',
    '1104': 'The code you entered is incorrect.',
    '1105': 'This code has expired. Please request a new one.',
    '1001': 'Required information is missing.',
  };
  return errors[codeStr] || `Authentication error (Code ${codeStr})`;
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
          <p className="text-slate-600 text-sm">
            If you see connection errors, ensure you've run this SQL in your Supabase SQL Editor:
          </p>

          <div className="relative group">
            <div className="absolute right-4 top-4 z-10">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>
            <pre className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre leading-relaxed h-[300px]">
              {SQL_SETUP}
            </pre>
          </div>
          
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </Card>
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

  const handleContinue = async () => {
    if (mode === 'register' && !name) {
      setError('Please enter your full name');
      return;
    }
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Check if profile exists for Login mode
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.message.includes('relation "profiles" does not exist')) {
          onMissingTables();
          return;
        }
        throw fetchError;
      }

      if (mode === 'login' && !data) {
        setError('No account found. Please register first.');
        setIsLoading(false);
        return;
      }

      // Step 2: Trigger SMS via Edge Function
      console.log('Invoking otp-handler function...');
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { action: 'send', phone: phone }
      });

      if (funcError) {
        console.error('Edge Function Error:', funcError);
        // Specifically catch the "Failed to send a request" error which is often a CORS or 404 issue
        if (funcError.message?.includes('Failed to send a request')) {
          setError('Could not reach the authentication server. Please ensure the "otp-handler" function is deployed in your Supabase dashboard.');
        } else {
          setError(`Server Error: ${funcError.message}`);
        }
        setIsLoading(false);
        return;
      }

      if (response?.code === '1000' || response?.code === 1000) {
        setStep('otp');
      } else if (response?.error) {
        setError(response.error);
      } else {
        setError(mapArkeselError(response?.code || 'unknown'));
      }
    } catch (err: any) {
      console.error('Auth Exception:', err);
      setError(err.message || 'Connection error. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { 
          action: 'verify', 
          phone: phone, 
          code: otp, 
          name: name
        }
      });

      if (funcError) {
        setError(`Verification Error: ${funcError.message}`);
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
                <Input 
                  label="Phone Number" 
                  type="tel"
                  placeholder="e.g. 233544919953" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-medium text-left leading-relaxed border border-rose-100">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold">Error Occurred</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <Button 
                size="xl" 
                className="w-full" 
                onClick={handleContinue}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>Continue <ArrowRight size={20} /></>}
              </Button>

              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
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
                <h2 className="text-2xl font-bold text-slate-800 text-center">Enter Code</h2>
                <p className="text-slate-500 text-sm text-center">
                  We've sent a 6-digit code to <span className="font-bold text-slate-700">{phone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  className="w-full max-w-[220px] text-center text-3xl font-black tracking-[0.2em] py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  value={otp}
                  placeholder="000000"
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}

              <Button 
                size="xl" 
                className="w-full" 
                onClick={handleVerifyOtp}
                disabled={otp.length < 6 || isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Verify & Login'}
              </Button>

              <button 
                onClick={() => setStep('input')}
                disabled={isLoading}
                className="text-slate-400 font-medium hover:text-slate-600 flex items-center justify-center gap-1 w-full"
              >
                <ChevronLeft size={16} /> Edit Phone Number
              </button>
            </div>
          )}
        </Card>
        
        {/* Diagnostic Helper Link */}
        <p className="text-[10px] text-purple-200 opacity-50 font-mono">
          Project ID: hxpkierzfyotsdtldmej
        </p>
      </div>
    </div>
  );
};

// --- Record Transaction Page ---
const RecordPage: React.FC<{ 
  type: 'sale' | 'expense'; 
  onSave: (amount: number, category: string) => void;
  recentTransactions: Transaction[];
}> = ({ type, onSave, recentTransactions }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const saleCategories = ["Direct Product Sale", "Service Fee", "Wholesale", "Retail", "Subscription", "Consulting", "Other"];
  const expenseCategories = ["Rent", "Salary", "Inventory/Stock", "Utilities", "Marketing", "Travel", "Taxes", "Maintenance", "Office Supplies", "Other"];
  const categories = type === 'sale' ? saleCategories : expenseCategories;

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
        <p className="text-slate-500 text-lg">Heading back to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-6 border-b border-slate-100 sticky top-0 z-20 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Record {type === 'sale' ? 'Sale' : 'Expense'}</h2>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-2xl mx-auto w-full">
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Recent {type === 'sale' ? 'Sales' : 'Expenses'}</h3>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{t.category}</td>
                      <td className={`px-4 py-3 text-right font-bold ${type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">
                      No recent {type}s found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Card className="space-y-6">
          <SearchableDropdown 
            label="Category"
            placeholder={`Select ${type} category`}
            options={categories}
            value={category}
            onChange={setCategory}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input 
                type="number" 
                inputMode="decimal"
                className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-2xl font-black text-slate-900"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <Button 
            size="xl" 
            variant={type === 'sale' ? 'sale' : 'expense'} 
            className="w-full shadow-xl"
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0 || !category}
          >
            {type === 'sale' ? <PlusCircle size={24} /> : <MinusCircle size={24} />}
            Save {type === 'sale' ? 'Sale' : 'Expense'}
          </Button>
        </Card>
      </main>
    </div>
  );
};

// --- Searchable Dropdown ---
const SearchableDropdown: React.FC<{ 
  options: string[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
  label: string;
}> = ({ options, value, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <label className="text-sm font-semibold text-slate-700 ml-1 mb-1.5 block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-purple-500/20"
      >
        <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
            <Search size={16} className="text-slate-400" />
            <input
              className="bg-transparent border-none focus:outline-none text-sm w-full py-1"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${value === opt ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 italic">No categories found</div>
            )}
          </div>
        </div>
      )}
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
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{state.business?.name}</h1>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">{state.business?.type}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-all active:scale-90">
            <LogOut size={24} />
          </button>
        </div>
      </header>
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none text-white overflow-hidden relative">
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

// --- Onboarding ---
const OnboardingPage: React.FC<{ onComplete: (business: Business) => Promise<void> }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('Food');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const businessTypes: BusinessType[] = ['Food', 'Fashion', 'Trading', 'Production', 'Services'];

  const handleSubmit = async () => {
    setIsSaving(true);
    setError('');
    try {
      await onComplete({ name, type, startDate: new Date().toISOString() });
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Business Category</label>
            <div className="grid grid-cols-2 gap-2">
              {businessTypes.map(t => (
                <button key={t} type="button" disabled={isSaving} onClick={() => setType(t)} className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${type === t ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'}`}>{t}</button>
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

// --- Main App ---
export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialState;
    } catch (e) {
      return initialState;
    }
  });
  const [insight, setInsight] = useState("Keep up the great work!");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.business && state.transactions.length > 0) {
      getBusinessInsight(state.business, state.transactions).then(setInsight);
    }
  }, [state.business, state.transactions]);

  useEffect(() => {
    if (state.user?.phoneNumber) fetchDataFromSupabase(state.user.phoneNumber);
  }, [state.user?.phoneNumber]);

  const fetchDataFromSupabase = async (phone: string) => {
    setIsSyncing(true);
    try {
      const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('phone', phone).maybeSingle();
      if (pErr) {
        if (pErr.message.includes('relation "profiles" does not exist') || pErr.message.includes('Could not find the table')) setShowSetup(true);
        throw pErr;
      }
      if (profile) {
        const { data: business } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
        let transactions: any[] = [];
        if (business) {
          const { data: txs } = await supabase.from('transactions').select('*').eq('business_id', business.id);
          transactions = txs || [];
        }
        setState(prev => ({
          ...prev,
          user: { phoneNumber: phone, name: profile.name, hasCompletedOnboarding: profile.has_completed_onboarding },
          business: business ? { name: business.name, type: business.type, startDate: business.start_date } : null,
          transactions: transactions.map(t => ({ id: t.id, userId: phone, type: t.type, amount: t.amount, category: t.category, date: t.date }))
        }));
      }
    } catch (err) { 
      console.error("Sync error:", err); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const onAuthComplete = (profileData: any) => {
    if (profileData) {
      setState(prev => ({
        ...prev,
        user: { 
          phoneNumber: profileData.phone, 
          name: profileData.name, 
          hasCompletedOnboarding: profileData.has_completed_onboarding 
        }
      }));
    }
  };

  const handleOnboarding = async (business: Business) => {
    if (!state.user) return;
    const { data: profile } = await supabase.from('profiles').select('id').eq('phone', state.user.phoneNumber).single();
    if (profile) {
      const { error: bizError } = await supabase.from('businesses').insert({ user_id: profile.id, name: business.name, type: business.type, start_date: business.startDate });
      if (bizError) throw bizError;
      const { error: profileError } = await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', profile.id);
      if (profileError) throw profileError;
      setState(prev => ({ ...prev, business, user: prev.user ? { ...prev.user, hasCompletedOnboarding: true } : null }));
    }
  };

  const addTransaction = async (type: 'sale' | 'expense', amount: number, category: string) => {
    if (!state.user || !state.business) return;
    const tempId = Math.random().toString(36).substr(2, 9);
    const dateStr = formatDate(new Date());
    const newTx: Transaction = { id: tempId, userId: state.user.phoneNumber, type, amount, category, date: dateStr };
    setState(prev => ({ ...prev, transactions: [...prev.transactions, newTx] }));
    const { data: profile } = await supabase.from('profiles').select('id').eq('phone', state.user.phoneNumber).single();
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

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!state.user ? <AuthPage onAuthComplete={onAuthComplete} onMissingTables={() => setShowSetup(true)} /> : (state.user.hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />)} />
        <Route path="/onboarding" element={state.user ? (state.user.hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <OnboardingPage onComplete={handleOnboarding} />) : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={state.user?.hasCompletedOnboarding ? <Dashboard state={state} onLogout={() => setShowLogoutConfirm(true)} insight={insight} /> : <Navigate to="/login" replace />} />
        <Route path="/record/sale" element={state.user?.hasCompletedOnboarding ? <RecordPage type="sale" onSave={(amt, cat) => addTransaction('sale', amt, cat)} recentTransactions={state.transactions.filter(t => t.type === 'sale').slice().reverse().slice(0, 5)} /> : <Navigate to="/login" replace />} />
        <Route path="/record/expense" element={state.user?.hasCompletedOnboarding ? <RecordPage type="expense" onSave={(amt, cat) => addTransaction('expense', amt, cat)} recentTransactions={state.transactions.filter(t => t.type === 'expense').slice().reverse().slice(0, 5)} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={state.user ? (state.user.hasCompletedOnboarding ? "/dashboard" : "/onboarding") : "/login"} replace />} />
      </Routes>
      {showSetup && <DatabaseSetupModal onClose={() => setShowSetup(false)} />}
      {showLogoutConfirm && <LogoutConfirmModal onConfirm={performLogout} onCancel={() => setShowLogoutConfirm(false)} />}
      {isSyncing && (
        <div className="fixed top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 shadow-sm border border-slate-100 flex items-center gap-2 animate-pulse">
          <Loader2 size={10} className="animate-spin" /> SYNCING BACKEND
        </div>
      )}
    </HashRouter>
  );
}
