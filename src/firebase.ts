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
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { GAME_STATE_VERSION, migrateGameState, type GameState } from './gameEngine';

export type LoadedCloudGame = {
  state: GameState;
  revision: number;
  updatedAtMs: number | null;
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

export async function loadCloudGame(user: User): Promise<LoadedCloudGame | null> {
  if (!database) throw new Error('Firestore no está configurado.');
  const snapshot = await getDoc(doc(database, 'players', user.uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    state: migrateGameState(data.state ?? data),
    revision: typeof data.revision === 'number' ? data.revision : 0,
    updatedAtMs: typeof data.updatedAtMs === 'number' ? data.updatedAtMs : null,
  };
}

export async function saveCloudGame(user: User, state: GameState, expectedRevision: number) {
  if (!database) throw new Error('Firestore no está configurado.');
  const reference = doc(database, 'players', user.uid);
  return runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const remoteRevision = snapshot.exists() && typeof snapshot.data().revision === 'number' ? snapshot.data().revision : 0;
    if (remoteRevision !== expectedRevision) throw new Error('CLOUD_SAVE_CONFLICT');
    const savedAt = Date.now();
    const revision = remoteRevision + 1;
    transaction.set(reference, {
      schemaVersion: GAME_STATE_VERSION,
      state: { ...state, schemaVersion: GAME_STATE_VERSION, lastActiveAt: savedAt },
      revision,
      email: user.email,
      updatedAtMs: savedAt,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { revision, savedAt };
  });
}
