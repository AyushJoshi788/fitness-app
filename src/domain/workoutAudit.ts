import type { ExperienceLevel, MuscleGroup, WorkoutExercise } from './types'
import { getExerciseById } from './exerciseCatalog'

export type WorkoutAuditResult = {
  good: string[]
  missing: string[]
  warnings: string[]
  suggestions: string[]
}

type WorkoutType = 'push' | 'pull' | 'legs' | 'full_body'

type AuditOptions = {
  experience?: ExperienceLevel
}

// "Ideal model" rules (used only for evaluation, not for generating a full plan)
const IDEAL = {
  minCompoundExercises: {
    push: 2,
    pull: 2,
    legs: 2,
    full_body: 3,
  },
  recommendedTotalSetsByExperience: {
    beginner: [8, 14] as const,
    intermediate: [12, 20] as const,
    advanced: [14, 24] as const,
  },
  // Minimum distinct exercises that *primarily* train each muscle group (session-based).
  // For splits (push/pull/legs) we only evaluate the "focus" muscles.
  minPrimaryExercisesPerMuscle: 1,
} as const

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest',
  front_delts: 'Front delts',
  side_delts: 'Side delts',
  rear_delts: 'Rear delts',
  triceps: 'Triceps',
  biceps: 'Biceps',
  lats: 'Lats',
  upper_back: 'Upper back',
  lower_back: 'Lower back',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Core/abs',
}

