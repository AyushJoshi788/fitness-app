// src/firebase/firebaseWorkouts.ts
// Production Firestore Workout Persistence

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { WorkoutLog, WorkoutAnalysis } from '../domain/types';
import { workoutAudit } from '../domain/workoutAudit';

/**
 * Save a workout to Firestore
 * Path: users/{userId}/workouts/{workoutId}
 */
export const saveWorkout = async (userId: string, workout: WorkoutLog) => {
  const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
  await setDoc(workoutRef, {
    ...workout,
    dateISO: workout.dateISO,
    createdAt: new Date().toISOString(),
    exercises: workout.exercises,
  });
};

/**
 * Get all workouts for a user
 */
export const getUserWorkouts = async (userId: string): Promise<WorkoutLog[]> => {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(workoutsRef, orderBy('dateISO', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => doc.data() as WorkoutLog);
};

/**
 * Get workouts for a specific date range
 */
export const getWorkoutsInRange = async (
  userId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
): Promise<WorkoutLog[]> => {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(
    workoutsRef,
    where('dateISO', '>=', startDate),
    where('dateISO', '<=', endDate),
    orderBy('dateISO', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => doc.data() as WorkoutLog);
};

/**
 * Get today's workout (if exists)
 */
export const getTodayWorkout = async (userId: string): Promise<WorkoutLog | null> => {
  const today = new Date().toISOString().split('T')[0];
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(workoutsRef, where('dateISO', '==', today));
  const snapshot = await getDocs(q);
  return snapshot.docs[0]?.data() as WorkoutLog | undefined ?? null;
};

/**
 * Delete a workout
 */
export const deleteWorkout = async (userId: string, workoutId: string) => {
  const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
  await deleteDoc(workoutRef);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: Record<string, unknown>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  return snapshot.data();
};

/**
 * Save audit result to Firestore
 * Path: users/{userId}/audits/{auditId}
 */
export const saveAuditResult = async (userId: string, workoutId: string, auditResult: Record<string, unknown>) => {
  const auditRef = doc(db, 'users', userId, 'audits', workoutId);
  await setDoc(auditRef, {
    ...auditResult,
    workoutId,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Get latest audit results
 */
export const getLatestAudits = async (userId: string, limit: number = 10) => {
  const auditsRef = collection(db, 'users', userId, 'audits');
  const q = query(auditsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map((doc: any) => doc.data());
};

/**
 * Create user profile on first signup
 */
export const createUserProfile = async (userId: string, profileData: Record<string, unknown>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, profileData);
};

/**
 * Get recent workouts (last N days)
 */
export const getRecentWorkouts = async (userId: string, days: number = 7): Promise<WorkoutLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateISO = startDate.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  return getWorkoutsInRange(userId, startDateISO, today);
};

/**
 * Get AI analysis for a workout
 */
export const getWorkoutAnalysis = async (workout: WorkoutLog): Promise<WorkoutAnalysis> => {
  const auditResult = workoutAudit(workout.exercises);
  
  // Return structured analysis
  return {
    totalSets: auditResult.good.length,
    totalReps: 0,
    tonnageKg: 0,
    pushSets: 0,
    pullSets: 0,
    legSets: 0,
    compoundSets: 0,
    isolationSets: 0,
    setsByMuscle: {
      chest: 0, front_delts: 0, side_delts: 0, rear_delts: 0,
      triceps: 0, biceps: 0, lats: 0, upper_back: 0, lower_back: 0,
      quads: 0, hamstrings: 0, glutes: 0, calves: 0, abs: 0,
    },
    missedMuscles: [],
    warnings: auditResult.warnings,
    coachOutput: {
      didCorrectly: auditResult.good,
      missed: auditResult.missing,
      imbalanceOrRisk: auditResult.warnings,
      recommendations: auditResult.suggestions,
      nextDayAdvice: [],
      weeklySummary: [],
    },
  };
};
