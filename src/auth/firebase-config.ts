// src/auth/firebase-config.ts
// Setup: npm install firebase

import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * STEP 1: Get these from Firebase Console (console.firebase.google.com)
 * 1. Create new project
 * 2. Create web app
 * 3. Copy config below
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore Database
export const db: Firestore = getFirestore(app);

// Setup: Add these to .env.local
// VITE_FIREBASE_API_KEY=xxx
// VITE_FIREBASE_AUTH_DOMAIN=xxx
// VITE_FIREBASE_PROJECT_ID=xxx
// VITE_FIREBASE_STORAGE_BUCKET=xxx
// VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
// VITE_FIREBASE_APP_ID=xxx
