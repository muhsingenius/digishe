
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Business, Transaction, Saving, AppState, BusinessType } from './types';
import { Button, Card, Input, StatBox } from './components/UI';
import { supabase } from './services/supabase';
import { db } from './services/db';
import { Dexie } from 'dexie';
import { 
  PlusCircle, 
  MinusCircle, 
  TrendingUp, 
  TrendingDown, 
  Store, 
  ArrowRight,
  Sparkles, 
  LogOut, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  WifiOff,
  CloudUpload,
  CloudCheck,
  RefreshCw,
  Timer,
  Plus,
  PiggyBank,
  Building2,
  FileX,
  Smartphone,
  Globe,
  CheckCircle,
  Zap,
  ShieldCheck,
  BarChart3,
  Award,
  CircleCheckBig,
  Ellipsis,
  Banknote,
  SlidersHorizontal,
  Mic,
  Heart,
  Users,
  MessageSquare,
  User as UserIcon,
  UserPlus,
  LayoutGrid,
  Check,
  Quote,
  Home,
  Mail,
  MapPin,
  ChevronRight,
  Wallet,
  Calendar,
  ChevronDown,
  Shield,
  Settings,
  Lock,
  Trash2,
  Edit2,
  History,
  Search,
  Filter
} from 'lucide-react';
import { getBusinessInsight } from './services/geminiService';

// --- Constants ---
const STORAGE_KEY = 'digishe_app_data_v4';
const SALES_CATEGORIES = ['Product sold', 'Service rendered', 'Other sales'];
const EXPENSE_CATEGORIES = ['Materials', 'Transport', 'Rent', 'Light Bill', 'Water Bill', 'Food', 'Other expenses'];
const SAVINGS_DESTINATIONS = ['Bank', 'Mobile Money', 'Other'];

const initialState: AppState = {
  user: null,
  business: null,
  transactions: [],
  savings: [],
  customCategories: [],
  entryCount: 0,
  showCategoryPrompt: false,
  isOnline: navigator.onLine,
  isSyncing: false
};

// --- Helper Functions ---
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('233')) cleaned = cleaned.substring(3);
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  return '233' + cleaned;
};

// --- Admin Dashboard Components ---

