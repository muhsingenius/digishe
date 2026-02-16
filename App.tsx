
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { User, Business, Transaction, Saving, AppState, BusinessType } from './types';
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
  Users,
  Tag,
  Plus,
  Calendar,
  PiggyBank,
  Wallet,
  Building2,
  ChevronRight,
  DollarSign,
  FileX,
  Banknote,
  Settings2,
  Zap,
  LayoutDashboard,
  Mic,
  UserPlus,
  Heart,
  Quote,
  CheckCircle,
  Smartphone,
  Globe,
  Award,
  Lightbulb,
  Compass,
  ArrowUpRight,
  Home
} from 'lucide-react';
import { getBusinessInsight } from './services/geminiService';

// --- Constants ---
const STORAGE_KEY = 'digishe_app_data_v4';

const SALES_CATEGORIES = ['Product sold', 'Service rendered', 'Other sales'];
const EXPENSE_CATEGORIES = ['Materials', 'Transport', 'Rent', 'Light Bill', 'Water Bill', 'Food', 'Other expenses'];

const initialState: AppState = {
  user: null,
  business: null,
  transactions: [],
  savings: [],
  customCategories: [],
  entryCount: 0,
  showCategoryPrompt: false
};

// --- Custom Components ---

/**
 * Custom icon component that overlays a dollar sign onto the PiggyBank icon.
 */
const SavingsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <PiggyBank size={size} />
    <div className="absolute inset-0 flex items-center justify-center pt-[12%] pl-[4%] pointer-events-none">
      <span className="font-black leading-none select-none" style={{ fontSize: `${size * 0.35}px` }}>$</span>
    </div>
  </div>
);

