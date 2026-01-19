import './App.css'
import './styles/components.css'
import { useState } from 'react'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { AuthPanel } from './components/AuthPanel'
import { Dashboard } from './components/Dashboard'
import { AddWorkoutModal } from './components/AddWorkoutModal'
import { AuditDisplay } from './components/AuditDisplay'
import { logoutUser } from './firebase/firebaseAuth'
import type { WorkoutAnalysis } from './domain/types'
import { motion } from 'framer-motion'

// Loader component
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  }}>
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ fontSize: '48px' }}
    >
      🏋️
    </motion.div>
  </div>
)

// Main app content
function AppContent() {
  const { isAuthenticated, loading } = useAuthContext()
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState<WorkoutAnalysis | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <AuthPanel
        onAuthSuccess={() => {
          // Auth state will update automatically via AuthContext
        }}
      />
    )
  }

  return (
    <motion.div
      className="app-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <header className="app-header">
        <div className="app-header-content">
          <h1 className="app-logo">🏋️ AI Fitness Coach</h1>
          <button
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            ☰
          </button>
        </div>

        {showMenu && (
          <motion.div
            className="header-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              className="menu-item"
              onClick={async () => {
                await logoutUser()
                setShowMenu(false)
              }}
            >
              🚪 Logout
            </button>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Dashboard
          onAddWorkout={() => setShowAddWorkout(true)}
          onViewAudit={setSelectedAudit}
        />
      </main>

      {/* Modals */}
      {showAddWorkout && (
        <AddWorkoutModal
          onClose={() => setShowAddWorkout(false)}
          onSuccess={() => {
            setShowAddWorkout(false)
            // Dashboard will auto-refresh via Firebase listener
          }}
        />
      )}

      {selectedAudit && (
        <AuditDisplay
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}
    </motion.div>
  )
}

// Root App with providers
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