const AdminDashboard: React.FC<{ state: AppState; onLogout: () => void }> = ({ state, onLogout }) => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBusinesses = async () => {
    setIsRefreshing(true);
    try {
      // Fetch businesses joined with profiles
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          profiles:user_id (name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (e) {
      console.error("Failed to fetch businesses:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const toggleBusinessStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <header className="bg-purple-600 px-6 py-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-2xl text-white">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">DigiShe Admin</h1>
            <p className="text-purple-200 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Platform Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold border border-white/20 transition-all"
          >
            Main App
          </button>
          <button onClick={onLogout} className="text-white hover:text-rose-200 transition-colors">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto -mt-8">
        <Card className="rounded-[2.5rem] shadow-xl border-none p-0 overflow-hidden">
          <div className="p-8 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Managed Businesses</h2>
            <button 
              onClick={fetchBusinesses}
              disabled={isRefreshing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Business & Owner</th>
                  <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Type / Location</th>
                  <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-purple-600" size={40} />
                        <p className="text-slate-400 font-bold">Fetching business records...</p>
                      </div>
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <p className="text-slate-400 font-bold">No businesses found on the platform.</p>
                    </td>
                  </tr>
                ) : (
                  businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 text-base tracking-tight">{biz.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                            <UserIcon size={12} className="text-slate-400" />
                            <span>{biz.profiles?.name || 'User'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{biz.profiles?.phone || 'Unknown'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                            {biz.type}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">{biz.location || 'No Location'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${biz.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${biz.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{biz.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => toggleBusinessStatus(biz.id, biz.is_active)}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${biz.is_active ? 'border-purple-200 text-purple-600 hover:bg-purple-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          {biz.is_active ? <Lock size={14} /> : <Zap size={14} />}
                          {biz.is_active ? 'Deactivate' : 'Activate'}
                        </button>
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

// --- Dashboard Components ---

const PerformanceChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const data = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = formatDate(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const daySales = transactions
        .filter(t => t.type === 'sale' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
        
      result.push({ 
        name: dayName, 
        sales: parseFloat(daySales.toFixed(2)), 
        expenses: parseFloat(dayExpenses.toFixed(2)) 
      });
    }
    return result;
  }, [transactions]);

  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            hide 
            domain={[0, (dataMax: number) => Math.max(10, dataMax * 1.1)]}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc', radius: 4 }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              padding: '12px'
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 0' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={40} 
            iconType="circle" 
            iconSize={8}
            formatter={(value) => <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{value}</span>}
          />
          <Bar 
            dataKey="expenses" 
            fill="#f43f5e" 
            radius={[6, 6, 0, 0]} 
            name="Expenses" 
            barSize={18} 
            animationDuration={1500}
            animationBegin={200}
          />
          <Bar 
            dataKey="sales" 
            fill="#10b981" 
            radius={[6, 6, 0, 0]} 
            name="Sales" 
            barSize={18} 
            animationDuration={1500}
            animationBegin={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard: React.FC<{ 
  state: AppState; 
  onLogout: () => void; 
  insight: string;
  syncStatus: 'idle' | 'syncing' | 'success';
  unsyncedCount: number;
  handleManualSync: () => void;
}> = ({ state, onLogout, insight, syncStatus, unsyncedCount, handleManualSync }) => {
  const navigate = useNavigate();
  
  const stats = useMemo(() => {
    const sales = state.transactions.filter(t => t.type === 'sale').reduce((acc, t) => acc + t.amount, 0);
    const expenses = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalSavings = state.savings.reduce((acc, s) => acc + s.amount, 0);
    return { 
      sales, 
      expenses, 
      balance: sales - expenses,
      savings: totalSavings
    };
  }, [state.transactions, state.savings]);

  return (
    <div className="pb-40 bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-[150] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2.5 rounded-2xl text-white shadow-lg shadow-purple-200">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{state.business?.name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">{state.business?.type}</span>
              <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${state.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                <Globe size={10} />
                {state.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state.user?.isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all border border-purple-100 uppercase tracking-widest"
            >
              <Shield size={14} />
              Admin Portal
            </button>
          )}
          <button 
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing' || !state.isOnline}
            className="bg-slate-50 hover:bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all border border-slate-100 uppercase tracking-widest"
          >
            {syncStatus === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
            SYNC NOW
          </button>
          <button onClick={onLogout} className="p-2.5 bg-white text-slate-400 hover:text-rose-500 transition-all rounded-xl border border-slate-100 shadow-sm">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Insight Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={120} /></div>
          <div className="flex gap-4 relative z-10">
            <div className="shrink-0 w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
              <Sparkles size={32} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Business Wisdom</p>
              <p className="text-base font-medium leading-relaxed italic opacity-95">"{insight}"</p>
            </div>
          </div>
        </div>

        {/* Primary Balance Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md">
            <div className="w-16 h-16 bg-purple-100 rounded-[1.5rem] flex items-center justify-center text-purple-600">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
              <p className="text-3xl font-black text-slate-900 leading-none">${stats.balance.toFixed(0)}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer transition-all hover:shadow-md hover:border-purple-100" onClick={() => navigate('/record/savings')}>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-100 rounded-[1.5rem] flex items-center justify-center text-indigo-600">
                <PiggyBank size={32} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">My Savings</p>
                <p className="text-3xl font-black text-slate-900 leading-none">${stats.savings.toLocaleString()}</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-slate-300 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500">
              <div className="bg-emerald-500 p-2 rounded-xl text-white">
                <TrendingUp size={24} />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Sales</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">${stats.sales.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500">
              <div className="bg-rose-500 p-2 rounded-xl text-white">
                <TrendingDown size={24} />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Expenses</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">${stats.expenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Performance Chart Card */}
        <Card className="rounded-[3rem] p-10 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-900 text-lg tracking-tight">Weekly Performance</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business Pulse</span>
            </div>
          </div>
          <PerformanceChart transactions={state.transactions} />
        </Card>

        {/* Recent Activity */}
        <div className="space-y-4 px-2">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-400 text-[12px] uppercase tracking-[0.2em]">Recent Activity</h3>
            <button 
              onClick={() => navigate('/history')}
              className="text-[12px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors flex items-center gap-1"
            >
              <History size={14} />
              View History
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.transactions.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold text-base">You haven't added any records yet.</p>
              </div>
            ) : (
              state.transactions.slice().reverse().slice(0, 10).map(t => (
                <div key={t.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${t.type === 'sale' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                      {t.type === 'sale' ? <Plus size={24} strokeWidth={3} /> : <MinusCircle size={24} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-base leading-tight mb-1">{t.category}</p>
                      <p className="text-xs text-slate-400 font-bold">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`font-black text-xl tracking-tighter ${t.type === 'sale' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.type === 'sale' ? '+' : '-'}${t.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/record/sale')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1rem] py-5 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
          >
            <PlusCircle size={20} />
            Sale
          </button>
          <button 
            onClick={() => navigate('/record/expense')}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-[1rem] py-5 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-500/10"
          >
            <MinusCircle size={20} />
            Expense
          </button>
          <button 
            onClick={() => navigate('/record/savings')}
            className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-[1rem] py-5 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <PiggyBank size={20} />
            Savings
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...JSON.parse(saved), isOnline: navigator.onLine, isSyncing: false } : initialState;
    } catch (e) { return initialState; }
  });
  const [insight, setInsight] = useState("Record-keeping is the first step to success!");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncingAfterLogin, setIsSyncingAfterLogin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [deletionCount, setDeletionCount] = useState(0);

  useEffect(() => {
    const fetchDeletionCount = async () => {
      const count = await db.pending_deletions.count();
      setDeletionCount(count);
    };
    fetchDeletionCount();
  }, [state.transactions.length, state.savings.length]); // Rough proxy for refresh

  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const initialize = async () => {
      const profile = await db.profiles.toCollection().first();
      const business = await db.businesses.toCollection().first();
      const transactions = await db.transactions.toArray();
      const savings = await db.savings.toArray();

      if (profile) {
        setState(prev => ({
          ...prev,
          user: { phoneNumber: profile.phone, name: profile.name, isAdmin: profile.is_admin, hasCompletedOnboarding: profile.has_completed_onboarding },
          business: business || null,
          transactions,
          savings,
          entryCount: transactions.length
        }));
      }
      if (navigator.onLine && profile) await hydrateFromRemote(profile.phone);
      setTimeout(() => setIsInitializing(false), 800);
    };
    initialize();
  }, []);

  useEffect(() => {
    const fetchInsight = async () => {
      if (state.business && state.transactions.length > 0) {
        const text = await getBusinessInsight(state.business, state.transactions);
        setInsight(text);
      }
    };
    fetchInsight();
  }, [state.business, state.transactions.length]);

  const hydrateFromRemote = async (phone: string) => {
    try {
      const normalized = normalizePhone(phone);
      const { data: profile } = await supabase.from('profiles').select('*').eq('phone', normalized).maybeSingle();
      if (!profile) return;
      const { data: business } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
      let onboardingStatus = profile.has_completed_onboarding;
      let bizData: Business | null = null;
      let txData: Transaction[] = [];
      let svData: Saving[] = [];

      if (business) {
        onboardingStatus = true;
        const { data: txs } = await supabase.from('transactions').select('*').eq('business_id', business.id);
        const { data: svs } = await supabase.from('savings').select('*').eq('business_id', business.id);
        bizData = { id: business.id, name: business.name, type: business.type as BusinessType, location: business.location, isActive: business.is_active, startDate: business.start_date, synced: true };
        txData = (txs || []).map(t => ({ id: t.id, userId: normalized, businessId: business.id, type: t.type, amount: parseFloat(t.amount), category: t.category, date: t.date, synced: true }));
        svData = (svs || []).map(s => ({ id: s.id, businessId: business.id, amount: parseFloat(s.amount), destination: s.destination, date: s.date, synced: true }));
        await db.businesses.put(bizData);
        await db.transactions.bulkPut(txData);
        await db.savings.bulkPut(svData);
      }
      await db.profiles.put({ phone: profile.phone, name: profile.name, is_admin: profile.is_admin, has_completed_onboarding: onboardingStatus });
      setState(prev => ({ ...prev, user: { phoneNumber: profile.phone, name: profile.name, isAdmin: profile.is_admin, hasCompletedOnboarding: onboardingStatus }, business: bizData, transactions: txData, savings: svData, entryCount: txData.length }));
    } catch (e) { console.error("Hydration failed:", e); }
  };

  const handleManualSync = async () => {
    if (!state.user || !state.business || !state.isOnline) return;
    setSyncStatus('syncing');
    try {
      // Process pending deletions first
      const deletions = await db.pending_deletions.toArray();
      for (const del of deletions) {
        const table = del.type === 'transaction' ? 'transactions' : 'savings';
        const { error } = await supabase.from(table).delete().eq('id', del.id);
        if (!error) {
          await db.pending_deletions.delete(del.id);
        }
      }

      const toSyncTxs = state.transactions.filter(t => !t.synced);
      const toSyncSvs = state.savings.filter(s => !s.synced);
      const toSyncBiz = !state.business.synced ? state.business : null;

      if (toSyncBiz) {
        await supabase.from('businesses').upsert({ id: toSyncBiz.id, name: toSyncBiz.name, type: toSyncBiz.type, location: toSyncBiz.location, is_active: toSyncBiz.isActive, start_date: toSyncBiz.startDate });
        await db.businesses.update(toSyncBiz.id, { synced: true });
      }
      if (toSyncTxs.length > 0) {
        const payload = toSyncTxs.map(t => ({ id: t.id, business_id: t.businessId, type: t.type, amount: t.amount, category: t.category, date: t.date }));
        await supabase.from('transactions').upsert(payload);
        for (const t of toSyncTxs) await db.transactions.update(t.id, { synced: true });
      }
      if (toSyncSvs.length > 0) {
        const payload = toSyncSvs.map(s => ({ id: s.id, business_id: s.businessId, amount: s.amount, destination: s.destination, date: s.date }));
        await supabase.from('savings').upsert(payload);
        for (const s of toSyncSvs) await db.savings.update(s.id, { synced: true });
      }
      const updatedTxs = state.transactions.map(t => ({ ...t, synced: true }));
      const updatedSvs = state.savings.map(s => ({ ...s, synced: true }));
      setState(prev => ({ ...prev, transactions: updatedTxs, savings: updatedSvs, business: prev.business ? { ...prev.business, synced: true } : null }));
      
      const remainDeletions = await db.pending_deletions.count();
      setDeletionCount(remainDeletions);

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) { console.error("Sync failed:", error); setSyncStatus('idle'); }
  };

  const addTransaction = async (type: 'sale' | 'expense' | 'savings', amount: number, category: string) => {
    if (!state.business) return;
    const dateStr = formatDate(new Date());
    
    if (type === 'savings') {
      const newSaving: Saving = {
        id: crypto.randomUUID(),
        businessId: state.business.id,
        amount,
        destination: (category as 'Bank' | 'Mobile Money') || 'Bank',
        date: dateStr,
        synced: false
      };
      await db.savings.add(newSaving);
      setState(prev => ({ ...prev, savings: [...prev.savings, newSaving] }));
    } else {
      const newTx: Transaction = { id: crypto.randomUUID(), userId: state.user?.phoneNumber || 'unknown', businessId: state.business.id, type, amount, category, date: dateStr, synced: false };
      await db.transactions.add(newTx);
      setState(prev => ({ ...prev, transactions: [...prev.transactions, newTx], entryCount: prev.entryCount + 1 }));
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await db.transactions.delete(id);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
        entryCount: prev.entryCount - 1
      }));
      
      let syncSuccess = false;
      if (state.isOnline) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) syncSuccess = true;
      }
      
      if (!syncSuccess) {
        await db.pending_deletions.put({ id, type: 'transaction' });
        setDeletionCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const updateTransaction = async (id: string, type: 'sale' | 'expense', amount: number, category: string) => {
    try {
      const existing = state.transactions.find(t => t.id === id);
      if (!existing) return;

      const updated: Transaction = {
        ...existing,
        amount,
        category,
        synced: false
      };

      await db.transactions.update(id, updated);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === id ? updated : t)
      }));

      if (state.isOnline) {
        await supabase.from('transactions').upsert({
          id: updated.id,
          business_id: updated.businessId,
          type: updated.type,
          amount: updated.amount,
          category: updated.category,
          date: updated.date
        });
        await db.transactions.update(id, { synced: true });
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => t.id === id ? { ...updated, synced: true } : t)
        }));
      }
    } catch (e) {
      console.error("Update failed:", e);
    }
  };

  const deleteSaving = async (id: string) => {
    try {
      await db.savings.delete(id);
      setState(prev => ({
        ...prev,
        savings: prev.savings.filter(s => s.id !== id)
      }));
      
      let syncSuccess = false;
      if (state.isOnline) {
        const { error } = await supabase.from('savings').delete().eq('id', id);
        if (!error) syncSuccess = true;
      }
      
      if (!syncSuccess) {
        await db.pending_deletions.put({ id, type: 'saving' });
        setDeletionCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Delete saving failed:", e);
    }
  };

  const updateSaving = async (id: string, amount: number, destination: 'Bank' | 'Mobile Money') => {
    try {
      const existing = state.savings.find(s => s.id === id);
      if (!existing) return;

      const updated: Saving = {
        ...existing,
        amount,
        destination,
        synced: false
      };

      await db.savings.update(id, updated);
      setState(prev => ({
        ...prev,
        savings: prev.savings.map(s => s.id === id ? updated : s)
      }));

      if (state.isOnline) {
        await supabase.from('savings').upsert({
          id: updated.id,
          business_id: updated.businessId,
          amount: updated.amount,
          destination: updated.destination,
          date: updated.date
        });
        await db.savings.update(id, { synced: true });
        setState(prev => ({
          ...prev,
          savings: prev.savings.map(s => s.id === id ? { ...updated, synced: true } : s)
        }));
      }
    } catch (e) {
      console.error("Update saving failed:", e);
    }
  };

  const performLogout = async () => { 
    localStorage.clear();
    await Dexie.delete('DigiSheDB');
    window.location.href = '/'; 
  };

  if (isInitializing) return <SplashScreen />;
  const unsyncedCount = state.transactions.filter(t => !t.synced).length + state.savings.filter(s => !s.synced).length + deletionCount;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Routes>
          <Route path="/" element={<LandingPage user={state.user} />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={isSyncingAfterLogin ? <SplashScreen /> : (!state.user ? <AuthPage onAuthComplete={async (p: any) => { setIsSyncingAfterLogin(true); const normalized = normalizePhone(p.phone); await db.profiles.put(p); setState(prev => ({...prev, user: { phoneNumber: normalized, name: p.name, isAdmin: p.is_admin, hasCompletedOnboarding: p.has_completed_onboarding } })); if (navigator.onLine) await hydrateFromRemote(normalized); setIsSyncingAfterLogin(false); }} onMissingTables={() => {}} initialMode="login" /> : (state.user.hasCompletedOnboarding ? (state.business?.isActive ? <Navigate to="/dashboard" replace /> : <Navigate to="/pending" replace />) : <Navigate to="/onboarding" replace />))} />
          <Route path="/register" element={isSyncingAfterLogin ? <SplashScreen /> : (!state.user ? <AuthPage onAuthComplete={async (p: any) => { setIsSyncingAfterLogin(true); const normalized = normalizePhone(p.phone); await db.profiles.put(p); setState(prev => ({...prev, user: { phoneNumber: normalized, name: p.name, isAdmin: p.is_admin, hasCompletedOnboarding: p.has_completed_onboarding } })); if (navigator.onLine) await hydrateFromRemote(normalized); setIsSyncingAfterLogin(false); }} onMissingTables={() => {}} initialMode="register" /> : (state.user.hasCompletedOnboarding ? (state.business?.isActive ? <Navigate to="/dashboard" replace /> : <Navigate to="/pending" replace />) : <Navigate to="/onboarding" replace />))} />
          <Route path="/onboarding" element={state.user ? <OnboardingPage onComplete={async (biz) => { const id = crypto.randomUUID(); const fullBiz: Business = { id, name: biz.name || 'My Business', type: biz.type || 'Food', location: biz.location, isActive: true, startDate: biz.startDate || formatDate(new Date()), synced: false }; const normalized = normalizePhone(state.user!.phoneNumber); await db.profiles.update(normalized, { has_completed_onboarding: true }); if (navigator.onLine) await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('phone', normalized); await db.businesses.add(fullBiz); setState(prev => ({ ...prev, business: fullBiz, user: prev.user ? { ...prev.user, hasCompletedOnboarding: true } : null })); }} /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={state.user ? (state.business?.isActive ? <Dashboard state={state} onLogout={() => setShowLogoutConfirm(true)} insight={insight} syncStatus={syncStatus} unsyncedCount={unsyncedCount} handleManualSync={handleManualSync} /> : <Navigate to="/pending" replace />) : <Navigate to="/login" replace />} />
          <Route path="/record/:type" element={state.user ? <RecordRouteHandler state={state} onSave={addTransaction} /> : <Navigate to="/login" />} />
          <Route path="/pending" element={state.user ? <PendingActivationPage onLogout={() => setShowLogoutConfirm(true)} /> : <Navigate to="/login" />} />
          <Route path="/history" element={state.user ? <HistoryPage state={state} onDeleteTransaction={deleteTransaction} onDeleteSaving={deleteSaving} /> : <Navigate to="/login" />} />
          <Route path="/edit/:type/:id" element={state.user ? <RecordRouteHandler state={state} onSave={addTransaction} onUpdate={updateTransaction} onUpdateSaving={updateSaving} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={state.user?.isAdmin ? <AdminDashboard state={state} onLogout={() => setShowLogoutConfirm(true)} /> : <Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showLogoutConfirm && <LogoutConfirmModal onConfirm={performLogout} onCancel={() => setShowLogoutConfirm(false)} />}
    </HashRouter>
  );
}

const RecordRouteHandler: React.FC<{ 
  state: AppState, 
  onSave: (type: 'sale' | 'expense' | 'savings', amount: number, category: string) => void;
  onUpdate?: (id: string, type: 'sale' | 'expense', amount: number, category: string) => void;
  onUpdateSaving?: (id: string, amount: number, destination: 'Bank' | 'Mobile Money') => void;
}> = ({ state, onSave, onUpdate, onUpdateSaving }) => {
  const { type, id } = useParams<{ type: 'sale' | 'expense' | 'savings', id?: string }>();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      if (type === 'savings') {
        const saving = state.savings.find(s => s.id === id);
        if (saving) {
          setAmount(saving.amount.toString());
          setCategory(saving.destination);
        }
      } else {
        const transaction = state.transactions.find(t => t.id === id);
        if (transaction) {
          setAmount(transaction.amount.toString());
          setCategory(transaction.category);
        }
      }
    }
  }, [isEditing, id, state.transactions, state.savings, type]);

  const getCategories = () => {
    if (type === 'sale') return SALES_CATEGORIES;
    if (type === 'expense') return EXPENSE_CATEGORIES;
    if (type === 'savings') return SAVINGS_DESTINATIONS;
    return [];
  };
  
  const categories = getCategories();
  
  const lastFive = useMemo(() => {
    if (type === 'savings') return state.savings.slice().reverse().slice(0, 5);
    return state.transactions.filter(t => t.type === type).slice().reverse().slice(0, 5);
  }, [state.transactions, state.savings, type]);
  
  const handleSave = () => { 
    if (amount && category) { 
      if (isEditing) {
        if (type === 'savings' && onUpdateSaving) {
          onUpdateSaving(id!, parseFloat(amount), category as 'Bank' | 'Mobile Money');
        } else if ((type === 'sale' || type === 'expense') && onUpdate) {
          onUpdate(id!, type, parseFloat(amount), category);
        }
        setSuccessMessage('Record updated successfully!');
        setShowSuccess(true);
        setTimeout(() => navigate(-1), 1500);
      } else {
        onSave(type as 'sale' | 'expense' | 'savings', parseFloat(amount), category); 
        setAmount('');
        setCategory('');
        setSuccessMessage('Record saved successfully!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } 
  };

  const getThemeColor = () => {
    if (type === 'sale') return 'text-emerald-500';
    if (type === 'expense') return 'text-rose-500';
    return 'text-indigo-600';
  };

  const getButtonVariant = () => {
    if (type === 'sale') return 'sale';
    if (type === 'expense') return 'expense';
    return 'primary';
  };

  const getBorderColor = () => {
    if (type === 'sale') return 'focus:border-emerald-500 ring-emerald-500/10';
    if (type === 'expense') return 'focus:border-rose-500 ring-rose-500/10';
    return 'focus:border-indigo-500 ring-indigo-500/10';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-4 right-4 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-200 flex items-center gap-3 border-2 border-white pointer-events-auto">
              <CheckCircle size={20} />
              <span className="font-black text-sm uppercase tracking-widest">{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-6 py-4 bg-white border-b flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={22}/>
        </button>
        <h1 className="text-lg font-black text-slate-900 tracking-tight capitalize leading-none">{isEditing ? 'Edit' : 'Record'} {type}</h1>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-8 mt-4">
        <Card className="p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 bg-white">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 ml-1">{type === 'savings' ? 'Destination' : 'Category'}</label>
            <div className="relative group">
              <input 
                list="categories"
                placeholder={type === 'savings' ? "Select destination" : "Select or type category"}
                className={`w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-medium text-slate-600 outline-none transition-all focus:bg-white ${getBorderColor()} focus:ring-4`}
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
              <datalist id="categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 ml-1">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="0.00" 
                className={`w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-2xl outline-none transition-all focus:bg-white ${getBorderColor()} focus:ring-4 ${getThemeColor()}`} 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
            </div>
          </div>

          <Button 
            variant={getButtonVariant()} 
            size="xl" 
            className={`w-full py-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] font-black text-white ${type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : type === 'sale' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-purple-600 hover:bg-purple-700'}`} 
            onClick={handleSave} 
            disabled={!amount || !category}
          >
            {isEditing ? 'Update' : 'Save'} {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        </Card>

        {!isEditing && (
          <div className="space-y-4 px-2 pb-12">
            <div className="flex items-center gap-2">
              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-slate-400">
                <Calendar size={16} />
              </div>
              <h3 className="font-black text-slate-900 text-[13px] uppercase tracking-[0.2em]">Last 5 {type}s</h3>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-4 bg-slate-50 border-b border-slate-100">
                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</div>
                <div className="col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</div>
                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</div>
              </div>
              
              {lastFive.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-400 font-bold">No records found for this category yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {lastFive.map((t: any) => (
                    <div key={t.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50 transition-colors">
                      <div className="col-span-3 text-[13px] font-bold text-slate-500">
                        {formatDisplayDate(t.date)}
                      </div>
                      <div className="col-span-6 text-[13px] font-black text-slate-900 text-center">
                        {t.category || (t.destination && `Saved to ${t.destination}`)}
                      </div>
                      <div className={`col-span-3 text-[14px] font-black text-right ${getThemeColor()}`}>
                        ${parseFloat(t.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const PendingActivationPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-8">
    <div className="bg-amber-50 p-10 rounded-[3rem] text-amber-500 animate-pulse shadow-xl shadow-amber-100"><Timer size={80} /></div>
    <div className="space-y-4 max-w-sm"><h2 className="text-4xl font-black text-slate-900 leading-tight">Activation Pending</h2><p className="text-slate-500 font-medium">Our team is reviewing your business details. This usually takes less than 24 hours.</p></div>
    <div className="w-full max-w-xs space-y-4"><Button className="w-full py-5 rounded-2xl" onClick={() => window.location.reload()}><RefreshCw size={20} /> Refresh</Button><button onClick={onLogout} className="text-slate-400 font-black uppercase text-[10px]">Sign Out</button></div>
  </div>
);

const LogoutConfirmModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
    <Card className="w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-8">
      <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-rose-500"><LogOut size={48} /></div>
      <div className="space-y-2"><h3 className="text-3xl font-black text-slate-900">Sign Out?</h3><p className="text-slate-500 font-medium">Make sure you have synced all your data first.</p></div>
      <div className="flex flex-col gap-3"><Button variant="expense" size="xl" className="py-5 rounded-2xl" onClick={onConfirm}>Yes, Sign Out</Button><Button variant="outline" size="lg" className="rounded-2xl py-4" onClick={onCancel}>Cancel</Button></div>
    </Card>
  </div>
);

// --- New components to resolve missing names ---

const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center space-y-6 z-[2000]">
    <div className="bg-purple-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-purple-200 animate-bounce">
      <Store size={64} />
    </div>
    <div className="space-y-2">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight">DigiShe</h2>
      <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Empowering Her Business</p>
    </div>
    <Loader2 className="animate-spin text-purple-600 mt-8" size={32} />
  </div>
);

const LandingPage: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white font-['Outfit']">
      {/* Navigation */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-[#7c3aed] p-1.5 rounded-lg text-white">
            <Store size={22} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">DigiShe</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-[#7c3aed] transition-colors">About</a>
          <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-[#7c3aed] transition-colors">Features</a>
          <button 
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 hover:bg-[#6d28d9] transition-all"
          >
            {user ? 'My Dashboard' : 'Get Started'}
          </button>
        </div>
        <button className="md:hidden text-slate-600">
          <SlidersHorizontal size={24} />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-[#7c3aed] rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
              <Award size={14} />
              Built by women, for women
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Digital record-keeping <span className="text-[#7c3aed]">made simple</span> for women-led businesses
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              Track sales, expenses, and savings — even with no digital skills. Offline-first and designed for micro-entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/register')}
                className="bg-[#7c3aed] text-white px-10 py-5 rounded-2xl text-base font-black shadow-xl shadow-purple-200 hover:bg-[#6d28d9] transition-all active:scale-95"
              >
                Get Started <ArrowRight size={20} className="inline ml-1" />
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="bg-white text-[#7c3aed] border-2 border-purple-200 px-10 py-5 rounded-2xl text-base font-black hover:bg-purple-50 transition-all active:scale-95"
              >
                Join the Pilot
              </button>
            </div>
          </div>

          <div className="relative">
            {/* App UI Illustration mockup */}
            <div className="bg-[#eef2ff] p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#7c3aed] p-2 rounded-xl text-white">
                    <Store size={20} />
                  </div>
                  <span className="font-bold text-slate-900">Business Hub</span>
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                      <TrendingUp size={10} />
                      Daily Sales
                    </div>
                    <p className="text-xl font-black text-slate-900">GHS420.00</p>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">
                      <TrendingDown size={10} />
                      Expenses
                    </div>
                    <p className="text-xl font-black text-slate-900">GHS120.00</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Savings Target: 70% reached</p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7c3aed] w-[70%]" />
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute bottom-6 left-6 bg-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-100 animate-bounce">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <WifiOff size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 leading-none mb-1">Offline Ready</p>
                  <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Works without data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Reality for MSMEs Section */}
      <section className="px-6 py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">The Reality for MSMEs</h2>
            <p className="text-lg text-slate-500 font-medium">Most women-led businesses are trapped in a cycle of informal cash trading.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <FileX className="text-rose-400" />, title: "No Records", desc: "Thousands of women run businesses without any structured paper or digital records." },
              { icon: <Banknote className="text-rose-400" />, title: "Blocked Loans", desc: "Without income history, it's impossible to access formal bank loans or credit." },
              { icon: <Settings className="text-rose-400" />, title: "Complex Tools", desc: "Existing accounting apps are built for experts, not for first-time digital users." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900">{item.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
              DigiSHE is a digital tool for the modern woman trader.
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              We've stripped away the complexity of traditional bookkeeping to create an experience that feels as natural as sending a message.
            </p>
            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
              <div className="flex items-center gap-3">
                <div className="text-[#7c3aed]"><WifiOff size={24} /></div>
                <span className="font-bold text-slate-900">Offline-First</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[#7c3aed]"><Smartphone size={24} /></div>
                <span className="font-bold text-slate-900">USSD Enabled</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[#7c3aed]"><Heart size={24} /></div>
                <span className="font-bold text-slate-900">Beginner Friendly</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[#7c3aed]"><Users size={24} /></div>
                <span className="font-bold text-slate-900">Community Driven</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-[#7c3aed] p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl shadow-purple-300 overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Mic size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">New Feature</p>
                    <h3 className="text-xl font-black">Voice-Based Logging</h3>
                  </div>
                </div>
                <p className="text-xl font-medium leading-relaxed opacity-90">
                  "Record my sale for today: 2 bags of maize, 50 Cedis each." DigiSHE processes your voice into a clean record automatically.
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-[#7c3aed] backdrop-blur-md" />
                    ))}
                  </div>
                  <p className="text-sm font-bold opacity-70 italic">Used by 500+ traders</p>
                </div>
              </div>
              
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Zap size={180} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Different from Day One section */}
      <section className="px-6 py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {[
              { icon: <SlidersHorizontal />, title: "Co-Created", desc: "Built alongside women entrepreneurs in Northern Ghana." },
              { icon: <TrendingUp />, title: "Growth Ready", desc: "Designed for business expansion, not just basic accounting." },
              { icon: <ShieldCheck />, title: "Data Secure", desc: "Your records are encrypted and always yours to control." },
              { icon: <Users />, title: "Community led", desc: "Local onboarding specialists ensure no one is left behind." }
            ].map((card, i) => (
              <Card key={i} className="p-6 md:p-8 space-y-4 border-none shadow-sm rounded-[2rem]">
                <div className="text-[#7c3aed]">{card.icon}</div>
                <h4 className="font-black text-slate-900">{card.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </Card>
            ))}
          </div>
          
          <div className="space-y-10">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Built different from day one.</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Unlike global tools, DigiSHE is localized for your context. We focus on "Growth Readiness" — preparing you to approach banks with confidence.
            </p>
            <div className="space-y-4">
              {[
                "No data? Record via USSD code",
                "Low literacy? Use voice commands",
                "No bank account? We help you start one"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-900 font-bold">
                  <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check size={16} /></div>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for? Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto text-center space-y-16">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">Who is it for?</h2>
          <p className="text-lg text-slate-500 font-medium">We support women at every stage of their business journey.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Market Traders", desc: "Fast logging for busy markets" },
            { title: "Fashion Designers", desc: "Track expensive fabric inputs" },
            { title: "Rural Farmers", desc: "Offline records for remote areas" },
            { title: "Small Producers", desc: "Monitor material costs & sales" }
          ].map((persona, i) => (
            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 space-y-4 group hover:border-[#7c3aed] transition-colors cursor-default">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 group-hover:bg-purple-50 group-hover:text-[#7c3aed] transition-all">
                <UserIcon size={24} />
              </div>
              <h4 className="font-black text-slate-900 text-lg">{persona.title}</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{persona.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="px-6 py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Simple Tools, Big Results</h2>
            <p className="text-lg text-slate-500 font-medium">Everything you need, nothing you don't.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Zap />, title: "Sales in Seconds", desc: "Tap and log. Record daily sales as they happen, no paper required." },
              { icon: <PiggyBank />, title: "Savings Tracking", desc: "Categorize your savings into Bank or Mobile Money for a clear overview." },
              { icon: <BarChart3 />, title: "Weekly Summary", desc: "See how your business performed each week with simple, colorful charts." },
              { icon: <Smartphone />, title: "Works Everywhere", desc: "Use our mobile app or standard USSD on any basic phone." },
              { icon: <UserPlus />, title: "No Complex Setup", desc: "Register with just your phone number. No email or password needed." },
              { icon: <Globe />, title: "Offline Sync", desc: "Records are saved locally and synced automatically when you have data." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-left space-y-4 hover:shadow-md transition-all">
                <div className="text-[#7c3aed]">{feature.icon}</div>
                <h4 className="font-black text-slate-900 text-xl">{feature.title}</h4>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="bg-[#7c3aed] py-24 px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-white space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">Our Impact Journey</h2>
              <p className="text-xl font-medium opacity-80 max-w-xl leading-relaxed">
                We are more than just an app. We are building the data bridge for financial inclusion.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-5xl md:text-7xl font-black">80%</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Digital Transition</p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl md:text-7xl font-black">15+</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Communities</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row gap-8">
            <div className="flex flex-col gap-8 flex-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Users size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black leading-none">500+ Participants</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">In our 2024 active pilot phase</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Early Indicators</p>
                {[
                  "92% increased confidence",
                  "65% better expense awareness",
                  "40% started formal bank savings"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 font-bold text-sm">
                    <div className="bg-emerald-500 p-0.5 rounded-full"><CheckCircle size={14} /></div>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">Voices of DigiSHE</h2>
          <p className="text-lg text-slate-500 font-medium">Real impact for real entrepreneurs.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { quote: "This is the first app I can actually understand. I don't need my children to help me record my sales anymore.", author: "Aisha M.", role: "Market Trader" },
            { quote: "Now I know exactly how much I spent on fabric and how much profit I made. I feel like a real CEO.", author: "Fatima K.", role: "Fashion Designer" }
          ].map((testimonial, i) => (
            <div key={i} className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm relative group hover:border-[#7c3aed] transition-colors">
              <div className="absolute top-10 right-10 text-slate-100 group-hover:text-purple-100 transition-colors">
                <Quote size={80} />
              </div>
              <div className="relative z-10 space-y-8">
                <p className="text-2xl font-medium leading-relaxed italic text-slate-700">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  <div>
                    <p className="font-black text-slate-900">{testimonial.author}</p>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none mt-1">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partners section */}
      <section className="px-6 py-16 border-t border-slate-100 text-center space-y-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Proudly Supported By</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 grayscale opacity-50">
          <div className="flex items-center gap-2 font-black text-slate-900 text-lg">
            <Smartphone size={24} />
            Northern Girl Initiative
          </div>
          <div className="flex items-center gap-2 font-black text-slate-900 text-lg">
            <Globe size={24} />
            Jameelullah Ltd
          </div>
          <div className="flex items-center gap-2 font-black text-slate-900 text-lg">
            <Users size={24} />
            Community Groups
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center space-y-12">
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">Start building your business records today</h2>
        <p className="text-xl text-slate-500 font-medium">Join the movement of women entrepreneurs taking control of their financial future.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button 
            onClick={() => navigate('/register')}
            className="bg-[#7c3aed] text-white px-10 py-5 rounded-2xl text-base font-black shadow-xl shadow-purple-200 hover:bg-[#6d28d9] transition-all"
          >
            Join the DigiSHE Pilot
          </button>
          <button 
            onClick={() => navigate('/contact')}
            className="bg-purple-50 text-[#7c3aed] px-10 py-5 rounded-2xl text-base font-black border border-purple-100 hover:bg-purple-100 transition-all"
          >
            Partner With Us
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="bg-[#7c3aed] p-1.5 rounded-lg text-white">
                <Store size={22} />
              </div>
              <span className="text-2xl font-bold tracking-tight">DigiShe</span>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
              Empowering women entrepreneurs with digital tools designed for accessibility and growth.
            </p>
          </div>
          
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Links</h5>
            <div className="flex flex-col gap-4 text-sm font-bold">
              <Link to="/login" className="hover:text-[#7c3aed] transition-colors">Login</Link>
              <Link to="/contact" className="hover:text-[#7c3aed] transition-colors">Join Pilot</Link>
              <Link to="/about" className="hover:text-[#7c3aed] transition-colors">About DigiSHE</Link>
            </div>
          </div>
          
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contact</h5>
            <div className="space-y-4 text-sm font-bold">
              <p className="text-slate-400">hello@digishe.org</p>
              <p className="text-slate-400">+233 503 088 600</p>
              <p className="text-slate-400">Tamale, Ghana</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">© 2025 DigiShe. All Rights Reserved.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-xl mx-auto space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-purple-600 transition-colors">
          <ChevronLeft size={20} />
          Back
        </button>
        <Card className="p-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Get in Touch</h2>
            <p className="text-slate-500 font-medium">Need help with your account or have questions about DigiShe?</p>
          </div>
          
          <div className="space-y-4">
            <a href="tel:0244000000" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Smartphone size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Call or WhatsApp</p>
                <p className="font-bold text-slate-900">024 400 0000</p>
              </div>
            </a>
            <a href="mailto:support@digishe.gh" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Mail size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                <p className="font-bold text-slate-900">support@digishe.gh</p>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

const AuthPage: React.FC<{ 
  onAuthComplete: (profile: any) => void; 
  onMissingTables: () => void;
  initialMode: 'login' | 'register';
}> = ({ onAuthComplete, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { action: 'send', phone, mode, name }
      });
      
      if (funcError) {
        let msg = "Failed to send OTP.";
        try {
          const body = await funcError.context?.json();
          if (body && body.error) msg = body.error;
        } catch (e) {
          msg = funcError.message || msg;
        }
        throw new Error(msg);
      }
      
      if (data.success === false) {
        setError(data.error || data.message || "Failed to send code.");
        return;
      }
      
      setStep('otp');
    } catch (e: any) {
      setError(e.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('otp-handler', {
        body: { action: 'verify', phone, code: otp, name }
      });
      
      if (funcError) {
        let msg = "Verification failed.";
        try {
          const body = await funcError.context?.json();
          if (body && body.error) msg = body.error;
        } catch (e) {
          msg = funcError.message || msg;
        }
        throw new Error(msg);
      }

      if (data.success) {
        onAuthComplete(data.profile);
      } else {
        setError(data.error || data.message || "Invalid code. Please try again.");
      }
    } catch (e: any) {
      console.error("Verification error:", e);
      setError(e.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-10 rounded-[3rem] shadow-2xl border-none space-y-8">
        <div className="text-center space-y-3">
          <div className="bg-purple-600 w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-200">
            <Store size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 font-medium">
            {step === 'phone' ? (mode === 'login' ? 'Sign in with your phone number' : 'Join the DigiShe community') : `Enter the 6-digit code sent to ${phone}`}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-shake">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="space-y-5">
          {step === 'phone' ? (
            <>
              {mode === 'register' && (
                <Input label="Full Name" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              )}
              <Input label="Phone Number" placeholder="024 XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} />
              <Button size="xl" className="w-full mt-4" onClick={handleSendOtp} disabled={loading || !phone || (mode === 'register' && !name)}>
                {loading ? <Loader2 className="animate-spin" /> : 'Send Verification Code'}
              </Button>
            </>
          ) : (
            <>
              <Input label="Verification Code" placeholder="XXXXXX" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
              <Button size="xl" className="w-full mt-4" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Continue'}
              </Button>
              <button onClick={() => setStep('phone')} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-purple-600 transition-colors">
                Change Phone Number
              </button>
            </>
          )}
        </div>

        <div className="text-center">
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setStep('phone'); setError(null); }} className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors">
            {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

const OnboardingPage: React.FC<{ onComplete: (biz: Partial<Business>) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [bizData, setBizData] = useState<Partial<Business>>({ name: '', type: 'Food', location: '', startDate: formatDate(new Date()) });

  const next = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-purple-600 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border-none space-y-8">
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full mx-1 transition-all ${i <= step ? 'bg-purple-600' : 'bg-slate-100'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Let's start!</h2>
              <p className="text-slate-500 font-medium">What is your business name?</p>
            </div>
            <Input label="Business Name" placeholder="e.g. Ama's Kitchen" value={bizData.name} onChange={e => setBizData({ ...bizData, name: e.target.value })} />
            <Button size="xl" className="w-full" onClick={next} disabled={!bizData.name}>Next Step</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">What do you do?</h2>
              <p className="text-slate-500 font-medium">Select your business type.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Food', 'Fashion', 'Trading', 'Production', 'Services'].map(type => (
                <button 
                  key={type} 
                  onClick={() => setBizData({ ...bizData, type: type as BusinessType })}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${bizData.type === type ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-slate-100 text-slate-500 hover:border-purple-200'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <Button size="xl" className="w-full" onClick={next}>Next Step</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Where are you?</h2>
              <p className="text-slate-500 font-medium">Add your business location (optional).</p>
            </div>
            <Input label="Location" placeholder="e.g. Accra, Kejetia Market" value={bizData.location} onChange={e => setBizData({ ...bizData, location: e.target.value })} />
            <div className="bg-slate-50 p-6 rounded-2xl flex items-start gap-4 text-slate-500 border border-slate-100">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0"><ShieldCheck size={20} /></div>
              <p className="text-xs font-medium leading-relaxed">By continuing, you agree to our terms. Your data is secure and will only be used to help you manage your business.</p>
            </div>
            <Button size="xl" className="w-full" onClick={() => onComplete(bizData)}>Create My Business</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

const HistoryPage: React.FC<{ 
  state: AppState; 
  onDeleteTransaction: (id: string) => void;
  onDeleteSaving: (id: string) => void;
}> = ({ state, onDeleteTransaction, onDeleteSaving }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'sale' | 'expense' | 'savings'>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'transaction' | 'saving' | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const allItems = useMemo(() => {
    const txs = state.transactions.map(t => ({ ...t, displayType: t.type as 'sale' | 'expense' }));
    const svs = state.savings.map(s => ({ ...s, displayType: 'savings' as const, category: s.destination }));
    return [...txs, ...svs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, state.savings]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesFilter = filter === 'all' || item.displayType === filter;
      const matchesSearch = item.category.toLowerCase().includes(search.toLowerCase()) || 
                           item.amount.toString().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [allItems, filter, search]);

  const confirmDelete = () => {
    if (deleteId && deleteType) {
      if (deleteType === 'transaction') onDeleteTransaction(deleteId);
      else onDeleteSaving(deleteId);
      setDeleteId(null);
      setDeleteType(null);
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <AnimatePresence>
        {showDeleteSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-4 right-4 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-rose-200 flex items-center gap-3 border-2 border-white pointer-events-auto">
              <Trash2 size={20} />
              <span className="font-black text-sm uppercase tracking-widest">Entry deleted successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-6 py-6 bg-white border-b flex flex-col gap-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
            <ChevronLeft size={22}/>
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Business History</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search category or amount..." 
              className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-purple-600 focus:bg-white outline-none transition-all font-medium text-slate-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 sm:pb-0 no-scrollbar">
            {['all', 'sale', 'expense', 'savings'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all whitespace-nowrap ${filter === f ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white border-slate-100 text-slate-400 hover:border-purple-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4 mt-4">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
              <FileX size={40} />
            </div>
            <p className="text-slate-400 font-bold">No records found matching your search.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-purple-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${item.displayType === 'sale' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : item.displayType === 'expense' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                  {item.displayType === 'sale' ? <Plus size={24} strokeWidth={3} /> : item.displayType === 'expense' ? <MinusCircle size={24} strokeWidth={3} /> : <PiggyBank size={24} strokeWidth={3} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-base leading-tight">{item.category}</p>
                    {!item.synced && <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" title="Not synced"></div>}
                  </div>
                  <p className="text-xs text-slate-400 font-bold">{formatDisplayDate(item.date)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <p className={`font-black text-xl tracking-tighter ${item.displayType === 'sale' ? 'text-emerald-500' : item.displayType === 'expense' ? 'text-rose-500' : 'text-indigo-500'}`}>
                  {item.displayType === 'sale' ? '+' : item.displayType === 'expense' ? '-' : ''}${item.amount.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 border-l pl-4 border-slate-100">
                  <button 
                    onClick={() => navigate(`/edit/${item.displayType}/${item.id}`)}
                    className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                    title="Edit entry"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => { setDeleteId(item.id); setDeleteType(item.displayType === 'savings' ? 'saving' : 'transaction'); }}
                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete entry"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {deleteId && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-8">
            <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Trash2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900">Delete Entry?</h3>
              <p className="text-slate-500 font-medium text-sm">This action cannot be undone. It will be removed from your records.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="expense" size="xl" className="py-5 rounded-2xl" onClick={confirmDelete}>
                Yes, Delete It
              </Button>
              <Button variant="outline" size="lg" className="rounded-2xl py-4" onClick={() => { setDeleteId(null); setDeleteType(null); }}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
