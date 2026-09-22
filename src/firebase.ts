import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';

export type CloudGameState = {
  coins: number;
  stones: number;
  starterId: number;
  cards: Record<string, { copies: number; level: number }>;
  lastActiveAt?: number;
  updatedAt?: unknown;
};

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCDb1OYRwNbRH5Xzq6nfThN0s9X0ISdYI4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pokemon-expedition-idle.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pokemon-expedition-idle',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pokemon-expedition-idle.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '279783792378',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:279783792378:web:419c995eb89f6f011af343',
};

export const firebaseConfigured = Object.values(config).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Firestore | null = null;

if (firebaseConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  database = getFirestore(app);
}

export function getFirebaseAuth() {
  return auth;
}

export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase no está configurado.');
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function logoutFromGoogle() {
  if (auth) await signOut(auth);
}

export async function loadCloudGame(user: User): Promise<CloudGameState | null> {
  if (!database) throw new Error('Firestore no está configurado.');
  const snapshot = await getDoc(doc(database, 'players', user.uid));
  return snapshot.exists() ? snapshot.data() as CloudGameState : null;
}

export async function saveCloudGame(user: User, state: CloudGameState) {
  if (!database) throw new Error('Firestore no está configurado.');
  await setDoc(doc(database, 'players', user.uid), {
    ...state,
    email: user.email,
    lastActiveAt: Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