// --- Landing Page Component ---
const LandingPage: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80; // height of the fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <Card className="hover:border-purple-200 hover:shadow-md transition-all group border-slate-100">
      <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
        <Icon size={24} />
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-2">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white selection:bg-purple-100 selection:text-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-[100] border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-purple-600 p-2 rounded-xl text-white">
              <Store size={24} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight hidden sm:inline">DigiShe</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {/* Desktop Nav Links grouped with Auth Actions */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('about')} 
                className="text-slate-600 font-bold text-sm hover:text-purple-600 transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-slate-600 font-bold text-sm hover:text-purple-600 transition-colors"
              >
                Features
              </button>
              <div className="h-6 w-px bg-slate-100 mx-2" />
            </div>

            {user ? (
              <Button size="md" onClick={() => navigate('/dashboard')}>My Dashboard</Button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-slate-600 font-bold text-sm px-2 sm:px-4 py-2 hover:text-purple-600 transition-colors">Login</button>
                <Button size="md" onClick={() => navigate('/login')} className="text-sm sm:text-base">Join Pilot</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-purple-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider">
              <Award size={14} /> Built by women, for women
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Digital record-keeping <span className="text-purple-600">made simple</span> for women-led businesses
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Track sales, expenses, and savings — even with no digital skills. Offline-first and designed for micro-entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="xl" onClick={() => navigate('/login')} className="w-full sm:w-auto">Get Started <ArrowRight size={20} /></Button>
              <Button size="xl" variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">Join the Pilot</Button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-[3rem] p-4 lg:p-12 animate-in slide-in-from-right-12 duration-1000">
               <Card className="shadow-2xl border-none p-0 overflow-hidden scale-105">
                 <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <Store size={20} />
                     <span className="font-bold">Business Hub</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full bg-white/40" />
                     <div className="w-2 h-2 rounded-full bg-white/40" />
                     <div className="w-2 h-2 rounded-full bg-white" />
                   </div>
                 </div>
                 <div className="p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="h-24 bg-emerald-50 rounded-2xl p-4 flex flex-col justify-end">
                       <TrendingUp className="text-emerald-500 mb-2" size={18} />
                       <span className="text-[10px] font-black uppercase text-emerald-700">Daily Sales</span>
                       <span className="text-lg font-black">GHS420.00</span>
                     </div>
                     <div className="h-24 bg-rose-50 rounded-2xl p-4 flex flex-col justify-end">
                       <TrendingDown className="text-rose-500 mb-2" size={18} />
                       <span className="text-[10px] font-black uppercase text-rose-700">Expenses</span>
                       <span className="text-lg font-black">GHS120.00</span>
                     </div>
                   </div>
                   <div className="bg-slate-50 h-32 rounded-2xl p-4 flex flex-col justify-center gap-2">
                     <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                       <div className="w-[70%] h-full bg-purple-600" />
                     </div>
                     <span className="text-xs font-bold text-slate-500">Savings Target: 70% reached</span>
                   </div>
                 </div>
               </Card>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100 animate-bounce duration-[3000ms]">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Offline Ready</p>
                <p className="text-[10px] text-slate-500">Works without data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">The Reality for MSMEs</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Most women-led businesses are trapped in a cycle of informal cash trading.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FileX, title: "No Records", text: "Thousands of women run businesses without any structured paper or digital records." },
              { icon: Banknote, title: "Blocked Loans", text: "Without income history, it's impossible to access formal bank loans or credit." },
              { icon: Settings2, title: "Complex Tools", text: "Existing accounting apps are built for experts, not for first-time digital users." }
            ].map((item, i) => (
              <Card key={i} className="text-center p-10 space-y-4 border-none shadow-sm">
                <div className="mx-auto bg-rose-50 text-rose-500 w-16 h-16 rounded-full flex items-center justify-center">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What is DigiSHE (About Section) */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">DigiSHE is a digital tool for the modern woman trader.</h2>
              <p className="text-lg text-slate-500 leading-relaxed font-medium">
                We've stripped away the complexity of traditional bookkeeping to create an experience that feels as natural as sending a message.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Offline-First", icon: WifiOff, color: "bg-indigo-50 text-indigo-600" },
                { label: "USSD Enabled", icon: Smartphone, color: "bg-emerald-50 text-emerald-600" },
                { label: "Beginner Friendly", icon: Heart, color: "bg-rose-50 text-rose-600" },
                { label: "Community Driven", icon: Users, color: "bg-purple-50 text-purple-600" }
              ].map((pill, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl GHS{pill.color} font-bold text-sm`}>
                  <pill.icon size={20} />
                  {pill.label}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-600 rounded-[3rem] p-12 text-white space-y-8 relative overflow-hidden">
             <Sparkles className="absolute top-0 right-0 w-32 h-32 text-white/10 -translate-y-1/2 translate-x-1/2" />
             <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-2xl">
                 <Mic size={24} />
               </div>
               <div>
                 <p className="text-sm font-bold uppercase tracking-widest opacity-70">New Feature</p>
                 <p className="text-xl font-bold">Voice-Based Logging</p>
               </div>
             </div>
             <p className="text-purple-100 font-medium text-lg leading-relaxed">
               "Record my sale for today: 2 bags of maize, 50 Cedis each." DigiSHE processes your voice into a clean record automatically.
             </p>
             <div className="pt-4">
               <div className="flex items-center -space-x-3">
                 {[1,2,3,4].map(n => (
                   <div key={n} className="w-10 h-10 rounded-full border-2 border-purple-600 bg-slate-200" />
                 ))}
                 <div className="pl-6 text-sm font-bold">Used by 500+ traders</div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Our Unique Approach Section */}
      <section className="py-24 px-6 bg-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Compass, title: "Co-Created", desc: "Built alongside women entrepreneurs in Northern Ghana." },
                  { icon: Lightbulb, title: "Growth Ready", desc: "Designed for business expansion, not just basic accounting." },
                  { icon: ShieldCheck, title: "Data Secure", desc: "Your records are encrypted and always yours to control." },
                  { icon: Users, title: "Community led", desc: "Local onboarding specialists ensure no one is left behind." }
                ].map((approach, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm space-y-3">
                    <div className="text-purple-600 bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center">
                      <approach.icon size={20} />
                    </div>
                    <h4 className="font-bold text-slate-900">{approach.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{approach.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Built different from day one.</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Unlike global tools, DigiSHE is localized for your context. We focus on "Growth Readiness"—preparing you to approach banks with confidence.
              </p>
              <ul className="space-y-4">
                {[
                  "No data? Record via USSD code",
                  "Low literacy? Use voice commands",
                  "No bank account? We help you start one"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <CheckCircle2 size={18} className="text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who DigiSHE is For */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900">Who is it for?</h2>
            <p className="text-slate-500 font-medium">We support women at every stage of their business journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { type: "Market Traders", label: "Fast logging for busy markets" },
              { type: "Fashion Designers", label: "Track expensive fabric inputs" },
              { type: "Rural Farmers", label: "Offline records for remote areas" },
              { type: "Small Producers", label: "Monitor material costs & sales" }
            ].map((audience, i) => (
              <div key={i} className="group cursor-default bg-slate-50 p-8 rounded-3xl border border-transparent hover:border-purple-200 hover:bg-white transition-all text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <UserIcon size={24} />
                </div>
                <h4 className="font-black text-slate-900">{audience.type}</h4>
                <p className="text-xs text-slate-500 font-bold">{audience.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900">Simple Tools, Big Results</h2>
            <p className="text-slate-500 font-medium">Everything you need, nothing you don't.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Zap} title="Sales in Seconds" desc="Tap and log. Record daily sales as they happen, no paper required." />
            <FeatureCard icon={PiggyBank} title="Savings Tracking" desc="Categorize your savings into Bank or Mobile Money for a clear overview." />
            <FeatureCard icon={LayoutDashboard} title="Weekly Summary" desc="See how your business performed each week with simple, colorful charts." />
            <FeatureCard icon={Smartphone} title="Works Everywhere" desc="Use our mobile app or standard USSD on any basic phone." />
            <FeatureCard icon={UserPlus} title="No Complex Setup" desc="Register with just your phone number. No email or password needed." />
            <FeatureCard icon={Globe} title="Offline Sync" desc="Records are saved locally and synced automatically when you have data." />
          </div>
        </div>
      </section>

      {/* Impact & Metrics */}
      <section className="py-24 px-6 bg-purple-900 text-white overflow-hidden relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 z-10">
            <h2 className="text-4xl font-black">Our Impact Journey</h2>
            <p className="text-xl text-purple-100 leading-relaxed font-medium">We are more than just an app. We are building the data bridge for financial inclusion.</p>
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div>
                <p className="text-5xl font-black mb-2 tracking-tighter">80%</p>
                <p className="text-purple-200 text-sm font-bold uppercase tracking-widest">Digital Transition</p>
              </div>
              <div>
                <p className="text-5xl font-black mb-2 tracking-tighter">15+</p>
                <p className="text-purple-200 text-sm font-bold uppercase tracking-widest">Communities</p>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-10 space-y-8 text-white">
              <div className="flex items-center gap-4">
                 <div className="bg-purple-500 p-4 rounded-3xl">
                   <Users size={32} />
                 </div>
                 <div>
                   <h4 className="text-2xl font-black">500+ Participants</h4>
                   <p className="text-purple-200 font-medium">In our 2024 active pilot phase</p>
                 </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-300">Early Indicators</p>
                <div className="space-y-3">
                  {['92% increased confidence', '65% better expense awareness', '40% started formal bank savings'].map((stat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="bg-emerald-400 w-5 h-5 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-purple-900 font-bold" />
                      </div>
                      <span className="font-bold text-sm">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-20 pointer-events-none" />
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
             <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Voices of DigiSHE</h2>
             <p className="text-slate-500 font-medium">Real impact for real entrepreneurs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { text: "This is the first app I can actually understand. I don't need my children to help me record my sales anymore.", name: "Aisha M.", role: "Market Trader" },
              { text: "Now I know exactly how much I spent on fabric and how much profit I made. I feel like a real CEO.", name: "Fatima K.", role: "Fashion Designer" }
            ].map((t, i) => (
              <Card key={i} className="p-10 space-y-6 relative border-slate-100 hover:border-purple-200 transition-all">
                <Quote className="text-purple-100 absolute top-8 right-8" size={48} />
                <p className="text-lg text-slate-700 font-medium italic relative z-10 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  <div>
                    <p className="font-black text-slate-900">{t.name}</p>
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-24 px-6 border-y border-slate-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Proudly Supported By</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Smartphone className="text-purple-600" /> Northern Girl Initiative
            </span>
            <span className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Globe className="text-emerald-600" /> Jameelullah Ltd
            </span>
            <span className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Award className="text-indigo-600" /> Community Groups
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-10">
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">Start building your business records today</h2>
          <p className="text-xl text-slate-500 font-medium leading-relaxed">
            Join the movement of women entrepreneurs taking control of their financial future.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="xl" onClick={() => navigate('/login')} className="w-full sm:w-auto px-12 shadow-purple-200">Join the DigiSHE Pilot</Button>
            <Button size="xl" variant="outline" className="w-full sm:w-auto px-12">Partner With Us</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 p-2 rounded-xl text-white">
                <Store size={24} />
              </div>
              <span className="text-2xl font-black tracking-tight">DigiShe</span>
            </div>
            <p className="text-slate-400 max-w-sm font-medium">Empowering women entrepreneurs with digital tools designed for accessibility and growth.</p>
          </div>
          <div className="space-y-4">
            <h5 className="font-black uppercase tracking-widest text-xs text-slate-500">Links</h5>
            <ul className="space-y-2 text-sm font-bold text-slate-300">
              <li><button onClick={() => navigate('/login')} className="hover:text-purple-400">Login</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-purple-400">Join Pilot</button></li>
              <li><a href="#" className="hover:text-purple-400">About DigiSHE</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-black uppercase tracking-widest text-xs text-slate-500">Contact</h5>
            <ul className="space-y-2 text-sm font-bold text-slate-300">
              <li>hello@digishe.org</li>
              <li>+233 503 088 600</li>
              <li>Tamale, Ghana</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <p>© 2025 DigiSHE. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
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

CREATE TABLE IF NOT EXISTS public.savings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  destination text CHECK (destination IN ('Bank', 'Mobile Money')),
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Basic Policies for MVP
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Access Businesses" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Public Access Transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Public Access Savings" ON public.savings FOR ALL USING (true);`;

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
  return errors[codeStr] || `Error: GHS{codeStr}`;
};

// --- Components ---

const SplashScreen: React.FC = () => (
  <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
    <div className="relative">
      <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl relative z-10 animate-bounce duration-[2000ms]">
        <Store className="text-purple-600 w-16 h-16" />
      </div>
      <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
    </div>
    <div className="mt-12 text-center space-y-4">
      <h1 className="text-3xl font-black tracking-tighter">DigiShe</h1>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-purple-200" size={24} />
        <p className="text-purple-100 font-bold text-sm uppercase tracking-[0.3em]">Securing your ledger</p>
      </div>
    </div>
  </div>
);

const LogoutConfirmModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <Card className="max-sm w-full p-8 text-center space-y-6 shadow-2xl border-none">
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
            <p>You <strong>must</strong> run this script in Supabase once to create the tables.</p>
          </div>
          <div className="relative group">
            <div className="absolute right-4 top-4 z-10">
              <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all active:scale-95">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy SQL Script'}
              </button>
            </div>
            <pre className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre leading-relaxed h-[250px]">
              {SQL_SETUP}
            </pre>
          </div>
          <Button onClick={onClose} className="w-full">I've Run the Script</Button>
        </div>
      </Card>
    </div>
  );
};

// --- Pending Activation Page ---
const PendingActivationPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <Card className="max-w-md w-full p-10 space-y-8 shadow-xl border-none">
      <div className="flex justify-center">
        <div className="bg-amber-50 p-6 rounded-full text-amber-500 animate-pulse">
          <Timer size={64} />
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-slate-900 leading-tight">Reviewing Your Account</h2>
        <p className="text-slate-500 font-medium leading-relaxed">Welcome to DigiShe! Our team is reviewing your business details. You will be activated shortly.</p>
      </div>
      <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3 text-left">
        <AlertCircle className="text-purple-600 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-slate-600">This helps us keep DigiShe safe for all entrepreneurs.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
          <RefreshCw size={18} /> Check Status
        </Button>
        <button onClick={onLogout} className="text-slate-400 font-bold hover:text-rose-500 transition-colors py-2">Sign Out</button>
      </div>
    </Card>
  </div>
);

