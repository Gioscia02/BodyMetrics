import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Monitora lo stato dell'autenticazione standard
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-indigo-600 flex-col gap-4">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
        <div className="text-gray-500 font-medium animate-pulse">Caricamento in corso...</div>
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <Auth />;
};

export default App;