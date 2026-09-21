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
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

export type CloudGameState = {
  coins: number;
  stones: number;
  starterId: number;
  cards: Record<string, { copies: number; level: number }>;
  updatedAt?: unknown;
};

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

export function watchCloudGame(user: User, callback: (state: CloudGameState | null) => void): Unsubscribe {
  if (!database) return () => undefined;
  return onSnapshot(doc(database, 'players', user.uid), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() as CloudGameState : null);
  });
}

export async function saveCloudGame(user: User, state: CloudGameState) {
  if (!database) throw new Error('Firestore no está configurado.');
  await setDoc(doc(database, 'players', user.uid), {
    ...state,
    email: user.email,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

