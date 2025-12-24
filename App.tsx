import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './services/firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Monitora lo stato dell'autenticazione
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Se c'è un utente, mostriamo la dashboard
        setUser(currentUser);
        setLoading(false);
      } else {
        // Se NON c'è un utente (logout o refresh pagina), eseguiamo l'AUTO-LOGIN
        try {
          console.log("Tentativo di auto-login con credenziali predefinite...");
          await signInWithEmailAndPassword(auth, "tomscomputer1@gmail.com", "123456");
          // Se il login riesce, Firebase attiverà di nuovo questo listener con l'utente loggato.
        } catch (error) {
          console.error("Auto-login fallito:", error);
          // Solo se fallisce l'auto-login (es. password errata o offline) mostriamo il form di login
          setLoading(false);
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-indigo-600 flex-col gap-4">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
        <div className="text-gray-500 font-medium animate-pulse">Accesso automatico in corso...</div>
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <Auth />;
};

export default App;