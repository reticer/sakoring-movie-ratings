import React, { useState, useEffect } from 'react';
import { Users, Trash2, Loader2, Plus, Save, Pencil, AlertTriangle, X } from 'lucide-react';
import { dbService } from '../../services/dbService';
import type { Person } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { springUp, scaleIn } from '../../utils/animations';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyMembersModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [people, setPeople] = useState<Person[]>([]);
  const [formData, setFormData] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPeople();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const loadPeople = async () => {
    try {
      setInitialLoading(true);
      const data = await dbService.getPeople();
      setPeople(data || []);
    } catch (err) {
      setError("Failed to load family members.");
    } finally {
      setInitialLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingId) {
        await dbService.updatePerson(editingId, formData.name);
      } else {
        await dbService.addPerson(formData.name);
      }
      await loadPeople();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save person.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setFormData({ name: person.name });
    setShowForm(true);
  };

  const handleDeleteClick = (person: Person) => {
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    setIsSubmitting(true);
    try {
      await dbService.deletePerson(personToDelete.id);
      setPeople(people.filter(p => p.id !== personToDelete.id));
      setShowDeleteModal(false);
      setPersonToDelete(null);
    } catch (err) {
      setError("Failed to delete person.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-slate-900/90 backdrop-blur-xl transform-gpu rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/80 border border-slate-800"
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                  <Users size={16} />
                </div>
                <h2 className="text-lg font-bold text-white">{t('people.title')}</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all duration-200 ease-out active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {!showForm && (
                <div className="flex justify-between items-center mb-6">
                  <p className="text-slate-400 font-medium">{t('people.desc')}</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg text-sm"
                  >
                    <Plus size={18} /> {t('people.add_member')}
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm text-sm">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p className="font-bold">{error}</p>
                </div>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 shadow-inner mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {editingId ? t('people.edit') : t('people.add_member')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{t('people.member_name')}</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium placeholder:text-slate-600"
                        placeholder={t('people.member_name_placeholder')}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 text-sm"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg text-sm"
                      >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSubmitting ? t('people.saving') : t('people.save')}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialLoading ? (
                   <div className="col-span-full p-12 text-center text-slate-500 flex flex-col items-center">
                     <Loader2 size={24} className="animate-spin mb-3 text-red-600" />
                     Loading family members...
                   </div>
                ) : people.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-slate-500 flex flex-col items-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
                    <Users size={32} className="mb-3 opacity-40" />
                    <p className="font-bold text-slate-400">No members yet</p>
                  </div>
                ) : (
                  people.map((person) => (
                    <motion.div 
                      variants={springUp}
                      initial="hidden"
                      animate="visible"
                      key={person.id} 
                      className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center font-black border border-slate-600">
                          {person.name.substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-white">{person.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(person)}
                          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(person)}
                          className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20 hover:border-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Delete Confirmation inside the modal or rendered externally - nesting AnimatePresence is fine */}
      {showDeleteModal && personToDelete && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
        >
          <motion.div 
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-black/80"
          >
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-xl font-black text-white text-center mb-2">{t('movie_detail.confirm_delete')}</h3>
            <p className="text-slate-400 text-center mb-6 font-medium text-sm">
              {t('people.confirm_delete')}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {t('movie_detail.confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
