import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const ImportExport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string }>({ type: 'success', msg: '' });

  const handleExport = async () => {
    try {
      setLoading(true);
      setStatus({ type: 'success', msg: '' });
      const data = await dbService.exportDatabase();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family_movie_ratings_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', msg: 'Export successful!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'Export failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setStatus({ type: 'success', msg: '' });
        
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        await dbService.importDatabase(parsed);
        setStatus({ type: 'success', msg: 'Import successful! The database has been updated.' });
      } catch (err: any) {
        setStatus({ type: 'error', msg: 'Import failed: ' + err.message });
      } finally {
        setLoading(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-50 tracking-tight mb-2">Import / Export</h1>
        <p className="text-slate-400 font-medium">Backup your family movie ratings or restore from a previous backup.</p>
      </div>

      {status.msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {status.type === 'error' ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
          <p className="font-medium">{status.msg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Section */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-8 flex flex-col items-center text-center shadow-xl shadow-black/50 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-700/80 group">
          <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center text-slate-400 mb-6 border border-slate-700/80 shadow-inner group-hover:text-white transition-colors duration-300">
             <Download size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-50 mb-3">Export Database</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">Download a complete backup of all movies, family members, and ratings as a JSON file.</p>
          
          <button 
            onClick={handleExport}
            disabled={loading}
            className="w-full px-6 py-4 bg-slate-800/60 hover:bg-slate-700/80 text-white rounded-2xl font-bold transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-700/50 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            {loading ? 'Processing...' : 'Download Backup'}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-8 flex flex-col items-center text-center shadow-xl shadow-black/50 transition-all duration-300 ease-out hover:border-red-500/30 hover:-translate-y-1 group">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-inner group-hover:bg-red-600/20 transition-colors duration-300">
             <Upload size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-50 mb-3">Import Database</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">Restore your library from a previously exported JSON backup file. This will update existing records.</p>
          
          <label className={`w-full px-6 py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-bold transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            {loading ? 'Processing...' : 'Select Backup File'}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

      </div>
    </div>
  );
};
