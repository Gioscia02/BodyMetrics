import React, { useState, useEffect, useCallback } from 'react';
import { User, signOut } from 'firebase/auth';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, getMeasurementsCollection, addMeasurement, updateMeasurement, deleteMeasurement, getUserProfile } from '../services/firebase';
import { Measurement, StatusMessage, UserProfile } from '../types';
import MeasurementCharts from './MeasurementCharts';
import MeasurementTable from './MeasurementTable';
import MeasurementModal from './MeasurementModal';
import Profile from './Profile';

interface Props {
  user: User;
}

const Dashboard: React.FC<Props> = ({ user }) => {
  const [data, setData] = useState<Measurement[]>([]);
  const [status, setStatus] = useState<StatusMessage>({ type: 'loading', text: 'Sincronizzazione...' });
  const [view, setView] = useState<'dashboard' | 'profile'>('dashboard');
  
  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | undefined>(undefined);
  const [editingItems, setEditingItems] = useState<Measurement[] | undefined>(undefined);

  // Load Data
  useEffect(() => {
    const q = query(getMeasurementsCollection(user.uid)); 
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Measurement));
        // Sort by timestamp desc
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setData(items);
        setStatus({ type: 'connected', text: 'Dati Aggiornati' });
        
        // Reset status message after 3s
        setTimeout(() => setStatus({ type: 'idle', text: '' }), 3000);
      }, 
      (error) => {
        console.error(error);
        setStatus({ type: 'error', text: 'Errore Sync' });
      }
    );
    
    loadProfile();

    return () => unsubscribe();
  }, [user.uid]);

  const loadProfile = async () => {
    const profile = await getUserProfile(user.uid);
    if (profile) setUserProfile(profile);
  };

  const handleSaveMeasurement = async (date: string, measurements: Record<string, string>, existingItems?: Measurement[]) => {
    const promises = [];
    
    if (existingItems) {
      const existingMap = new Map(existingItems.map(i => [i.name, i]));
      
      // Process inputs
      for (const [name, valStr] of Object.entries(measurements)) {
        if (!valStr) continue; // Skip empty
        const val = parseFloat(valStr);
        const existing = existingMap.get(name);
        
        if (existing) {
          promises.push(updateMeasurement(user.uid, existing.id, val, date));
          existingMap.delete(name); // Handled
        } else {
          promises.push(addMeasurement(user.uid, name, val, date));
        }
      }
      
      // Delete remaining
      for (const item of existingMap.values()) {
        promises.push(deleteMeasurement(user.uid, item.id));
      }

    } else {
      // Add Mode
      for (const [name, val] of Object.entries(measurements)) {
        if (val) promises.push(addMeasurement(user.uid, name, parseFloat(val), date));
      }
    }
    
    await Promise.all(promises);
  };

  const handleDeleteGroup = useCallback(async (items: Measurement[]) => {
    if (!items || items.length === 0) return;
    try {
      console.log(`Deleting ${items.length} items...`);
      await Promise.all(items.map(i => deleteMeasurement(user.uid, i.id)));
      console.log('Deletion complete');
    } catch (e: any) {
      console.error("Delete failed:", e);
      alert("Errore durante l'eliminazione: " + e.message);
    }
  }, [user.uid]);

  const handleExport = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (view === 'profile') {
    return <Profile user={user} avatarSrc={userProfile?.avatarBase64} onClose={() => setView('dashboard')} onProfileUpdate={loadProfile} />;
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      {/* Status Bar */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full text-sm font-bold shadow-lg transition-all duration-500 flex items-center gap-3 ${
        status.type === 'idle' ? '-translate-y-24 opacity-0' : 
        status.type === 'connected' ? 'bg-emerald-500 text-white translate-y-0 opacity-100' : 
        status.type === 'error' ? 'bg-red-500 text-white translate-y-0 opacity-100' :
        'bg-amber-400 text-amber-900 translate-y-0 opacity-100'
      }`}>
        {status.type === 'loading' && <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>}
        {status.type === 'connected' && <i className="fa-solid fa-check text-lg"></i>}
        {status.type === 'error' && <i className="fa-solid fa-triangle-exclamation text-lg"></i>}
        {status.text}
      </div>

      {/* Navbar */}
      <div className="sticky top-4 z-40 px-2 sm:px-4 mb-8">
        <div className="max-w-[98%] mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-md border border-gray-200 p-4 sm:px-6 flex justify-between items-center">
          <div 
            className="flex items-center gap-4 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors"
            onClick={() => setView('profile')}
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-indigo-200 overflow-hidden flex items-center justify-center text-indigo-600 shadow-sm text-xl">
              {userProfile?.avatarBase64 ? <img src={userProfile.avatarBase64} className="w-full h-full object-cover" alt="User" /> : <i className="fa-solid fa-user"></i>}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-0.5">Account</div>
              <div className="text-base font-bold text-gray-800 leading-tight truncate max-w-[200px]">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setEditingDate(undefined); setEditingItems(undefined); setIsModalOpen(true); }}
              className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-base font-bold transition-transform hover:scale-105 items-center gap-2 shadow-md active:scale-95"
            >
              <i className="fa-solid fa-plus"></i> Aggiungi
            </button>
            <button onClick={handleExport} className="p-3 text-gray-500 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors text-lg" title="Backup">
              <i className="fa-solid fa-download"></i>
            </button>
            <button onClick={() => signOut(auth)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-lg" title="Esci">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[98%] mx-auto px-2 sm:px-4">
        {/* Missing Profile Data Warning */}
        {(!userProfile?.height || !userProfile?.gender) && (
          <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 cursor-pointer" onClick={() => setView('profile')}>
            <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
              <i className="fa-solid fa-clipboard-list text-xl"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Completa il tuo profilo!</h4>
              <p className="text-sm text-gray-600">Aggiungi Altezza e Sesso per sbloccare le statistiche avanzate (BMI, Massa Grassa, etc.).</p>
            </div>
            <i className="fa-solid fa-chevron-right text-orange-400"></i>
          </div>
        )}

        <MeasurementCharts data={data} userProfile={userProfile} />
        
        <div className="mb-5 flex items-center gap-3 px-2 mt-10">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
            <i className="fa-solid fa-clock-rotate-left text-lg"></i>
          </div>
          <h2 className="text-base font-bold uppercase text-gray-600 tracking-wider">Storico Completo</h2>
        </div>
        
        <MeasurementTable 
          data={data} 
          userProfile={userProfile}
          onEdit={(date, items) => {
            setEditingDate(date);
            setEditingItems(items);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteGroup} 
        />
      </div>

      {/* FAB for Mobile */}
      <button 
        onClick={() => { setEditingDate(undefined); setEditingItems(undefined); setIsModalOpen(true); }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-indigo-700 hover:scale-110 transition-all sm:hidden z-40 border-4 border-white"
      >
        <i className="fa-solid fa-plus"></i>
      </button>

      <MeasurementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMeasurement}
        editDate={editingDate}
        editItems={editingItems}
      />
    </div>
  );
};

export default Dashboard;