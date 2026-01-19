// src/firebase/firebaseAuth.ts
// Production Authentication Service

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

/**
 * Create new user account with email/password
 * Also creates user profile in Firestore
 */
export const registerUser = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    createdAt: new Date().toISOString(),
    // Default profile
    heightCm: 175,
    weightKg: 75,
    experience: 'intermediate' as const,
    goal: 'muscle_gain' as const,
    daysPerWeek: 4 as const,
  });

  return user;
};

/**
 * Sign in with email/password
 */
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Create/update user profile in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
      heightCm: 175,
      weightKg: 75,
      experience: 'intermediate' as const,
      goal: 'muscle_gain' as const,
      daysPerWeek: 4 as const,
    });
  }

  return user;
};

/**
 * Sign out user
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Listen to auth state changes
 * Returns unsubscribe function
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
