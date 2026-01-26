
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'sale' | 'expense' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    sale: 'bg-emerald-500 text-white hover:bg-emerald-600',
    expense: 'bg-rose-500 text-white hover:bg-rose-600',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-4 text-lg font-bold',
    xl: 'px-8 py-6 text-xl font-bold rounded-2xl shadow-lg'
  };

  return (
    <button 
      className={`rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${className}`}
      {...props}
    />
  </div>
);

export const StatBox: React.FC<{ label: string; value: string | number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);
