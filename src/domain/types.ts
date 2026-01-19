export type SubscriptionStatus = 'free' | 'premium_active' | 'premium_expired'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'strength'

export type MuscleGroup =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'triceps'
  | 'biceps'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'

export type MovementPattern =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'carry'
  | 'core'

export type ExerciseType = 'compound' | 'isolation'

export interface ExerciseDef {
  id: string
  name: string
  movement: MovementPattern
  type: ExerciseType
  primary: MuscleGroup[]
  secondary?: MuscleGroup[]
  notes?: string
}

export interface SetLog {
  reps: number
  weightKg: number
  rpe?: number // 1-10
  completed: boolean
}

export interface WorkoutExercise {
  exerciseId: string
  sets: SetLog[]
}

export interface WorkoutLog {
  id: string
  dateISO: string // YYYY-MM-DD
  exercises: WorkoutExercise[]
  notes?: string
}

export interface UserProfile {
  heightCm: number
  weightKg: number
  experience: ExperienceLevel
  goal: FitnessGoal
  daysPerWeek: 3 | 4 | 5 | 6
}

export interface SubscriptionInfo {
  status: SubscriptionStatus
  activatedAtISO?: string // YYYY-MM-DD
  expiresAtISO?: string // YYYY-MM-DD
}

export interface WorkoutAnalysis {
  totalSets: number
  totalReps: number
  tonnageKg: number
  pushSets: number
  pullSets: number
  legSets: number
  compoundSets: number
  isolationSets: number
  setsByMuscle: Record<MuscleGroup, number>
  missedMuscles: MuscleGroup[]
  warnings: string[]
  coachOutput: {
    didCorrectly: string[]
    missed: string[]
    imbalanceOrRisk: string[]
    recommendations: string[]
    nextDayAdvice: string[]
    weeklySummary: string[]
  }
}

export interface PlannedExercise {
  exerciseId: string
  name: string
  sets: number
  repsRange: [number, number]
  restSeconds: number
  intensityNote: string
  suggestedWeightKg?: number
}

export interface NextWorkoutPlan {
  title: string
  rationale: string[]
  exercises: PlannedExercise[]
  progressionNotes: string[]
}

