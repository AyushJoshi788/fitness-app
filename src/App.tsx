import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { useSubscription } from './premium/useSubscription'
import { PaymentPanel } from './premium/PaymentPanel'
import { ActivationPanel } from './premium/ActivationPanel'
import { AdminGenerator } from './premium/AdminGenerator'
import { EXERCISES } from './domain/exerciseCatalog'
import { loadProfile, saveProfile } from './domain/storage'
import type { SetLog, WorkoutExercise } from './domain/types'
import { workoutAudit, type WorkoutAuditResult } from './domain/workoutAudit'

const KEY_TODAY_LOG = 'fitnessAI.todayWorkout.v1'

function safeParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

function makeSets(count: number, reps: number, weightKg: number): SetLog[] {
  const sets: SetLog[] = []
  for (let i = 0; i < count; i++) sets.push({ reps, weightKg, completed: true })
  return sets
}

function App() {
  const { subscription, setSubscription, premiumActive } = useSubscription()
  const [profile, setProfile] = useState(() => loadProfile())
  const [loggedExercises, setLoggedExercises] = useState<WorkoutExercise[]>(
    () => safeParse<WorkoutExercise[]>(localStorage.getItem(KEY_TODAY_LOG)) ?? [],
  )
  const [auditResult, setAuditResult] = useState<WorkoutAuditResult | null>(null)

  const sortedExercises = useMemo(() => [...EXERCISES].sort((a, b) => a.name.localeCompare(b.name)), [])
  const [selectedExerciseId, setSelectedExerciseId] = useState(sortedExercises[0]?.id ?? '')
  const [setCount, setSetCount] = useState(3)
  const [reps, setReps] = useState(10)
  const [weightKg, setWeightKg] = useState(0)

  // Persist demo profile + today's workout in localStorage (no backend for the college demo).
  useEffect(() => {
    saveProfile(profile)
  }, [profile])

  useEffect(() => {
    localStorage.setItem(KEY_TODAY_LOG, JSON.stringify(loggedExercises))
  }, [loggedExercises])

  // Premium-gated audit engine: only runs for active premium.
  useEffect(() => {
    if (!premiumActive) {
      setAuditResult(null)
      return
    }
    const res = workoutAudit(loggedExercises, { experience: profile.experience })
    setAuditResult(res)
    // For demo purposes (optional), also log to console.
    // eslint-disable-next-line no-console
    console.log('Workout audit', res)
  }, [premiumActive, loggedExercises, profile.experience])

  return (
    <div>
      <div className="appHeader">
        <div className="appTitle">AI Fitness Coach</div>
        <div className="badge">
          Status: <b>{premiumActive ? 'Premium Active' : subscription.status}</b>
          {subscription.activatedAtISO ? <span className="muted">· activated {subscription.activatedAtISO}</span> : null}
          {subscription.expiresAtISO ? <span className="muted">· expires {subscription.expiresAtISO}</span> : null}
        </div>
      </div>

      <div className="grid">
        <PaymentPanel amountInr={199} />
        <ActivationPanel onActivate={(sub) => setSubscription(sub)} />

        <div className="panel">
          <div className="panelTitle">Your profile (demo)</div>
          <div className="muted">Used only to tune “ideal” volume ranges for the audit.</div>
          <div className="row">
            <label className="label">Experience level</label>
            <select
              className="input"
              value={profile.experience}
              onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value as typeof p.experience }))}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">Today’s workout log</div>
          <div className="muted">Select exercises you did today. Keep it simple for the demo.</div>

          <div className="row">
            <label className="label">Exercise</label>
            <select className="input" value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)}>
              {sortedExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          <div className="row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'end' }}>
            <div>
              <label className="label">Sets</label>
              <input className="input" type="number" min={1} max={20} value={setCount} onChange={(e) => setSetCount(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Reps</label>
              <input className="input" type="number" min={1} max={50} value={reps} onChange={(e) => setReps(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" min={0} max={500} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
            </div>
          </div>

          <div className="row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button
              className="btn"
              onClick={() => {
                const nextSets = makeSets(setCount, reps, weightKg)
                setLoggedExercises((prev) => {
                  const existing = prev.find((p) => p.exerciseId === selectedExerciseId)
                  if (!existing) return [...prev, { exerciseId: selectedExerciseId, sets: nextSets }]
                  return prev.map((p) => (p.exerciseId === selectedExerciseId ? { ...p, sets: [...p.sets, ...nextSets] } : p))
                })
              }}
            >
              Add to workout
            </button>
            <button className="btnSecondary" onClick={() => setLoggedExercises([])}>
              Clear
            </button>
          </div>

          {loggedExercises.length ? (
            <div className="notice">
              Logged exercises: <b>{loggedExercises.length}</b>
            </div>
          ) : (
            <div className="notice">Nothing logged yet.</div>
          )}
        </div>

        <div className="panel">
          <div className="panelTitle">Workout audit (premium)</div>

          {!premiumActive ? (
            <div className="notice">
              Premium is required to run the workout audit. Pay via QR, then activate premium using the activation QR/token.
              {subscription.status === 'premium_expired' ? <div className="muted" style={{ marginTop: 6 }}>Your premium has expired. Renew to re-enable audit.</div> : null}
            </div>
          ) : auditResult ? (
            <>
              <div className="notice">
                <b>Corrective feedback</b> (rule-based, explainable)
              </div>

              {auditResult.good.length ? (
                <div className="row">
                  <div className="label">What you did correctly</div>
                  <ul>
                    {auditResult.good.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {auditResult.missing.length ? (
                <div className="row">
                  <div className="label">What’s missing</div>
                  <ul>
                    {auditResult.missing.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {auditResult.warnings.length ? (
                <div className="row">
                  <div className="label">Warnings / imbalance risks</div>
                  <ul>
                    {auditResult.warnings.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {auditResult.suggestions.length ? (
                <div className="row">
                  <div className="label">Clear suggestions</div>
                  <ul>
                    {auditResult.suggestions.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className="notice">Log your workout above to generate feedback.</div>
          )}
        </div>
        <AdminGenerator />
      </div>
    </div>
  )
}

export default App
