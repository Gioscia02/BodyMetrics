import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

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

export default Auth;