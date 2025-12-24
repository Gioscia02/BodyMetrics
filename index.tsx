import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  updatePassword,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

// --- TYPES ---
export interface Measurement {
  id: string;
  name: string;
  value: number;
  timestamp: string; // YYYY-MM-DD
}

export interface MeasurementInput {
  name: string;
  value: string;
}

export interface UserProfile {
  avatarBase64?: string;
}

export interface GroupedMeasurement {
  date: string;
  items: Measurement[];
}

export type StatusType = 'idle' | 'loading' | 'connected' | 'error';

export interface StatusMessage {
  type: StatusType;
  text: string;
}

// --- CONSTANTS ---
const MEASUREMENT_TYPES = [
  { label: 'Peso (kg)', key: 'Peso', icon: 'fa-weight-scale', step: 0.1 },
  { label: 'Petto (cm)', key: 'Petto', icon: 'fa-ruler-horizontal', step: 0.1 },
  { label: 'Vita (cm)', key: 'Vita', icon: 'fa-ruler', step: 0.1 },
  { label: 'Fianchi (cm)', key: 'Fianchi', icon: 'fa-ruler-combined', step: 0.1 },
  { label: 'Coscia (cm)', key: 'Coscia', icon: 'fa-ruler-vertical', step: 0.1 },
  { label: 'Bicipite SX (cm)', key: 'Bicipite SX', icon: 'fa-dumbbell', step: 0.1 },
  { label: 'Bicipite DX (cm)', key: 'Bicipite DX', icon: 'fa-dumbbell', step: 0.1 },
  { label: 'Polpaccio (cm)', key: 'Polpaccio', icon: 'fa-shoe-prints', step: 0.1 },
  { label: 'Collo (cm)', key: 'Collo', icon: 'fa-user-tie', step: 0.1 },
];

// --- FIREBASE SERVICE ---
const firebaseConfig = {
    apiKey: "AIzaSyByfIi_FMkBbra3FHkcd0p_xez8vjOjgDI",
    authDomain: "measures-f90a3.firebaseapp.com",
    projectId: "measures-f90a3",
    storageBucket: "measures-f90a3.firebasestorage.app",
    messagingSenderId: "418634563706",
    appId: "1:418634563706:web:109dda11c1dca46f087bc3",
    measurementId: "G-JC4BC046R4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID_FIELD = 'default-app-id';

// User Profile Helpers
const getUserProfile = async (uid: string) => {
  const profileDoc = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'profile', 'info');
  const snap = await getDoc(profileDoc);
  return snap.exists() ? snap.data() : null;
};

const updateUserAvatar = async (uid: string, base64: string) => {
  const profileDoc = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'profile', 'info');
  await setDoc(profileDoc, { avatarBase64: base64 }, { merge: true });
};

// Measurement Helpers
const getMeasurementsCollection = (uid: string) => {
  return collection(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'measurements');
};

const addMeasurement = async (uid: string, name: string, value: number, date: string) => {
  await addDoc(getMeasurementsCollection(uid), {
    name,
    value,
    timestamp: date
  });
};

const updateMeasurement = async (uid: string, id: string, value: number, date: string) => {
  const docRef = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'measurements', id);
  await updateDoc(docRef, { value, timestamp: date });
};

const deleteMeasurement = async (uid: string, id: string) => {
  const docRef = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'measurements', id);
  await deleteDoc(docRef);
};

// --- COMPONENTS ---

// Auth Component
const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError("Compila tutti i campi.");
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e.code === 'auth/operation-not-allowed' ? "Abilita Email/Password in Console." : "Errore Login: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || password.length < 6) return setError("Email valida e password min 6 caratteri.");
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError("Errore: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="text-6xl text-indigo-600 mb-6">
          <i className="fa-solid fa-dumbbell"></i>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">BodyMetrics</h1>
        <p className="text-gray-500 mb-10 text-base">Il tuo diario di progressi fisici nel cloud.</p>

        <div className="space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Password"
          />
        </div>

        <div className="flex flex-col gap-4 mt-10">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center shadow-md"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin mr-3"></i> : null}
            Accedi
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold text-lg py-4 rounded-xl border border-gray-300 transition-colors"
          >
            Crea Account
          </button>
        </div>

        {error && (
          <p className="mt-8 text-red-500 text-base font-medium animate-pulse bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
        )}
      </div>
    </div>
  );
};

