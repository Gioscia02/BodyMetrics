import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc 
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyByfIi_FMkBbra3FHkcd0p_xez8vjOjgDI",
    authDomain: "measures-f90a3.firebaseapp.com",
    projectId: "measures-f90a3",
    storageBucket: "measures-f90a3.firebasestorage.app",
    messagingSenderId: "418634563706",
    appId: "1:418634563706:web:109dda11c1dca46f087bc3",
    measurementId: "G-JC4BC046R4"
};

// Initialize Firebase with Singleton Pattern
// Questo controllo è fondamentale per Vite/HMR: usa l'istanza esistente se c'è.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Ottieni l'istanza Auth.
// La persistenza è 'browserLocalPersistence' di default.
// Non chiamiamo setPersistence() qui per evitare di resettare lo stato durante i reload del codice.
export const auth = getAuth(app);

export const db = getFirestore(app);
export const APP_ID_FIELD = 'default-app-id';

// User Profile Helpers
export const getUserProfile = async (uid: string) => {
  const profileDoc = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'profile', 'info');
  const snap = await getDoc(profileDoc);
  return snap.exists() ? snap.data() : null;
};

export const updateUserAvatar = async (uid: string, base64: string) => {
  const profileDoc = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'profile', 'info');
  await setDoc(profileDoc, { avatarBase64: base64 }, { merge: true });
};

// Measurement Helpers
export const getMeasurementsCollection = (uid: string) => {
  return collection(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'measurements');
};

export const addMeasurement = async (uid: string, name: string, value: number, date: string) => {
  await addDoc(getMeasurementsCollection(uid), {
    name,
    value,
    timestamp: date
  });
};

export const updateMeasurement = async (uid: string, id: string, value: number, date: string) => {
  const docRef = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'measurements', id);
  await updateDoc(docRef, { value, timestamp: date });
};

export const deleteMeasurement = async (uid: string, id: string) => {
  const docRef = doc(db, 'artifacts', APP_ID_FIELD, 'users', uid, 'measurements', id);
  await deleteDoc(docRef);
};