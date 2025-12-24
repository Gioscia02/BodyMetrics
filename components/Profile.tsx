import React, { useState, useEffect } from 'react';
import { updatePassword, User } from 'firebase/auth';
import { saveUserProfile, getUserProfile } from '../services/firebase';
import { UserProfile } from '../types';

interface Props {
  user: User;
  avatarSrc?: string;
  onClose: () => void;
  onProfileUpdate: () => void;
}

const Profile: React.FC<Props> = ({ user, avatarSrc, onClose, onProfileUpdate }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [message, setMessage] = useState('');
  
  // Profile Data States
  const [height, setHeight] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getUserProfile(user.uid);
      if (data) {
        if (data.height) setHeight(data.height.toString());
        if (data.gender) setGender(data.gender);
        if (data.birthDate) setBirthDate(data.birthDate);
      }
    };
    fetchInfo();
  }, [user.uid]);

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
        saveUserProfile(user.uid, { avatarBase64: resizedBase64 }).then(() => {
          onProfileUpdate();
          setMessage("Avatar aggiornato!");
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<UserProfile> = {};
      if (height) updates.height = parseFloat(height);
      if (gender) updates.gender = gender;
      if (birthDate) updates.birthDate = birthDate;

      await saveUserProfile(user.uid, updates);
      onProfileUpdate(); // Trigger refresh in parent
      alert("Dati salvati correttamente!");
    } catch (e) {
      alert("Errore salvataggio dati.");
    } finally {
      setIsSaving(false);
    }
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
    <div className="flex items-center justify-center min-h-screen p-6 animate-in slide-in-from-bottom-10 fade-in duration-300 bg-slate-50/50">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Il tuo Profilo</h2>
          <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="relative w-36 h-36 mx-auto mb-6 group">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100">
            <img 
              src={avatarSrc || 'https://via.placeholder.com/150?text=Foto'} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <label className="absolute bottom-1 right-1 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors border-2 border-white shadow-md transform hover:scale-110">
            <i className="fa-solid fa-camera text-sm"></i>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        
        <div className="text-sm font-semibold text-gray-500 mb-8">{user.email}</div>

        <div className="text-left space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <i className="fa-solid fa-ruler-combined text-sm"></i>
                </div>
                Dati Fisici
                <span className="text-xs font-normal text-gray-400 ml-auto">Necessari per le statistiche</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Sesso Biologico</label>
                      <div className="flex gap-4">
                          <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${gender === 'male' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} className="hidden" />
                              <i className="fa-solid fa-mars"></i> Uomo
                          </label>
                          <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} className="hidden" />
                              <i className="fa-solid fa-venus"></i> Donna
                          </label>
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Altezza (cm)</label>
                      <input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="Es: 175"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                      />
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Data Nascita</label>
                      <input 
                        type="date" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                      />
                  </div>
              </div>
              
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70"
              >
                {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Salva Dati Fisici'}
              </button>
            </div>

            <div className="border-t border-gray-100 my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <i className="fa-solid fa-shield-halved text-sm"></i>
                </div>
                Sicurezza
              </h3>
              <div className="space-y-4">
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all"
                  placeholder="Nuova Password"
                />
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all"
                  placeholder="Conferma Password"
                />
              </div>
              <button 
                onClick={handlePasswordUpdate}
                className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Aggiorna Password
              </button>
            </div>
        </div>

        <div className="mt-8">
            <button onClick={onClose} className="w-full text-gray-500 hover:text-gray-800 font-semibold py-2">
            Torna alla Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;