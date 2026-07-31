import React, { useState, useEffect } from 'react';
import { AlertCircle, PlusCircle, Users, Settings as SettingsIcon, Trash2, Loader2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Person } from '../types';

export const People: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { loadPeople(); }, []);

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

  const isDuplicate = (nameToCheck: string) => {
    return people.some(p => p.name.toLowerCase().trim() === nameToCheck.toLowerCase().trim());
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (isDuplicate(name)) { setError("This name already exists."); return; }

    try {
      setLoading(true);
      setError('');
      const newPerson = await dbService.addPerson(name);
      setPeople([...people, newPerson].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err: any) {
      setError(err.message || "Failed to add person.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (person: Person) => {
    setEditId(person.id);
    setEditName(person.name);
    setError('');
  };

  const handleUpdate = async (id: number) => {
    const name = editName.trim();
    if (!name) { setEditId(null); return; }
    const person = people.find(p => p.id === id);
    if (person && person.name === name) { setEditId(null); return; }
    if (isDuplicate(name)) { setError("This name already exists."); return; }

    try {
      setLoading(true);
      setError('');
      await dbService.updatePerson(id, name);
      setPeople(people.map(p => p.id === id ? { ...p, name } : p).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
    } catch (err) {
      setError("Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      setIsDeleting(true);
      await dbService.deletePerson(personToDelete.id);
      setPeople(people.filter(p => p.id !== personToDelete.id));
      setPersonToDelete(null);
    } catch (err) {
      setError("Failed to delete person.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-50 tracking-tight mb-2">Family Members</h1>
        <p className="text-slate-400 font-medium">Manage the people who can rate movies in your collection.</p>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3"><AlertCircle size={20} /> <span className="font-medium">{error}</span></div>}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter a name (e.g., Dad, Mom)..." 
          className="flex-1 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 text-slate-50 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors duration-300 ease-out font-medium shadow-inner"
          disabled={loading || initialLoading}
        />
        <button type="submit" disabled={loading || !newName.trim() || initialLoading} className="px-8 py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-bold transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/50 hover:shadow-2xl">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />} Add Person
        </button>
      </form>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/50 transition-all duration-300 ease-out">
        {initialLoading ? (
           <div className="p-16 text-center text-slate-500 flex flex-col items-center">
             <Loader2 size={32} className="animate-spin mb-4 text-red-600" />
             Loading family members...
           </div>
        ) : people.length === 0 ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center border-2 border-dashed border-slate-800/50 rounded-2xl m-4 bg-slate-900/50">
            <Users size={48} className="mb-4 opacity-40" />
            <p className="text-xl font-bold text-slate-300">No one here yet</p>
            <p className="text-slate-500 mt-2 font-medium">Add your first family member to start rating movies.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/50">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors group">
                {editId === person.id ? (
                  <input 
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-slate-900 border border-red-600 text-slate-50 rounded px-4 py-2 focus:outline-none w-full max-w-sm mr-4 transition-all font-medium"
                  />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
                      {person.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-slate-200 font-bold text-lg">{person.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  {editId === person.id ? (
                    <>
                      <button onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-50 transition-colors font-medium">Cancel</button>
                      <button onClick={() => handleUpdate(person.id)} className="px-4 py-2 text-sm bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-xl font-bold transition-all duration-300 ease-out active:scale-95 border border-slate-600/50">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(person)} className="p-2 text-slate-500 hover:text-slate-200 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><SettingsIcon size={18} /></button>
                      <button onClick={() => setPersonToDelete(person)} className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {personToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-black/80">
            <h3 className="text-2xl font-black text-white mb-2">Delete Person?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">This will permanently remove <span className="text-slate-200 font-bold">{personToDelete.name}</span> and all their ratings from the database.</p>
            <div className="flex gap-4">
              <button onClick={() => setPersonToDelete(null)} disabled={isDeleting} className="flex-1 px-4 py-4 bg-slate-800/60 hover:bg-slate-700/80 text-white rounded-2xl font-bold transition-all duration-300 ease-out border border-slate-700/50 hover:-translate-y-1">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-bold transition-all duration-300 ease-out shadow-xl shadow-black/50 hover:-translate-y-1">
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
