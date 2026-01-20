// src/contexts/AuthContext.tsx
// Global authentication state management with Firebase

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/firebaseAuth';
import type { UserProfile } from '../domain/types';
import { getUserProfile, createUserProfile } from '../firebase/firebaseWorkouts';

interface AuthContextType {
  user: { uid: string; email: string; displayName: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setLoading(true);

      if (authUser) {
        setUser({
          uid: authUser.uid,
          email: authUser.email || '',
          displayName: authUser.displayName || 'User',
        });

        try {
          let profile = await getUserProfile(authUser.uid);

          if (!profile) {
            profile = {
              userId: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || 'User',
              height: 0,
              weight: 0,
              experienceLevel: 'beginner',
              preferences: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await createUserProfile(authUser.uid, profile);
          }

          setUserProfile(profile as UserProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
