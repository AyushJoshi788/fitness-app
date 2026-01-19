// src/auth/AuthProvider.tsx
import type React from 'react';
import { createContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import type { AuthContextType, User, AuthState } from './authTypes';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Listen for auth state changes (handles session persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
            ...(userDocSnap.exists() && userDocSnap.data()),
          };

          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: true,
          });
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: (error as Error).message,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string): Promise<User> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: '',
        photoURL: '',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), user);

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        loading: false,
      }));

      return user;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
        ...(userDocSnap.exists() && userDocSnap.data()),
      };

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        loading: false,
      }));

      return user;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  };

  // Google Sign In
  const signInWithGoogle = async (): Promise<User> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if user already exists
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Create profile if first time
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date(),
        });
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
        ...(userDocSnap.exists() && userDocSnap.data()),
      };

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        loading: false,
      }));

      return user;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await firebaseSignOut(auth);
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  // Update User Profile
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!state.user) throw new Error('No user logged in');

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Firebase user not found');

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await firebaseUpdateProfile(firebaseUser, {
          displayName: updates.displayName || firebaseUser.displayName || '',
          photoURL: updates.photoURL || firebaseUser.photoURL || '',
        });
      }

      // Update Firestore profile
      await setDoc(
        doc(db, 'users', state.user.id),
        { ...updates, id: state.user.id },
        { merge: true }
      );

      setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