// MeasurementCharts Component
const MeasurementCharts: React.FC<{ data: Measurement[] }> = ({ data }) => {
  const charts = useMemo(() => {
    const groups: Record<string, { display: string; data: any[] }> = {};

    data.forEach((d) => {
      const rawName = d.name.trim();
      const key = rawName.toLowerCase();
      
      if (!groups[key]) {
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        groups[key] = {
          display: displayName,
          data: []
        };
      }

      groups[key].data.push({
        date: new Date(d.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: d.timestamp,
        value: d.value,
      });
    });

    const keys = Object.keys(groups).sort();
    const weightIndex = keys.findIndex((k) => k === 'peso' || k === 'weight');
    if (weightIndex > -1) {
      keys.unshift(keys.splice(weightIndex, 1)[0]);
    }

    return keys.map((key) => ({
      type: groups[key].display,
      data: groups[key].data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    }));
  }, [data]);

  if (charts.length === 0) {
    return (
      <div className="col-span-full text-center py-16 bg-white rounded-2xl text-gray-500 shadow-sm border border-gray-100 text-lg">
        Nessun grafico disponibile. Inizia ad aggiungere misurazioni!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {charts.map(({ type, data: chartData }) => {
        const unit = type.toLowerCase().includes('peso') ? 'kg' : 'cm';

        return (
          <div key={type} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-80 transition-shadow hover:shadow-lg">
            <h4 className="text-lg font-extrabold uppercase tracking-wider text-gray-800 mb-4">{type}</h4>
            <div className="flex-grow w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 30, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 14, fill: '#64748b', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin', 'dataMax']} 
                    padding={{ top: 25, bottom: 15 }}
                    tick={false}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    label={{ 
                      value: unit, 
                      angle: 0, 
                      position: 'insideLeft',
                      style: { fill: '#64748b', fontSize: '14px', fontWeight: 700 } 
                    }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px' }}
                    labelStyle={{ color: '#64748b', fontSize: '14px', fontWeight: 700 }}
                    itemStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#4f46e5' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#fff', stroke: '#4f46e5', strokeWidth: 3 }}
                    activeDot={{ r: 7, fill: '#4f46e5' }}
                    isAnimationActive={true}
                    label={{ 
                      position: 'top', 
                      fill: '#1e293b', 
                      fontSize: 12, 
                      fontWeight: 700,
                      dy: -8
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// MeasurementTable Component
interface TableProps {
  data: Measurement[];
  onEdit: (date: string, items: Measurement[]) => void;
  onDelete: (items: Measurement[]) => void;
}

const MeasurementTable: React.FC<TableProps> = ({ data, onEdit, onDelete }) => {
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Measurement[] } = {};
    data.forEach((item) => {
      if (!groups[item.timestamp]) groups[item.timestamp] = [];
      groups[item.timestamp].push(item);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({ date, items: groups[date] }));
  }, [data]);

  const handleDeleteClick = (e: React.MouseEvent, dateStr: string, items: Measurement[]) => {
    e.stopPropagation();

    const formattedDate = new Date(dateStr).toLocaleDateString('it-IT');
    if (window.confirm(`Eliminare i dati del ${formattedDate}?`)) {
      onDelete(items);
    }
  };

  const handleEditClick = (e: React.MouseEvent, dateStr: string, items: Measurement[]) => {
    e.stopPropagation();
    onEdit(dateStr, items);
  };

  if (groupedData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500 border border-gray-100 text-lg">
        Nessun dato. Inizia ad allenarti! 💪
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-sm uppercase text-gray-500 tracking-wider font-bold">
              <th className="px-6 py-5 w-40">Data</th>
              <th className="px-6 py-5">Misurazioni</th>
              <th className="px-6 py-5 text-right w-32">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-base">
            {groupedData.map(({ date, items }) => (
              <tr key={date} className="hover:bg-slate-50 transition-colors group relative">
                <td className="px-6 py-5 font-bold text-gray-800 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500">
                      <i className="fa-regular fa-calendar"></i>
                    </div>
                    {new Date(date).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-3">
                    {items
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-indigo-50 border border-indigo-100 text-indigo-900 px-4 py-1.5 rounded-full text-sm font-medium flex gap-2 items-center shadow-sm"
                        >
                          <span className="text-indigo-600/80 font-semibold">{item.name}</span>
                          <span className="font-extrabold text-indigo-700">
                            {item.value.toFixed(1)} {item.name.toLowerCase() === 'peso' ? 'kg' : 'cm'}
                          </span>
                        </div>
                      ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-3 relative z-10">
                    <button
                      type="button"
                      onClick={(e) => handleEditClick(e, date, items)}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                      title="Modifica"
                    >
                      <i className="fa-solid fa-pen text-lg pointer-events-none"></i>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, date, items)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Elimina"
                    >
                      <i className="fa-solid fa-trash text-lg pointer-events-none"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// MeasurementModal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, measurements: Record<string, string>, existingItems?: Measurement[]) => Promise<void>;
  editDate?: string;
  editItems?: Measurement[];
}

const MeasurementModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, editDate, editItems }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editDate && editItems) {
        setDate(editDate);
        const newValues: Record<string, string> = {};
        editItems.forEach((item) => {
          newValues[item.name] = item.value.toString();
        });
        setValues(newValues);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setValues({});
      }
    }
  }, [isOpen, editDate, editItems]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(date, values, editItems);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-full">
              <i className={`fa-solid ${editDate ? 'fa-pen-to-square' : 'fa-plus'} text-indigo-600 text-xl`}></i>
            </div>
            {editDate ? 'Modifica Misurazione' : 'Nuova Misurazione'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-all">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-8">
            <label className="block text-sm font-bold uppercase text-gray-500 mb-3 tracking-wider">Data Rilevazione</label>
            <div className="relative">
              <i className="fa-regular fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-5 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {MEASUREMENT_TYPES.map((type) => (
              <div key={type.key} className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">{type.label}</label>
                <div className="relative group">
                  <i className={`fa-solid ${type.icon} absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors text-lg`}></i>
                  <input
                    type="number"
                    step={type.step}
                    min="0"
                    placeholder="0.0"
                    value={values[type.key] || ''}
                    onChange={(e) => handleChange(type.key, e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-colors flex items-center gap-3 disabled:opacity-70 shadow-lg hover:shadow-indigo-500/30"
            >
              {loading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
              Salva Misurazione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Profile Component
interface ProfileProps {
  user: User;
  avatarSrc?: string;
  onClose: () => void;
  onAvatarUpdate: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, avatarSrc, onClose, onAvatarUpdate }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [message, setMessage] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Immagine troppo grande (max 1MB).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          const MAX_HEIGHT = 300;
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        updateUserAvatar(user.uid, resizedBase64).then(() => {
          onAvatarUpdate();
          setMessage("Avatar aggiornato!");
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordUpdate = async () => {
    if (newPass.length < 6) return alert("Password min 6 caratteri.");
    if (newPass !== confirmPass) return alert("Le password non coincidono.");
    try {
      await updatePassword(user, newPass);
      alert("Password aggiornata!");
      setNewPass('');
      setConfirmPass('');
    } catch (error: any) {
      alert("Errore: " + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10 text-center relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Il tuo Profilo</h2>
          <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="relative w-36 h-36 mx-auto mb-6 group">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-50 shadow-lg">
            <img 
              src={avatarSrc || 'https://via.placeholder.com/150?text=Foto'} 
              alt="Avatar" 
              className="w-full h-full object-cover bg-slate-100"
            />
          </div>
          <label className="absolute bottom-1 right-1 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors border-2 border-white shadow-md">
            <i className="fa-solid fa-camera text-base"></i>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        <p className="text-sm font-semibold text-gray-500 mb-10 bg-slate-50 inline-block px-4 py-2 rounded-full">{message || user.email}</p>

        <div className="border-t border-gray-100 my-8"></div>

        <div className="text-left mb-8">
          <h3 className="text-lg font-bold text-gray-700 mb-5 flex items-center gap-3">
            <i className="fa-solid fa-lock text-indigo-500"></i> Sicurezza
          </h3>
          <div className="space-y-4">
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Nuova Password"
            />
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Conferma Password"
            />
          </div>
          <button 
            onClick={handlePasswordUpdate}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base shadow-md"
          >
            Aggiorna Password
          </button>
        </div>

        <button onClick={onClose} className="w-full bg-white border border-gray-300 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-base">
          Torna alla Dashboard
        </button>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<Measurement[]>([]);
  const [status, setStatus] = useState<StatusMessage>({ type: 'loading', text: 'Sincronizzazione...' });
  const [view, setView] = useState<'dashboard' | 'profile'>('dashboard');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  
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
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setData(items);
        setStatus({ type: 'connected', text: 'Dati Aggiornati' });
        
        setTimeout(() => setStatus({ type: 'idle', text: '' }), 3000);
      }, 
      (error) => {
        console.error(error);
        setStatus({ type: 'error', text: 'Errore Sync' });
      }
    );
    
    loadAvatar();

    return () => unsubscribe();
  }, [user.uid]);

  const loadAvatar = async () => {
    const profile = await getUserProfile(user.uid);
    if (profile?.avatarBase64) setAvatar(profile.avatarBase64);
  };

  const handleSaveMeasurement = async (date: string, measurements: Record<string, string>, existingItems?: Measurement[]) => {
    const promises = [];
    
    if (existingItems) {
      const existingMap = new Map(existingItems.map(i => [i.name, i]));
      
      for (const [name, valStr] of Object.entries(measurements)) {
        if (!valStr) continue;
        const val = parseFloat(valStr);
        const existing = existingMap.get(name);
        
        if (existing) {
          promises.push(updateMeasurement(user.uid, existing.id, val, date));
          existingMap.delete(name);
        } else {
          promises.push(addMeasurement(user.uid, name, val, date));
        }
      }
      
      for (const item of existingMap.values()) {
        promises.push(deleteMeasurement(user.uid, item.id));
      }

    } else {
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
    return <Profile user={user} avatarSrc={avatar} onClose={() => setView('dashboard')} onAvatarUpdate={loadAvatar} />;
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
              {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="User" /> : <i className="fa-solid fa-user"></i>}
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
        <MeasurementCharts data={data} />
        
        <div className="mb-5 flex items-center gap-3 px-2 mt-10">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
            <i className="fa-solid fa-clock-rotate-left text-lg"></i>
          </div>
          <h2 className="text-base font-bold uppercase text-gray-600 tracking-wider">Storico Completo</h2>
        </div>
        
        <MeasurementTable 
          data={data} 
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

// --- APP COMPONENT ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-indigo-600">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl"></i>
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <Auth />;
};

// --- RENDER ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);