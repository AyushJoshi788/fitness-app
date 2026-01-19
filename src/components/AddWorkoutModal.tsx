// src/components/AddWorkoutModal.tsx
// Add new workout session with exercises

import type { SyntheticEvent } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ModernButton } from './ModernButton';
import { useAuthContext } from '../contexts/AuthContext';
import { saveWorkout } from '../firebase/firebaseWorkouts';
import { EXERCISES } from '../domain/exerciseCatalog';
import type { WorkoutLog, WorkoutExercise } from '../domain/types';

interface AddWorkoutModalProps {
  onClose: () => void;
  onSuccess: (workout: WorkoutLog) => void;
}

export const AddWorkoutModal = ({ onClose, onSuccess }: AddWorkoutModalProps) => {
  const { user } = useAuthContext();
  const [workoutType, setWorkoutType] = useState('general');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(EXERCISES.map((ex) => ex.movement)));

  const filteredExercises = selectedCategory
    ? EXERCISES.filter((ex) => ex.movement === selectedCategory)
    : EXERCISES;

  const handleSelectExercise = (exercise: typeof EXERCISES[0]) => {
    const isSelected = selectedExercises.some((ex) => ex.exerciseId === exercise.id);
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter((ex) => ex.exerciseId !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, { exerciseId: exercise.id, sets: [] }]);
    }
  };

  const handleSaveWorkout = async () => {
    if (!user || selectedExercises.length === 0) return;

    setLoading(true);
    try {
      const workout: WorkoutLog = {
        id: Date.now().toString(),
        dateISO: new Date().toISOString().split('T')[0],
        exercises: selectedExercises,
      };

      await saveWorkout(user.uid, workout);
      onSuccess(workout);
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        onClick={(e: SyntheticEvent) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add New Workout</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <label className="section-label">Workout Type</label>
            <div className="workout-type-grid">
              {['general', 'cardio', 'strength', 'flexibility', 'sports'].map((type) => (
                <motion.button
                  key={type}
                  className={`type-button ${workoutType === type ? 'active' : ''}`}
                  onClick={() => setWorkoutType(type)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="section-label">Select Exercises</label>
            <div className="category-tabs">
              <motion.button
                className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
                whileHover={{ scale: 1.05 }}
              >
                All ({EXERCISES.length})
              </motion.button>
              {categories.map((category) => (
                <motion.button
                  key={category}
                  className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category as string)}
                  whileHover={{ scale: 1.05 }}
                >
                  {category} ({EXERCISES.filter((ex) => ex.movement === category).length})
                </motion.button>
              ))}
            </div>

            <div className="exercises-grid">
              {filteredExercises.map((exercise, index: number) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <label className="exercise-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedExercises.some((ex) => ex.exerciseId === exercise.id)}
                      onChange={() => handleSelectExercise(exercise)}
                    />
                    <span className="checkbox-label">
                      <span className="exercise-name">{exercise.name}</span>
                      <span className="exercise-meta">
                        {exercise.type} • {exercise.movement}
                      </span>
                    </span>
                  </label>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedExercises.length > 0 && (
            <motion.div
              className="selected-summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Selected Exercises ({selectedExercises.length})</h3>
              <div className="selected-list">
                {selectedExercises.map((ex, i) => {
                  const exercise = EXERCISES.find((e) => e.id === ex.exerciseId);
                  return (
                    <span key={i} className="selected-tag">
                      {exercise?.name}
                      <button
                        className="remove-tag"
                        onClick={() => setSelectedExercises(selectedExercises.filter((_, idx) => idx !== i))}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        <div className="modal-footer">
          <ModernButton onClick={onClose} variant="outline">
            Cancel
          </ModernButton>
          <ModernButton
            onClick={handleSaveWorkout}
            variant="primary"
            loading={loading}
            disabled={selectedExercises.length === 0}
          >
            Save Workout
          </ModernButton>
        </div>
      </motion.div>
    </motion.div>
  );
};
