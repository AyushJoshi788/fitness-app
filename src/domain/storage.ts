import type { SubscriptionInfo, UserProfile, WorkoutLog } from './types'

const KEY_PROFILE = 'fitnessAI.profile.v1'
const KEY_SUB = 'fitnessAI.subscription.v1'
const KEY_WORKOUTS = 'fitnessAI.workouts.v1'

export const DEFAULT_PROFILE: UserProfile = {
  heightCm: 175,
  weightKg: 75,
  experience: 'beginner',
  goal: 'muscle_gain',
  daysPerWeek: 4,
}

export const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  status: 'free',
}

function safeParseJSON<T>(raw: string | null): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function loadProfile(): UserProfile {
  return safeParseJSON<UserProfile>(localStorage.getItem(KEY_PROFILE)) ?? DEFAULT_PROFILE
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile))
}

export function loadSubscription(): SubscriptionInfo {
  return safeParseJSON<SubscriptionInfo>(localStorage.getItem(KEY_SUB)) ?? DEFAULT_SUBSCRIPTION
}

export function saveSubscription(sub: SubscriptionInfo) {
  localStorage.setItem(KEY_SUB, JSON.stringify(sub))
}

export function loadWorkouts(): WorkoutLog[] {
  return safeParseJSON<WorkoutLog[]>(localStorage.getItem(KEY_WORKOUTS)) ?? []
}

export function saveWorkouts(workouts: WorkoutLog[]) {
  localStorage.setItem(KEY_WORKOUTS, JSON.stringify(workouts))
}

export function upsertWorkout(workouts: WorkoutLog[], workout: WorkoutLog) {
  const next = workouts.filter((w) => w.id !== workout.id)
  next.push(workout)
  next.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
  return next
}