const SUGGESTIONS_BY_MUSCLE: Partial<Record<MuscleGroup, string[]>> = {
  lats: ['Add a vertical pull like Lat Pulldown or Pull-Ups (3×8–12).'],
  upper_back: ['Add a row variation like Chest-Supported Row or Seated Cable Row (3×8–12).'],
  rear_delts: ['Add Face Pulls or Reverse Pec Deck (2–3×12–20) to balance shoulder work.'],
  chest: ['Add a press pattern like Bench Press, Incline DB Press, or Push-Ups (3×6–12).'],
  triceps: ['If presses are already done, add Triceps Pushdowns (2–3×10–15).'],
  biceps: ['Add a curl variation (2–3×10–15) after your pulls.'],
  quads: ['Add a squat pattern like Back Squat or Leg Press (3×6–12).'],
  hamstrings: ['Add a hinge like RDL or a Leg Curl (3×8–12).'],
  glutes: ['Add Hip Thrusts or RDLs (3×8–12).'],
  calves: ['Add Calf Raises (2–4×8–15).'],
  abs: ['Add a simple core finisher like Planks/Dead Bugs (2–3 sets).'],
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function inferWorkoutType(exercises: WorkoutExercise[]) {
  let push = 0
  let pull = 0
  let legs = 0

  for (const ex of exercises) {
    const def = getExerciseById(ex.exerciseId)
    if (!def) continue
    const sets = ex.sets.filter((s) => s.completed).length || ex.sets.length

    if (def.movement === 'horizontal_push' || def.movement === 'vertical_push') push += sets
    if (def.movement === 'horizontal_pull' || def.movement === 'vertical_pull') pull += sets
    if (def.movement === 'squat' || def.movement === 'hinge') legs += sets
  }

  const total = push + pull + legs
  if (total <= 0) return 'full_body' as const

  const ratios = {
    push: push / total,
    pull: pull / total,
    legs: legs / total,
  } as const

  const best = (Object.keys(ratios) as Array<keyof typeof ratios>).reduce((a, b) => (ratios[a] > ratios[b] ? a : b))
  return ratios[best] >= 0.55 ? (best as WorkoutType) : ('full_body' as const)
}

function focusMusclesFor(type: WorkoutType): MuscleGroup[] {
  if (type === 'push') return ['chest', 'triceps', 'side_delts', 'front_delts']
  if (type === 'pull') return ['lats', 'upper_back', 'rear_delts', 'biceps']
  if (type === 'legs') return ['quads', 'hamstrings', 'glutes', 'calves']
  // Full body expectation (minimum coverage signals)
  return ['chest', 'upper_back', 'lats', 'quads', 'hamstrings', 'glutes', 'abs']
}

export function workoutAudit(exercises: WorkoutExercise[], options: AuditOptions = {}): WorkoutAuditResult {
  const good: string[] = []
  const missing: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  if (!exercises.length) {
    missing.push('No exercises logged yet. Add what you performed today to get feedback.')
    return { good, missing, warnings, suggestions }
  }

  const experience: ExperienceLevel = options.experience ?? 'beginner'
  const [minSets, maxSets] = IDEAL.recommendedTotalSetsByExperience[experience]

  const workoutType = inferWorkoutType(exercises)
  const focusMuscles = focusMusclesFor(workoutType)

  let totalSets = 0
  let compoundExercises = 0
  let compoundSets = 0
  let isolationSets = 0

  const primaryExerciseIdsByMuscle = new Map<MuscleGroup, Set<string>>()
  const setsByMuscle = new Map<MuscleGroup, number>()

  for (const ex of exercises) {
    const def = getExerciseById(ex.exerciseId)
    if (!def) {
      warnings.push('Some logged exercises were not recognized by the catalog. (They were skipped in analysis.)')
      continue
    }

    const sets = ex.sets.filter((s) => s.completed).length || ex.sets.length
    totalSets += sets

    if (def.type === 'compound') {
      compoundSets += sets
    } else {
      isolationSets += sets
    }

    // Count unique compound exercises (not sets)
    if (def.type === 'compound') {
      compoundExercises += 1
    }

    for (const m of def.primary) {
      if (!primaryExerciseIdsByMuscle.has(m)) primaryExerciseIdsByMuscle.set(m, new Set())
      primaryExerciseIdsByMuscle.get(m)!.add(def.id)
      setsByMuscle.set(m, (setsByMuscle.get(m) ?? 0) + sets)
    }
    for (const m of def.secondary ?? []) {
      // Secondary muscles get a smaller credit (simple heuristic for demo/viva)
      setsByMuscle.set(m, (setsByMuscle.get(m) ?? 0) + sets * 0.5)
    }
  }

  // --- What the user did correctly (high-level) ---
  const minCompound = IDEAL.minCompoundExercises[workoutType]
  if (compoundExercises >= minCompound) {
    good.push(`Good job prioritizing compounds: you hit at least ${minCompound} big movement(s) for a solid stimulus.`)
  } else {
    warnings.push(`This session is light on compounds. Aim for at least ${minCompound} compound exercise(s) for better progress.`)
    suggestions.push('Swap 1–2 isolation movements for a compound (press/row/pulldown/squat/hinge depending on your day).')
  }

  // Volume check (session level)
  if (totalSets < minSets) {
    missing.push(`Overall volume is low for a ${experience} session (${totalSets} sets).`)
    suggestions.push(`Add ~${clamp(minSets - totalSets, 2, 6)} more quality set(s) (keep form strict, stop 1–3 reps before failure).`)
  } else if (totalSets > maxSets) {
    warnings.push(`Overall volume is high for a ${experience} session (${totalSets} sets).`)
    suggestions.push('Consider trimming 2–6 sets to reduce fatigue and improve recovery quality.')
  } else {
    good.push(`Training volume looks reasonable (${totalSets} total sets) for a ${experience} session.`)
  }

  // Compound vs isolation balance (simple)
  const compoundRatio = totalSets > 0 ? compoundSets / totalSets : 0
  if (compoundRatio < 0.5) {
    warnings.push('Too much isolation compared to compounds. This can slow progress and waste time.')
    suggestions.push('Make compounds the “core” of the workout, then add 1–2 isolation finishers.')
  } else {
    good.push('Good compound-to-isolation balance: most of your work is coming from effective movements.')
  }

  // Muscle coverage / minimum exercises per focus muscle
  for (const m of focusMuscles) {
    const count = primaryExerciseIdsByMuscle.get(m)?.size ?? 0
    if (count < IDEAL.minPrimaryExercisesPerMuscle) {
      missing.push(`Missing direct work for ${MUSCLE_LABEL[m]} (no primary exercise logged).`)
      for (const tip of SUGGESTIONS_BY_MUSCLE[m] ?? []) suggestions.push(tip)
    }
  }

  // Basic fatigue / overuse flags (single-session heuristics)
  for (const [m, setCount] of setsByMuscle.entries()) {
    if (setCount >= 14) {
      warnings.push(`${MUSCLE_LABEL[m]} got very high volume (~${Math.round(setCount)} “effective” sets). Overuse risk goes up if you repeat this soon.`)
      suggestions.push('If soreness or performance drops next session, reduce load 5–10% or cut a few sets for that area.')
    }
  }

  // Shoulder health reminder if push-heavy workouts lack pulling/rear delt work
  if (workoutType === 'push') {
    const rear = primaryExerciseIdsByMuscle.get('rear_delts')?.size ?? 0
    const upperBack = primaryExerciseIdsByMuscle.get('upper_back')?.size ?? 0
    if (rear + upperBack === 0) {
      warnings.push('Push day with no upper-back/rear-delt work can irritate shoulders over time.')
      suggestions.push('Add 2–3 sets of Face Pulls or a light row to keep shoulders balanced.')
    }
  }

  // Small positive “coverage” reinforcement
  const covered = focusMuscles.filter((m) => (primaryExerciseIdsByMuscle.get(m)?.size ?? 0) >= 1)
  if (covered.length >= Math.max(2, Math.floor(focusMuscles.length * 0.6))) {
    good.push('You covered most of the key muscles for today’s workout focus.')
  }

  return { good, missing, warnings, suggestions }
}

