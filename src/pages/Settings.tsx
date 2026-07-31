import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileJson } from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-50 tracking-tight mb-2">Settings</h1>
        <p className="text-slate-400 font-medium">Manage your application configuration and data.</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 sm:p-10 space-y-6 shadow-xl shadow-black/50 transition-all duration-300 ease-out">
        <h2 className="text-xl font-bold text-slate-50 border-b border-slate-800 pb-3 flex items-center gap-2">
           <FileJson size={20} className="text-slate-500" /> Data Management
        </h2>
        <p className="text-slate-400 font-medium">Backup or restore your database to a local JSON file.</p>
        <button 
          onClick={() => navigate('/import-export')}
          className="px-6 py-4 bg-slate-800/60 hover:bg-slate-700/80 text-white rounded-2xl font-bold transition-all duration-300 ease-out border border-slate-700/50 w-full sm:w-auto shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1"
        >
          Go to Import / Export
        </button>
      </div>
    </div>
  );
};
