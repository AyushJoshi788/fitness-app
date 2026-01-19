// src/auth/authTypes.ts
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  ageGroup?: 'teen' | 'young-adult' | 'adult' | 'senior';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goal?: 'weight-loss' | 'muscle-gain' | 'endurance' | 'general-fitness';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}
