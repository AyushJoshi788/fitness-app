// src/domain/improvedWorkoutAudit.ts
// Rule-Based AI Workout Audit System - MVP for Fitness Startup

import type { WorkoutLog, WorkoutExercise, SetLog } from './types';

export interface AuditResult {
  formQuality: {
    score: number; // 0-100
    issues: string[];
  };
  progressiveOverload: {
    status: 'excellent' | 'good' | 'stagnant' | 'excessive';
    analysis: string;
  };
  injuryRisks: {
    flags: string[];
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  weeklyReview: {
    totalWorkouts: number;
    totalVolume: number;
    muscleGroupsHit: string[];
    restDaysNeeded: number;
    recommendation: string;
  };
  recoveryAnalysis: {
    restBetweenSessions: number; // days
    sameMuscleDays: number;
    recoveryScore: number; // 0-100
    warning?: string;
  };
}

// ============ RULE 1: FORM QUALITY CHECK ============
export const evaluateFormQuality = (workout: WorkoutLog): AuditResult['formQuality'] => {
  const issues: string[] = [];
  let score = 100;

  // Simplified check - actual form data not in current model
  if (workout.exercises.length === 0) {
    issues.push('No exercises logged');
    score = 50;
  } else if (workout.exercises.length > 8) {
    issues.push('Too many exercises - reduce to 5-8 for quality');
    score -= 15;
  }

  return {
    score: Math.max(0, score),
    issues,
  };
};

// ============ RULE 2: PROGRESSIVE OVERLOAD ============
export const evaluateProgressiveOverload = (
  currentWorkout: WorkoutLog,
  previousWorkouts: WorkoutLog[]
): AuditResult['progressiveOverload'] => {
  
  if (previousWorkouts.length === 0) {
    return {
      status: 'good',
      analysis: 'First workout logged. Keep tracking to build baseline.',
    };
  }

  // Find same exercises from previous workouts
  const sameExercises = currentWorkout.exercises.filter(
    (ex: WorkoutExercise) =>
      previousWorkouts.some((pw: WorkoutLog) =>
        pw.exercises.some((pex: WorkoutExercise) => pex.exerciseId === ex.exerciseId)
      )
  );

  let improved = 0;
  let stagnant = 0;
  let details: string[] = [];

  sameExercises.forEach((currentEx: WorkoutExercise) => {
    const previousEx = previousWorkouts
      .flatMap((w: WorkoutLog) => w.exercises)
      .filter((ex: WorkoutExercise) => ex.exerciseId === currentEx.exerciseId)
      .pop();

    if (!previousEx) return;

    const totalVolume = currentEx.sets.reduce((sum: number, set: SetLog) => sum + (set.reps * set.weightKg), 0);
    const prevVolume = previousEx.sets.reduce((sum: number, set: SetLog) => sum + (set.reps * set.weightKg), 0);
    const volumeImproved = totalVolume > prevVolume;

    if (volumeImproved) {
      improved++;
      details.push(`✓ Exercise ${currentEx.exerciseId}: Progressive increase`);
    } else {
      stagnant++;
      details.push(`⚠ Exercise ${currentEx.exerciseId}: Same volume for ${previousWorkouts.length} sessions`);
    }
  });

  if (stagnant > improved * 2) {
    return {
      status: 'stagnant',
      analysis: `${details.join(', ')}. Increase weight by 5% or reps by 2-3 to break plateau.`,
    };
  }

  if (improved > stagnant * 2) {
    return {
      status: 'excellent',
      analysis: `Great progression! ${details.join(', ')}.`,
    };
  }

  return {
    status: 'good',
    analysis: details.join(', '),
  };
};

// ============ RULE 3: INJURY PREVENTION ============
export const evaluateInjuryRisks = (
  workoutHistory: WorkoutLog[]
): AuditResult['injuryRisks'] => {
  
  const flags: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  const recommendations: string[] = [];

  if (workoutHistory.length === 0) {
    return { flags: [], severity: 'low', recommendations: [] };
  }

  // Flag 1: Overtraining (>5 days per week)
  const workoutsThisWeek = workoutHistory.filter(
    (w: WorkoutLog) => new Date(w.dateISO).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  if (workoutsThisWeek > 5) {
    flags.push('⚠ Overtraining detected: >5 workouts this week');
    recommendations.push('Take 1-2 complete rest days');
    severity = 'medium';
  }

  // Flag 2: Frequent workouts without proper recovery
  const last7Days = workoutHistory.slice(0, 7);
  const daysSinceLastWorkout: { [key: string]: number } = {};

  last7Days.forEach((w: WorkoutLog) => {
    const date = new Date(w.dateISO).toDateString();
    daysSinceLastWorkout[date] = (daysSinceLastWorkout[date] || 0) + 1;
  });

  Object.entries(daysSinceLastWorkout).forEach(([date, count]) => {
    if (count > 1) {
      flags.push(`⚠ Multiple workouts on ${date}`);
      recommendations.push('Allow at least 24 hours between sessions');
      severity = 'medium';
    }
  });

  // Flag 3: High frequency without documented recovery
  if (workoutsThisWeek > 5) {
    flags.push('⚠ Very high frequency without recovery days');
    recommendations.push('Add 1-2 dedicated recovery/rest days');
    severity = 'high';
  }

  return { flags, severity, recommendations };
};

// ============ RULE 4: WEEKLY REVIEW ============
export const generateWeeklyReview = (
  weeklyWorkouts: WorkoutLog[]
): AuditResult['weeklyReview'] => {
  
  const muscleGroupsHit = new Set<string>();
  let totalVolume = 0; // weight * reps * sets

  weeklyWorkouts.forEach((w: WorkoutLog) => {
    w.exercises.forEach((ex: WorkoutExercise) => {
      totalVolume += ex.sets.reduce((sum: number, set: SetLog) => sum + (set.reps * set.weightKg), 0);
    });
  });

  const muscleList = Array.from(muscleGroupsHit);
  const restDaysNeeded = Math.max(1, 7 - weeklyWorkouts.length);

  let recommendation = '';

  if (weeklyWorkouts.length === 0) {
    recommendation = 'No workouts logged this week. Start with 3-4 sessions.';
  } else if (weeklyWorkouts.length < 3) {
    recommendation = 'Increase frequency to 3-4 workouts for better results.';
  } else if (weeklyWorkouts.length > 5) {
    recommendation = 'Consider reducing frequency to 4-5 for better recovery.';
  } else if (muscleList.length < 4) {
    recommendation = 'Add variety - hit 4-6 muscle groups per week.';
  } else {
    recommendation = `Great week! Hit ${muscleList.length} muscle groups. Take ${restDaysNeeded} rest days for recovery.`;
  }

  return {
    totalWorkouts: weeklyWorkouts.length,
    totalVolume: Math.round(totalVolume),
    muscleGroupsHit: muscleList,
    restDaysNeeded,
    recommendation,
  };
};

// ============ RULE 5: RECOVERY ANALYSIS ============
export const analyzeRecovery = (
  workoutHistory: WorkoutLog[]
): AuditResult['recoveryAnalysis'] => {
  
  if (workoutHistory.length < 2) {
    return {
      restBetweenSessions: 0,
      sameMuscleDays: 0,
      recoveryScore: 100,
    };
  }

  // Calculate average rest between sessions
  const sortedWorkouts = workoutHistory.sort(
    (a: WorkoutLog, b: WorkoutLog) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );

  const intervals: number[] = [];
  for (let i = 0; i < sortedWorkouts.length - 1; i++) {
    const diff = Math.abs(
      (new Date(sortedWorkouts[i].dateISO).getTime() -
        new Date(sortedWorkouts[i + 1].dateISO).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    intervals.push(diff);
  }

  const avgRestDays = intervals.length > 0 ? intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length : 0;

  // Calculate same muscle group training frequency
  const last14Days = sortedWorkouts.slice(0, 14);
  const muscleFreq: { [key: string]: number } = {};

  last14Days.forEach((w: WorkoutLog) => {
    w.exercises.forEach(() => {
      // Note: target muscles not tracked in current model
      muscleFreq['general'] = (muscleFreq['general'] || 0) + 1;
    });
  });

  const sameMuscleDays = Object.values(muscleFreq).reduce((sum: number, freq: number) => sum + freq, 0) / Object.keys(muscleFreq).length || 0;

  // Recovery score: 100 = perfect, 0 = poor
  let recoveryScore = 100;

  if (avgRestDays < 0.5) recoveryScore = 40; // No rest
  else if (avgRestDays < 1) recoveryScore = 60; // Insufficient rest
  else if (avgRestDays > 3) recoveryScore = 80; // Ideal recovery
  else if (avgRestDays > 5) recoveryScore = 60; // Too much rest

  if (sameMuscleDays > 3) recoveryScore -= 20; // Muscle groups hit too often

  const warning = recoveryScore < 60
    ? 'Poor recovery detected. Increase rest days or reduce intensity.'
    : recoveryScore > 85
    ? 'Excellent recovery patterns!'
    : 'Recovery is adequate.';

  return {
    restBetweenSessions: Math.round(avgRestDays * 10) / 10,
    sameMuscleDays: Math.round(sameMuscleDays * 10) / 10,
    recoveryScore: Math.max(0, recoveryScore),
    warning,
  };
};

// ============ MAIN AUDIT FUNCTION ============
export const performCompleteAudit = (
  currentWorkout: WorkoutLog,
  weeklyWorkouts: WorkoutLog[],
  monthlyHistory: WorkoutLog[]
): AuditResult => {
  return {
    formQuality: evaluateFormQuality(currentWorkout),
    progressiveOverload: evaluateProgressiveOverload(currentWorkout, monthlyHistory),
    injuryRisks: evaluateInjuryRisks(monthlyHistory),
    weeklyReview: generateWeeklyReview(weeklyWorkouts),
    recoveryAnalysis: analyzeRecovery(monthlyHistory),
  };
};