// --- Admin Dashboard ---
const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAllBusinesses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('businesses').select('*, profiles:user_id (phone, name)').order('created_at', { ascending: false });
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) { console.error("Admin fetch error:", err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!user.isAdmin) { navigate('/dashboard'); return; }
    fetchAllBusinesses();
  }, [user]);

  const toggleActivation = async (businessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('businesses').update({ is_active: !currentStatus }).eq('id', businessId);
      if (error) throw error;
      setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, is_active: !currentStatus } : b));
    } catch (err) { alert("Failed to update status"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-purple-700 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl"><Users size={24} /></div>
            <div>
              <h1 className="text-2xl font-black">DigiShe Admin</h1>
              <p className="text-purple-200 text-xs font-bold uppercase tracking-widest">Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="!text-white !border-white/30 hover:!bg-white/10" onClick={() => navigate('/dashboard')}>Main App</Button>
            <button onClick={onLogout} className="p-2 hover:text-rose-300 transition-colors"><LogOut size={24} /></button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto w-full p-6 flex-1">
        <Card className="overflow-hidden p-0 border-none shadow-xl">
          <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Managed Businesses</h2>
            <Button size="sm" onClick={fetchAllBusinesses} disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} Refresh List</Button>
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
                {businesses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium"><UserIcon size={12} /> {b.profiles?.name} • {b.profiles?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-tighter mr-2">{b.type}</span>
                      <span className="text-xs text-slate-400 font-medium">{b.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider GHS{b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full GHS{b.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {b.is_active ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant={b.is_active ? 'outline' : 'primary'} onClick={() => toggleActivation(b.id, b.is_active)}>
                        {b.is_active ? <Lock size={14} /> : <Unlock size={14} />} {b.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

// --- Auth Page ---
const AuthPage: React.FC<{ onAuthComplete: (userData: any) => void; onMissingTables: () => void; }> = ({ onAuthComplete, onMissingTables }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleContinue = async () => {
    if (mode === 'register' && !name) { setError('Please enter your full name'); return; }
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) { setError('Please enter a valid phone number.'); return; }
    setIsLoading(true); setError('');
    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', { body: { action: 'send', phone: normalized, mode: mode } });
      if (funcError) {
        if (funcError.message.toLowerCase().includes('profiles')) { onMissingTables(); setIsLoading(false); return; }
        setError(funcError.message); setIsLoading(false); return;
      }
      if (response?.code === 'USER_NOT_FOUND') { setError("Account not found. Please register first."); setIsLoading(false); return; }
      if (response?.code === 'USER_ALREADY_EXISTS') { setError("This number is already registered. Please login."); setIsLoading(false); return; }
      if (response?.code === '1000' || response?.code === 1000) { setStep('otp'); setResendTimer(60); }
      else { setError(mapArkeselError(response?.code || 'unknown')); }
    } catch (err: any) { setError(err.message || 'Connection lost.'); } 
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true); setError('');
    const normalized = normalizePhone(phone);
    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('otp-handler', { body: { action: 'verify', phone: normalized, code: otp, name } });
      if (funcError) { setError(funcError.message); setIsLoading(false); return; }
      if (response?.success) { onAuthComplete(response.profile); } 
      else { setError(mapArkeselError(response?.code || '1104')); }
    } catch (err: any) { setError(err.message || 'Verification failed'); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-6 text-white text-center relative">
      {/* Back to Home Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all active:scale-95"
      >
        <Home size={18} /> Back to Home
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-white p-4 rounded-3xl shadow-xl"><Store className="text-purple-600 w-12 h-12" /></div>
          <h1 className="text-4xl font-black">DigiShe</h1>
          <p className="text-purple-100 text-lg font-medium">Digital bookkeeping for women entrepreneurs</p>
        </div>
        <Card className="p-8 space-y-6 text-slate-900 text-left">
          {step === 'input' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <div className="space-y-4">
                {mode === 'register' && <Input label="Full Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />}
                <Input label="Phone Number" type="tel" placeholder="e.g. 0503088600" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} />
              </div>
              {error && <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
              <Button size="xl" className="w-full" onClick={handleContinue} disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" size={24} /> : <>Continue <ArrowRight size={20} /></>}</Button>
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-purple-600 font-bold hover:underline pt-2">{mode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign in"}</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Verify Phone</h2>
                <p className="text-sm text-slate-500 font-medium">We sent a code to <span className="text-slate-900 font-bold">{phone}</span></p>
              </div>
              <input type="text" maxLength={6} className="w-full text-center text-3xl font-black py-4 bg-slate-50 border rounded-xl" value={otp} placeholder="000000" onChange={(e) => setOtp(e.target.value)} disabled={isLoading} />
              {error && <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
              <Button size="xl" className="w-full" onClick={handleVerifyOtp} disabled={otp.length < 6 || isLoading}>Verify & Sign In</Button>
              
              <div className="flex flex-col items-center gap-4 pt-2">
                <button 
                  onClick={handleContinue} 
                  disabled={resendTimer > 0 || isLoading}
                  className={`text-sm font-bold transition-colors ${resendTimer > 0 ? 'text-slate-300' : 'text-purple-600 hover:text-purple-700'}`}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                </button>
                <button onClick={() => setStep('input')} className="text-slate-400 font-medium text-xs hover:text-slate-600">Edit Phone Number</button>
              </div>
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
    setIsSaving(true); setError('');
    try { await onComplete({ name, type, location, startDate: new Date().toISOString(), isActive: false }); } 
    catch (err: any) { setError(err.message || 'Failed to save'); } 
    finally { setIsSaving(false); }
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
          <Input label="Business Location" placeholder="e.g. Makola Market" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isSaving} />
          <div className="grid grid-cols-2 gap-2">
            {businessTypes.map(t => <button key={t} type="button" onClick={() => setType(t)} className={`px-4 py-3 rounded-xl border text-sm font-bold GHS{type === t ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white text-slate-600'}`}>{t}</button>)}
          </div>
          <Button size="xl" className="w-full" onClick={handleSubmit} disabled={!name || isSaving}>Create My Business</Button>
        </Card>
      </div>
    </div>
  );
};

// --- Dashboard ---
const Dashboard: React.FC<{ 
  state: AppState; 
  onLogout: () => void;
  insight: string;
  onShowCategoryPrompt: () => void;
}> = ({ state, onLogout, insight, onShowCategoryPrompt }) => {
  const navigate = useNavigate();
  const stats = useMemo(() => {
    const sales = state.transactions.filter(t => t.type === 'sale').reduce((acc, t) => acc + t.amount, 0);
    const expenses = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const saved = state.savings.reduce((acc, s) => acc + s.amount, 0);
    return { sales, expenses, balance: sales - expenses, saved };
  }, [state.transactions, state.savings]);

  const chartData = useMemo(() => getWeeklyData(state.transactions), [state.transactions]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-6 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-xl cursor-pointer" onClick={() => navigate('/')}><Store className="text-white" size={20} /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{state.business?.name}</h1>
                {state.user?.isAdmin && <button onClick={() => navigate('/admin')} className="text-purple-600"><ShieldCheck size={18} /></button>}
              </div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">{state.business?.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/savings')} 
              className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
              title="Savings Hub"
            >
              <SavingsIcon size={24} />
            </button>
            <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition-colors"><LogOut size={24} /></button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {state.showCategoryPrompt && (
          <Card className="bg-indigo-600 border-none text-white overflow-hidden relative shadow-lg animate-in slide-in-from-top-4 duration-500">
            <Sparkles className="absolute -right-2 -bottom-2 text-white/10 w-24 h-24" />
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Tag size={24} /></div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Personalize your records?</h3>
                <p className="text-sm text-indigo-100 leading-relaxed">You've recorded {state.entryCount} entries! Would you like to add your own custom categories for better tracking?</p>
                <div className="flex gap-3">
                  <Button size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50" onClick={onShowCategoryPrompt}>Add category</Button>
                  <button className="text-sm font-bold text-white/70 hover:text-white px-3" onClick={onShowCategoryPrompt}>Skip for now</button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none text-white overflow-hidden relative shadow-lg">
          <Sparkles className="absolute -right-4 -top-4 text-white/10 w-32 h-32" />
          <div className="relative z-10 space-y-2">
            <p className="text-sm font-bold text-purple-100 uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} /> Business Tip</p>
            <p className="text-lg font-medium leading-relaxed italic">"{insight}"</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatBox label="Current Balance" value={`$GHS{stats.balance.toLocaleString()}`} color="bg-purple-500" icon={<TrendingUp size={20} />} />
          <div className="cursor-pointer group" onClick={() => navigate('/savings')}>
            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group-hover:border-indigo-300 transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500 bg-opacity-10 text-white">
                  <div className="p-2 rounded-lg bg-indigo-500">
                    <SavingsIcon size={20} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">My Savings</p>
                  <p className="text-xl font-bold text-slate-900">GHS{stats.saved.toLocaleString()}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="flex items-center gap-4 bg-emerald-50 border-emerald-100">
              <TrendingUp className="text-emerald-500" size={24} />
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase">Sales</p>
                <p className="text-lg font-black text-slate-900">GHS{stats.sales.toLocaleString()}</p>
              </div>
           </Card>
           <Card className="flex items-center gap-4 bg-rose-50 border-rose-100">
              <TrendingDown className="text-rose-500" size={24} />
              <div>
                <p className="text-xs font-bold text-rose-700 uppercase">Expenses</p>
                <p className="text-lg font-black text-slate-900">GHS{stats.expenses.toLocaleString()}</p>
              </div>
           </Card>
        </div>

        <Card className="flex flex-col gap-4">
          <h3 className="font-bold text-slate-800">Weekly Performance</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-800">Recent Activity</h3>
            <button className="text-xs font-bold text-purple-600">View All</button>
          </div>
          <div className="space-y-3">
            {state.transactions.slice().reverse().slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg GHS{t.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'sale' ? <PlusCircle size={18} /> : <MinusCircle size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 capitalize">{t.category || t.type}</p>
                    <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`font-bold GHS{t.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'sale' ? '+' : '-'}GHS{t.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 max-w-4xl mx-auto grid grid-cols-3 gap-3">
        <Button variant="sale" size="md" onClick={() => navigate('/record/sale')} className="px-1 shadow-sm">
          <PlusCircle size={18} /> Sale
        </Button>
        <Button variant="expense" size="md" onClick={() => navigate('/record/expense')} className="px-1 shadow-sm">
          <MinusCircle size={18} /> Expense
        </Button>
        <Button variant="outline" size="md" onClick={() => navigate('/savings')} className="px-1 !border-indigo-600 !text-indigo-600 shadow-sm">
          <SavingsIcon size={18} /> Savings
        </Button>
      </div>
    </div>
  );
};

// --- Savings Hub Page ---
const SavingsHub: React.FC<{ state: AppState }> = ({ state }) => {
  const navigate = useNavigate();
  const totals = useMemo(() => {
    const bank = state.savings.filter(s => s.destination === 'Bank').reduce((acc, s) => acc + s.amount, 0);
    const momo = state.savings.filter(s => s.destination === 'Mobile Money').reduce((acc, s) => acc + s.amount, 0);
    return { bank, momo, total: bank + momo };
  }, [state.savings]);

  const recentSavings = useMemo(() => [...state.savings].reverse().slice(0, 10), [state.savings]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-6 border-b flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">My Savings</h2>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        <Card className="bg-indigo-600 text-white border-none p-8 flex flex-col items-center gap-2 shadow-xl relative overflow-hidden">
          <SavingsIcon size={128} className="absolute -right-4 -top-4 text-white/10" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">Total Funds Saved</p>
          <p className="text-5xl font-black">GHS{totals.total.toLocaleString()}</p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center p-6 gap-3 border-none shadow-md">
            <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600">
              <Building2 size={32} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bank</p>
              <p className="text-xl font-black text-slate-900">GHS{totals.bank.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="flex flex-col items-center p-6 gap-3 border-none shadow-md">
            <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600">
              <Wallet size={32} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">MoMo</p>
              <p className="text-xl font-black text-slate-900">GHS{totals.momo.toLocaleString()}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
           <h3 className="font-bold text-slate-800 px-1">Saving History</h3>
           <Card className="p-0 overflow-hidden border-none shadow-sm">
             {recentSavings.length === 0 ? (
               <div className="p-12 text-center text-slate-400 italic">No savings recorded yet.</div>
             ) : (
               <div className="divide-y divide-slate-50">
                 {recentSavings.map(s => (
                   <div key={s.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-xl GHS{s.destination === 'Bank' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {s.destination === 'Bank' ? <Building2 size={20} /> : <Wallet size={20} />}
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">{s.destination}</p>
                         <p className="text-xs text-slate-400 font-medium">{new Date(s.date).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <p className="font-black text-slate-900 text-lg">GHS{s.amount.toLocaleString()}</p>
                   </div>
                 ))}
               </div>
             )}
           </Card>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t max-w-3xl mx-auto flex justify-center">
        <Button size="xl" className="w-full !bg-indigo-600 hover:!bg-indigo-700 shadow-indigo-200" onClick={() => navigate('/record-saving')}>
          <PlusCircle size={24} /> Add New Saving
        </Button>
      </div>
    </div>
  );
};

// --- Record Saving Page ---
const RecordSavingPage: React.FC<{ onSave: (amount: number, destination: 'Bank' | 'Mobile Money') => void }> = ({ onSave }) => {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState<'Bank' | 'Mobile Money'>('Bank');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onSave(val, destination);
      setShowSuccess(true);
      setTimeout(() => navigate('/savings'), 1000);
    }
  };

  if (showSuccess) return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in">
      <div className="bg-white/20 p-8 rounded-full mb-6">
        <CheckCircle2 size={80} />
      </div>
      <h2 className="text-5xl font-black mb-2">Money Saved!</h2>
      <p className="text-indigo-100 font-medium">Securing your financial future.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-6 border-b flex items-center gap-4">
        <button onClick={() => navigate('/savings')} className="text-slate-400 p-2"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-bold">New Saving</h2>
      </header>

      <main className="p-6 space-y-8 max-w-2xl mx-auto w-full">
        <Card className="space-y-8 shadow-xl border-none p-10">
          <div className="space-y-3">
             <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block text-center">Where are you saving to?</label>
             <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button 
                  onClick={() => setDestination('Bank')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all GHS{destination === 'Bank' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                  <Building2 size={20} /> Bank
                </button>
                <button 
                  onClick={() => setDestination('Mobile Money')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all GHS{destination === 'Mobile Money' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                  <Wallet size={20} /> MoMo
                </button>
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-sm font-bold text-slate-700 ml-1">Amount to Save</label>
             <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">GHS</span>
                <input 
                  type="number"
                  className="w-full pl-12 pr-6 py-6 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-4xl font-black tracking-tight transition-all"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
             </div>
             <p className="text-xs text-slate-400 font-medium text-center pt-2 italic">"A small step today for a bigger business tomorrow."</p>
          </div>

          <Button size="xl" className="w-full !bg-indigo-600 hover:!bg-indigo-700 shadow-lg mt-4" onClick={handleSave}>
            Confirm Saving
          </Button>
        </Card>
      </main>
    </div>
  );
};

// --- Record Transaction Page ---
const RecordPage: React.FC<{ 
  type: 'sale' | 'expense'; 
  suggestions: string[];
  recentTransactions: Transaction[];
  onSave: (amount: number, category: string) => void;
}> = ({ type, suggestions, recentTransactions, onSave }) => {
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

  const tableTransactions = useMemo(() => {
    return recentTransactions
      .filter(t => t.type === type)
      .slice().reverse().slice(0, 5);
  }, [recentTransactions, type]);

  if (showSuccess) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in">
      <CheckCircle2 size={64} className={type === 'sale' ? 'text-emerald-500' : 'text-rose-500'} />
      <h2 className="text-4xl font-black">{type === 'sale' ? 'Sale' : 'Expense'} Recorded!</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-6 border-b flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Record {type === 'sale' ? 'Sale' : 'Expense'}</h2>
      </header>
      
      <main className="p-6 space-y-8 max-w-3xl mx-auto w-full">
        <Card className="space-y-6 shadow-md border-none">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Category</label>
            <div className="relative">
              <input 
                list="category-suggestions" 
                className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-lg"
                placeholder="Select or type category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              <datalist id="category-suggestions">
                {suggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          <Input label="Amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="py-4 text-lg" />
          <Button size="xl" variant={type === 'sale' ? 'sale' : 'expense'} className="w-full shadow-lg" onClick={handleSave}>
            Save {type === 'sale' ? 'Sale' : 'Expense'}
          </Button>
        </Card>

        {/* Recent Transactions Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Calendar size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Last 5 {type === 'sale' ? 'Sales' : 'Expenses'}</h3>
          </div>
          
          <Card className="p-0 overflow-hidden border-none shadow-sm">
            {tableTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic text-sm">
                No {type}s recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tableTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-xs font-medium text-slate-500">
                          {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-800 capitalize">
                          {t.category}
                        </td>
                        <td className={`px-5 py-4 text-sm font-black text-right GHS{type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          GHS{t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

// --- Simple Category Creation Modal ---
const CreateCategoryModal: React.FC<{ onAdd: (name: string) => void; onCancel: () => void }> = ({ onAdd, onCancel }) => {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <Card className="max-w-md w-full p-8 space-y-6 shadow-2xl border-none">
        <div className="flex justify-between items-center">
          <div className="bg-purple-100 p-3 rounded-2xl text-purple-600"><Tag size={24} /></div>
          <button onClick={onCancel} className="text-slate-400"><XCircle size={24} /></button>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Add New Category</h2>
          <p className="text-slate-500 text-sm">Personalize your business records.</p>
        </div>
        <div className="space-y-6">
          <Input autoFocus placeholder="e.g. Fabric, Oil, Ingredients" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" onClick={() => { if (name) onAdd(name); }} disabled={!name}><Plus size={20} /> Add Category</Button>
            <button onClick={onCancel} className="text-slate-400 font-bold py-2">Skip for now</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Record Route Handler ---
const RecordRouteHandler: React.FC<{
  user: User | null;
  business: Business | null;
  customCategories: string[];
  transactions: Transaction[];
  onSave: (type: 'sale' | 'expense', amount: number, category: string) => void;
}> = ({ user, business, customCategories, transactions, onSave }) => {
  const { type } = useParams<{ type: string }>();
  if (!user || !user.hasCompletedOnboarding || !business?.isActive) return <Navigate to="/login" replace />;
  const finalType = type === 'expense' ? 'expense' : 'sale';
  const suggestions = finalType === 'sale' ? [...SALES_CATEGORIES, ...customCategories] : [...EXPENSE_CATEGORIES, ...customCategories];
  return (
    <RecordPage 
      type={finalType} 
      suggestions={suggestions} 
      recentTransactions={transactions}
      onSave={(amt, cat) => onSave(finalType, amt, cat)} 
    />
  );
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
  const [showSetup, setShowSetup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCatCreator, setShowCatCreator] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.business?.isActive && state.transactions.length > 0) getBusinessInsight(state.business, state.transactions).then(setInsight);
  }, [state.business, state.transactions]);

  useEffect(() => {
    if (state.user?.phoneNumber) {
      fetchDataFromSupabase(state.user.phoneNumber).finally(() => {
        // Add a tiny artificial delay to ensure smooth transition
        setTimeout(() => setIsSyncing(false), 800);
      });
    } else {
      setIsSyncing(false);
    }
  }, [state.user?.phoneNumber]);

  const fetchDataFromSupabase = async (phone: string) => {
    const normalized = normalizePhone(phone);
    try {
      const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('phone', normalized).maybeSingle();
      if (profErr) { console.error("Profile sync error:", profErr); return; }
      
      if (profile) {
        const { data: business, error: bizErr } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
        if (bizErr) console.error("Business sync error:", bizErr);

        let transactions: any[] = [];
        let savings: any[] = [];
        if (business) {
          const { data: txs, error: txErr } = await supabase.from('transactions').select('*').eq('business_id', business.id);
          const { data: svs, error: svErr } = await supabase.from('savings').select('*').eq('business_id', business.id);
          if (txErr) console.error("Transactions sync error:", txErr);
          if (svErr) console.error("Savings sync error:", svErr);
          
          transactions = txs || [];
          savings = svs || [];
        }
        setState(prev => ({
          ...prev,
          user: { phoneNumber: normalized, name: profile.name, isAdmin: profile.is_admin, hasCompletedOnboarding: profile.has_completed_onboarding },
          business: business ? { id: business.id, name: business.name, type: business.type as BusinessType, location: business.location, isActive: business.is_active, startDate: business.start_date } : null,
          transactions: transactions.map(t => ({ id: t.id, userId: normalized, type: t.type, amount: parseFloat(t.amount), category: t.category, date: t.date })),
          savings: savings.map(s => ({ id: s.id, businessId: business.id, amount: parseFloat(s.amount), destination: s.destination, date: s.date })),
          entryCount: transactions.length
        }));
      }
    } catch (err) { console.error("Supabase connection error:", err); }
  };

  const handleOnboarding = async (business: Business) => {
    if (!state.user) return;
    const normalized = normalizePhone(state.user.phoneNumber);
    const { data: profile } = await supabase.from('profiles').select('id').eq('phone', normalized).single();
    if (profile) {
      const { data: newBiz, error: bizError } = await supabase.from('businesses').insert({ user_id: profile.id, name: business.name, type: business.type, location: business.location, is_active: false, start_date: business.startDate }).select().single();
      if (bizError) throw bizError;
      await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', profile.id);
      setState(prev => ({ ...prev, business: { ...business, id: newBiz.id, isActive: false }, user: prev.user ? { ...prev.user, hasCompletedOnboarding: true } : null }));
    }
  };

  const addTransaction = async (type: 'sale' | 'expense', amount: number, category: string) => {
    if (!state.user || !state.business) return;
    const normalized = normalizePhone(state.user.phoneNumber);
    const dateStr = formatDate(new Date());
    const newCount = state.entryCount + 1;
    const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), userId: normalized, type, amount, category, date: dateStr };
    
    setState(prev => ({ 
      ...prev, 
      transactions: [...prev.transactions, newTx], 
      entryCount: newCount,
      showCategoryPrompt: newCount === 3
    }));

    const { error } = await supabase.from('transactions').insert({ business_id: state.business.id, type, amount, category, date: dateStr });
    if (error) console.error("Supabase transaction insert failed:", error);
  };

  const addSaving = async (amount: number, destination: 'Bank' | 'Mobile Money') => {
    if (!state.user || !state.business || !state.business.id) {
      console.warn("Cannot add saving: Missing business ID in state.");
      return;
    }
    const dateStr = formatDate(new Date());
    const newS: Saving = { id: Math.random().toString(36).substr(2, 9), businessId: state.business.id, amount, destination, date: dateStr };
    
    setState(prev => ({ ...prev, savings: [...prev.savings, newS] }));
    const { error } = await supabase.from('savings').insert({ business_id: state.business.id, amount, destination, date: dateStr });
    if (error) {
      console.error("Supabase saving insert failed:", error);
      alert("Failed to sync saving with the cloud. Please ensure the 'savings' table exists in Supabase.");
    }
  };

  const handleAddCategory = (name: string) => {
    setState(prev => ({ ...prev, customCategories: [...prev.customCategories, name], showCategoryPrompt: false }));
    setShowCatCreator(false);
  };

  const performLogout = () => { localStorage.removeItem(STORAGE_KEY); setState({ ...initialState }); setInsight("Keep up the great work!"); setShowLogoutConfirm(false); };

  const user = state.user;
  const business = state.business;

  if (isSyncing) return <SplashScreen />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={!user ? <AuthPage onAuthComplete={(p) => setState(prev => ({...prev, user: { phoneNumber: p.phone, name: p.name, isAdmin: p.is_admin, hasCompletedOnboarding: p.has_completed_onboarding }}))} onMissingTables={() => setShowSetup(true)} /> : (user.hasCompletedOnboarding ? (business?.isActive ? <Navigate to="/dashboard" replace /> : <Navigate to="/pending" replace />) : <Navigate to="/onboarding" replace />)} />
        <Route path="/onboarding" element={user ? (user.hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <OnboardingPage onComplete={handleOnboarding} />) : <Navigate to="/login" replace />} />
        <Route path="/pending" element={user?.hasCompletedOnboarding ? (business?.isActive ? <Navigate to="/dashboard" replace /> : <PendingActivationPage onLogout={() => setShowLogoutConfirm(true)} />) : <Navigate to="/login" replace />} />
        <Route path="/admin" element={user?.isAdmin ? <AdminDashboard user={user} onLogout={() => setShowLogoutConfirm(true)} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={user?.hasCompletedOnboarding ? (business?.isActive ? <Dashboard state={state} onLogout={() => setShowLogoutConfirm(true)} insight={insight} onShowCategoryPrompt={() => { if(state.entryCount >= 3) setShowCatCreator(true); }} /> : <Navigate to="/pending" replace />) : <Navigate to="/login" replace />} />
        <Route path="/savings" element={user?.hasCompletedOnboarding ? (business?.isActive ? <SavingsHub state={state} /> : <Navigate to="/pending" replace />) : <Navigate to="/login" replace />} />
        <Route path="/record-saving" element={user?.hasCompletedOnboarding ? (business?.isActive ? <RecordSavingPage onSave={addSaving} /> : <Navigate to="/pending" replace />) : <Navigate to="/login" replace />} />
        <Route path="/record/:type" element={<RecordRouteHandler user={user} business={business} customCategories={state.customCategories} transactions={state.transactions} onSave={addTransaction} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showSetup && <DatabaseSetupModal onClose={() => setShowSetup(false)} />}
      {showLogoutConfirm && <LogoutConfirmModal onConfirm={performLogout} onCancel={() => setShowLogoutConfirm(false)} />}
      {showCatCreator && <CreateCategoryModal onAdd={handleAddCategory} onCancel={() => { setShowCatCreator(false); setState(prev => ({ ...prev, showCategoryPrompt: false })); }} />}
    </HashRouter>
  );
}
