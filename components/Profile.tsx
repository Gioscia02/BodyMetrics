import React, { useState } from 'react';
import { updatePassword, User } from 'firebase/auth';
import { updateUserAvatar } from '../services/firebase';

interface Props {
  user: User;
  avatarSrc?: string;
  onClose: () => void;
  onAvatarUpdate: () => void;
}

const Profile: React.FC<Props> = ({ user, avatarSrc, onClose, onAvatarUpdate }) => {
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

export default Profile;