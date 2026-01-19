import { useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { createActivationToken, newNonce } from './tokens'

function getSecret() {
  return (import.meta as any).env?.VITE_PREMIUM_ACTIVATION_SECRET ?? 'demo_secret_change_me'
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function AdminGenerator() {
  const [days, setDays] = useState(30)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const activationLink = useMemo(() => {
    if (!token) return ''
    const url = new URL('fitnessapp://activate')
    url.searchParams.set('token', token)
    return url.toString()
  }, [token])

  return (
    <div className="panel">
      <div className="panelTitle">Admin (demo): generate activation QR</div>
      <div className="muted">
        This is a demo-only issuer. Production apps must generate activation tokens on a server after verifying payment.
      </div>

      <div className="row">
        <label className="label">Duration (days)</label>
        <input
          className="input"
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
        <button
          className="btn"
          onClick={async () => {
            setError('')
            try {
              const secret = getSecret()
              const claims = { plan: 'premium' as const, expiresAtISO: addDaysISO(days), issuedAtISO: todayISO(), nonce: newNonce() }
              const t = await createActivationToken(claims, secret)
              setToken(t)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to generate token.')
            }
          }}
        >
          Generate
        </button>
      </div>

      {token ? (
        <>
          <div className="row">
            <label className="label">Activation link (QR encodes this)</label>
            <input className="input" value={activationLink} readOnly />
          </div>
          <div className="qrWrap">
            <div className="qrGenerated">
              <QRCodeCanvas value={activationLink} size={220} />
            </div>
          </div>
          <div className="row">
            <label className="label">Raw token (copy/paste)</label>
            <textarea className="textarea" value={token} readOnly rows={3} />
          </div>
        </>
      ) : null}

      {error ? <div className="notice">{error}</div> : null}
    </div>
  )
}

