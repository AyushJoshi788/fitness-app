// src/auth/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { AuthContextType } from './authTypes';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
