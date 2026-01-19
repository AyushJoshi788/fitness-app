// src/components/AuditDisplay.tsx
// Display AI workout audit with animated findings

import type { SyntheticEvent } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from './AnimatedCard';
import type { WorkoutAnalysis } from '../domain/types';

interface AuditDisplayProps {
  audit: WorkoutAnalysis;
  onClose: () => void;
}

export const AuditDisplay = ({ audit, onClose }: AuditDisplayProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Calculate score based on warnings
  const score = Math.max(50, 100 - audit.warnings.length * 10);
  const scoreColor = score > 80 ? '#10b981' : score > 60 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      className="audit-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="audit-modal"
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e: SyntheticEvent) => e.stopPropagation()}
      >
        <div className="audit-header">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="audit-title">🤖 AI Workout Analysis</h2>
            <p className="audit-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </motion.div>
          <button className="audit-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <motion.div
          className="audit-findings"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Workout Summary Card */}
          <motion.div variants={item}>
            <AnimatedCard delay={0}>
              <div className="finding-card" style={{ borderLeftColor: scoreColor }}>
                <div className="finding-header">
                  <span className="finding-icon">📊</span>
                  <h3 className="finding-rule">Workout Summary</h3>
                </div>
                <div className="workout-stats">
                  <div className="stat">
                    <span className="stat-label">Total Sets:</span>
                    <span className="stat-value">{audit.totalSets}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Reps:</span>
                    <span className="stat-value">{audit.totalReps}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Tonnage:</span>
                    <span className="stat-value">{audit.tonnageKg}kg</span>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Warnings */}
          {audit.warnings.length > 0 && (
            <>
              {audit.warnings.map((warning: string, index: number) => (
                <motion.div key={`warning-${index}`} variants={item}>
                  <AnimatedCard delay={(index + 1) * 0.05}>
                    <div className="finding-card" style={{ borderLeftColor: '#f59e0b' }}>
                      <div className="finding-header">
                        <span className="finding-icon">⚠️</span>
                        <h3 className="finding-rule">Warning</h3>
                      </div>
                      <p className="finding-message">{warning}</p>
                    </div>
                  </AnimatedCard>
                </motion.div>
              ))}
            </>
          )}

          {/* Coach Output */}
          {audit.coachOutput.recommendations.length > 0 && (
            <>
              {audit.coachOutput.recommendations.map((rec: string, index: number) => (
                <motion.div key={`rec-${index}`} variants={item}>
                  <AnimatedCard delay={(audit.warnings.length + index + 2) * 0.05}>
                    <div className="finding-card" style={{ borderLeftColor: '#10b981' }}>
                      <div className="finding-header">
                        <span className="finding-icon">💡</span>
                        <h3 className="finding-rule">Recommendation</h3>
                      </div>
                      <p className="finding-message">{rec}</p>
                    </div>
                  </AnimatedCard>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>

        <div className="audit-footer">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="audit-score"
          >
            <div className="score-display">
              <span className="score-label">Workout Score</span>
              <span className="score-value">{score}/100</span>
            </div>
            <div className="score-bar">
              <motion.div
                className="score-fill"
                style={{ backgroundColor: scoreColor }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </div>

        <div className="audit-actions">
          <button className="audit-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
