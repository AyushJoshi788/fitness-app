// src/components/Dashboard.tsx
// Main dashboard after authentication

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import { AnimatedCard } from './AnimatedCard';
import { ModernButton } from './ModernButton';
import { getRecentWorkouts } from '../firebase/firebaseWorkouts';
import type { WorkoutLog } from '../domain/types';
import { getWorkoutAnalysis } from '../firebase/firebaseWorkouts';

export const Dashboard = ({ onAddWorkout, onViewAudit }: { onAddWorkout: () => void; onViewAudit: (audit: any) => void }) => {
  const { user, userProfile } = useAuthContext();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const recent = await getRecentWorkouts(user.uid, 7);
        setWorkouts(recent);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  const handleViewAudit = async (workout: WorkoutLog) => {
    const analysis = await getWorkoutAnalysis(workout);
    onViewAudit(analysis);
  };

  return (
    <motion.div
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-header">
        <motion.div
          className="header-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Welcome back, {user?.displayName}! 💪</h1>
          <p className="header-subtitle">
            {userProfile?.experience} • {userProfile?.weightKg} kg • Height: {userProfile?.heightCm} cm
          </p>
        </motion.div>
      </div>

      <div className="dashboard-grid">
        {/* Quick Stats */}
        <AnimatedCard delay={0.1}>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <p className="stat-label">Workouts This Week</p>
              <h3 className="stat-value">{workouts.length}</h3>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <p className="stat-label">Total Exercises</p>
              <h3 className="stat-value">{workouts.reduce((sum, w) => sum + w.exercises.length, 0)}</h3>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <p className="stat-label">Experience</p>
              <h3 className="stat-value">
                {userProfile?.experience || 'beginner'}
              </h3>
            </div>
          </div>
        </AnimatedCard>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Workouts</h2>
          <ModernButton onClick={onAddWorkout} variant="primary" size="sm">
            + Add Workout
          </ModernButton>
        </div>

        {loading ? (
          <p className="loading-text">Loading workouts...</p>
        ) : workouts.length === 0 ? (
          <AnimatedCard>
            <div className="empty-state">
              <div className="empty-icon">🏋️</div>
              <h3>No workouts yet</h3>
              <p>Start by adding your first workout session</p>
              <ModernButton onClick={onAddWorkout} variant="primary">
                Add Your First Workout
              </ModernButton>
            </div>
          </AnimatedCard>
        ) : (
          <div className="workouts-list">
            {workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AnimatedCard>
                  <div className="workout-card">
                    <div className="workout-header">
                      <div>
                        <h3 className="workout-date">
                          {new Date(workout.dateISO).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </h3>
                        <p className="workout-type">Workout Session</p>
                      </div>
                      <div className="workout-exercises">
                        <span className="exercise-count">{workout.exercises.length} exercises</span>
                      </div>
                    </div>

                    <div className="workout-exercises-list">
                      {workout.exercises.slice(0, 3).map((ex: any, i: number) => (
                        <span key={i} className="exercise-tag">
                          {typeof ex === 'string' ? ex : ex.name}
                        </span>
                      ))}
                      {workout.exercises.length > 3 && (
                        <span className="exercise-tag more">+{workout.exercises.length - 3}</span>
                      )}
                    </div>

                    <ModernButton
                      onClick={() => handleViewAudit(workout)}
                      variant="secondary"
                      size="sm"
                      fullWidth
                    >
                      View AI Analysis
                    </ModernButton>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
