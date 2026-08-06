import React, { useState, useEffect } from 'react';
import { FileJson, Key, ChevronRight, X, Save, CheckCircle2, Download, Upload, AlertCircle, Loader2, Globe, Users, MessageSquareX, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '../services/dbService';
import { useLanguage } from '../contexts/LanguageContext';
import { FamilyMembersModal } from '../components/ui/FamilyMembersModal';
import { supabase } from '../api/supabaseClient';

export const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [showTmdbModal, setShowTmdbModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [tmdbKey, setTmdbKey] = useState('');
  const [saved, setSaved] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string }>({ type: 'success', msg: '' });

  useEffect(() => {
    const key = localStorage.getItem('TMDB_API_KEY') || '';
    setTmdbKey(key);
  }, []);

  const handleSaveTmdbKey = () => {
    localStorage.setItem('TMDB_API_KEY', tmdbKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowTmdbModal(false);
    }, 1000);
  };

  const handleExport = async () => {
    try {
      setLoadingData(true);
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
      setLoadingData(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoadingData(true);
        setStatus({ type: 'success', msg: '' });
        
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        await dbService.importDatabase(parsed);
        setStatus({ type: 'success', msg: 'Import successful! The database has been updated.' });
      } catch (err: any) {
        setStatus({ type: 'error', msg: 'Import failed: ' + err.message });
      } finally {
        setLoadingData(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteChat = async () => {
    setDeletingChat(true);
    try {
      const { error } = await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setShowDeleteChatModal(false);
    } catch (err: any) {
      console.error('Delete chat failed:', err);
    } finally {
      setDeletingChat(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full pb-32 animate-in fade-in duration-500">
      <header className="mb-6 flex flex-col justify-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight leading-tight">{t('settings.title')}</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">{t('settings.desc')}</p>
      </header>

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10px" }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/60 backdrop-blur-xl transform-gpu rounded-3xl overflow-hidden shadow-sm border border-slate-800/80 transition-colors duration-300"
        >
          {/* Language / ภาษา */}
          <button 
            onClick={() => setShowLangModal(true)}
            className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors transition-shadow border-b border-slate-800/80 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <Globe size={20} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-200">{t('settings.language')}</span>
                <span className="text-xs font-medium text-slate-500">{t('settings.language_desc')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
              <span className="text-sm font-bold uppercase">{language}</span>
              <ChevronRight size={20} />
            </div>
          </button>

          {/* TMDB API Key */}
          <button 
            onClick={() => setShowTmdbModal(true)}
            className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors transition-shadow border-b border-slate-800/80 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                <Key size={20} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-200">{t('settings.tmdb_key')}</span>
                <span className="text-xs font-medium text-slate-500">{t('settings.tmdb_desc')}</span>
              </div>
            </div>
            <div className="text-slate-500 group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>

          {/* Data Management */}
          <button 
            onClick={() => { setStatus({ type: 'success', msg: '' }); setShowDataModal(true); }}
            className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors transition-shadow border-b border-slate-800/80 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                <FileJson size={20} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-200">{t('settings.data_management')}</span>
                <span className="text-xs font-medium text-slate-500">{t('settings.data_desc')}</span>
              </div>
            </div>
            <div className="text-slate-500 group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>

          {/* Family Management */}
          <button 
            onClick={() => setShowFamilyModal(true)}
            className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-slate-800/50 active:bg-slate-800/80 transition-colors transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-inner group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
                <Users size={20} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-200">{t('people.title')}</span>
                <span className="text-xs font-medium text-slate-500">{t('people.desc')}</span>
              </div>
            </div>
            <div className="text-slate-500 group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>
        </motion.div>
        
        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10px" }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-900/60 backdrop-blur-xl transform-gpu rounded-3xl overflow-hidden shadow-sm border border-red-900/30"
        >
          <button 
            onClick={() => setShowDeleteChatModal(true)}
            className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-red-500/5 active:bg-red-500/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                <MessageSquareX size={20} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-red-400">{language === 'th' ? 'ลบข้อความแชทถาวร' : 'Clear All Chat Messages'}</span>
                <span className="text-xs font-medium text-slate-500">{language === 'th' ? 'ลบข้อความทั้งหมดในห้องแชท ไม่สามารถกู้คืนได้' : 'Permanently delete all chat messages. Cannot be undone.'}</span>
              </div>
            </div>
            <div className="text-red-500/50 group-hover:text-red-400 transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>
        </motion.div>

        <div className="text-center pt-4 opacity-50">
          <p className="text-xs font-bold text-slate-400 tracking-widest">SAKORING V2.0.0</p>
        </div>
      </div>

      {/* TMDB Modal */}
      <AnimatePresence>
        {showTmdbModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transform-gpu z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900/90 backdrop-blur-xl transform-gpu rounded-3xl w-full max-w-md flex flex-col shadow-2xl shadow-black/80 border border-slate-800"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Key size={16} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('settings.tmdb_key')}</h2>
                </div>
                <button 
                  onClick={() => setShowTmdbModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all duration-200 ease-out active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Access Token (v3 auth)
                  </label>
                  <input 
                    type="text" 
                    value={tmdbKey}
                    onChange={(e) => setTmdbKey(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors shadow-inner text-white font-medium"
                    placeholder="Enter your TMDB API Key..."
                  />
                  <p className="text-xs text-slate-500 mt-2">Get your key from <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-red-500 hover:underline">The Movie Database (TMDB)</a></p>
                </div>
                
                <button
                  onClick={handleSaveTmdbKey}
                  className="w-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-black/50"
                >
                  {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                  {saved ? t('settings.saved') : t('settings.save_key')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Management Modal */}
      <AnimatePresence>
        {showDataModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transform-gpu z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900/90 backdrop-blur-xl transform-gpu rounded-3xl w-full max-w-lg flex flex-col shadow-2xl shadow-black/80 border border-slate-800"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <FileJson size={16} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('settings.data_management')}</h2>
                </div>
                <button 
                  onClick={() => setShowDataModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all duration-200 ease-out active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <p className="text-slate-400 text-sm font-medium">{t('settings.data_desc')}</p>

                {status.msg && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {status.type === 'error' ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
                    <p className="font-medium text-sm">{status.msg}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 rounded-2xl p-5 flex flex-col items-center text-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:text-white transition-colors">
                      <Download size={24} />
                    </div>
                    <h3 className="font-bold text-slate-200 mb-2">{t('settings.export')}</h3>
                    <p className="text-xs text-slate-500 mb-6 flex-1">{t('settings.export_desc')}</p>
                    <button 
                      onClick={handleExport}
                      disabled={loadingData}
                      className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg text-sm"
                    >
                      {loadingData ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {t('settings.export')}
                    </button>
                  </div>

                  <div className="bg-slate-800/40 rounded-2xl p-5 flex flex-col items-center text-center border border-slate-700/50 hover:border-red-500/30 transition-colors group">
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mb-4 group-hover:bg-red-500/20 transition-colors">
                      <Upload size={24} />
                    </div>
                    <h3 className="font-bold text-slate-200 mb-2">{t('settings.import')}</h3>
                    <p className="text-xs text-slate-500 mb-6 flex-1">{t('settings.import_desc')}</p>
                    <label className={`w-full px-4 py-3 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/50 text-sm ${loadingData ? 'opacity-50 pointer-events-none' : ''}`}>
                      {loadingData ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {loadingData ? t('settings.processing') : t('settings.select_file')}
                      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {showLangModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transform-gpu z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900/90 backdrop-blur-xl transform-gpu rounded-3xl w-full max-w-md flex flex-col shadow-2xl shadow-black/80 border border-slate-800"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Globe size={16} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('settings.language')}</h2>
                </div>
                <button 
                  onClick={() => setShowLangModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all duration-200 ease-out active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-3">
                <button
                  onClick={() => { setLanguage('th'); setShowLangModal(false); }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border font-bold transition-all ${language === 'th' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  <span>ภาษาไทย (TH)</span>
                  {language === 'th' && <CheckCircle2 size={20} />}
                </button>
                <button
                  onClick={() => { setLanguage('en'); setShowLangModal(false); }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border font-bold transition-all ${language === 'en' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  <span>English (EN)</span>
                  {language === 'en' && <CheckCircle2 size={20} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Chat Confirmation Modal */}
      <AnimatePresence>
        {showDeleteChatModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transform-gpu z-[60] flex items-center justify-center p-4"
            onClick={() => !deletingChat && setShowDeleteChatModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900/90 backdrop-blur-xl transform-gpu rounded-3xl w-full max-w-sm flex flex-col shadow-2xl shadow-black/80 border border-red-900/40"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-5 border border-red-500/20">
                  <AlertTriangle size={30} />
                </div>
                <h2 className="text-xl font-black text-white mb-2">
                  {language === 'th' ? 'ลบแชทถาวร?' : 'Clear All Chats?'}
                </h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  {language === 'th' 
                    ? 'ข้อความแชททั้งหมดจะถูกลบอย่างถาวร และไม่สามารถกู้คืนได้ คุณยืนยันที่จะลบหรือไม่?' 
                    : 'All chat messages will be permanently deleted and cannot be recovered. Are you sure?'}
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowDeleteChatModal(false)}
                    disabled={deletingChat}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button 
                    onClick={handleDeleteChat}
                    disabled={deletingChat}
                    className="flex-1 py-3 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deletingChat ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareX size={16} />}
                    {language === 'th' ? 'ลบทั้งหมด' : 'Delete All'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Members Modal */}
      <FamilyMembersModal isOpen={showFamilyModal} onClose={() => setShowFamilyModal(false)} />
    </div>
  );
};
