import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle }) => {
  return (
    <div 
      className="bg-slate-800 border border-slate-700/80 rounded-2xl p-8 sm:p-10 flex flex-col justify-center shadow-xl shadow-black/50 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-900/20 hover:border-red-500/30 group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-red-600/10 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-500 shadow-inner">
          <Icon size={24} />
        </div>
        <h3 className="text-slate-400 font-bold tracking-wide uppercase text-sm">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black text-slate-50 tracking-tighter drop-shadow-md">{value}</span>
        {subtitle && <span className="text-lg text-slate-500 font-bold">{subtitle}</span>}
      </div>
    </div>
  );
};
