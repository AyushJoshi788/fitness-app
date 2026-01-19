import { useMemo, useRef, useState } from 'react'
import type { SubscriptionInfo } from '../domain/types'
import { expireNow } from './subscription'
import { normalizeScannedText, verifyActivationToken } from './tokens'
import { BrowserMultiFormatReader } from '@zxing/browser'

type Props = {
  onActivate: (sub: SubscriptionInfo) => void
}

function getSecret() {
  // Demo secret. For real apps, do NOT ship secrets to clients.
  // Use a server to issue/verify tokens.
  return (import.meta as any).env?.VITE_PREMIUM_ACTIVATION_SECRET ?? 'demo_secret_change_me'
}

export function ActivationPanel({ onActivate }: Props) {
  const [tokenInput, setTokenInput] = useState('')
  const [message, setMessage] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const canScan = useMemo(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia), [])

  async function activateFromToken(raw: string) {
    setMessage('')
    const token = normalizeScannedText(raw)
    if (!token) return

    const secret = getSecret()
    const res = await verifyActivationToken(token, secret)
    if (!res.ok) {
      setMessage(res.reason)
      return
    }
    // token is valid -> activate
    onActivate({ status: 'premium_active', activatedAtISO: res.claims.issuedAtISO, expiresAtISO: res.claims.expiresAtISO })
    setMessage(`Premium activated until ${res.claims.expiresAtISO}.`)
  }

  async function startScan() {
    setMessage('')
    setScanning(true)
    const codeReader = new BrowserMultiFormatReader()
    try {
      const video = videoRef.current
      if (!video) throw new Error('Camera not ready.')
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      const deviceId = devices[0]?.deviceId
      if (!deviceId) throw new Error('No camera found.')

      const result = await codeReader.decodeOnceFromVideoDevice(deviceId, video)
      await activateFromToken(result.getText())
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to scan.'
      setMessage(msg)
    } finally {
      // Clean up camera stream for a safe, demo-friendly implementation.
      if (videoRef.current) BrowserMultiFormatReader.cleanVideoSource(videoRef.current)
      BrowserMultiFormatReader.releaseAllStreams()
      setScanning(false)
    }
  }

  return (
    <div className="panel">
      <div className="panelTitle">Premium activation</div>
      <div className="muted">After paying, scan your activation QR (or paste the activation token).</div>

      <div className="row">
        <label className="label">Activation token</label>
        <input className="input" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Paste token here" />
      </div>

      <div className="row">
        <button className="btn" onClick={() => activateFromToken(tokenInput)}>
          Activate
        </button>
        <button className="btnSecondary" onClick={() => onActivate(expireNow())} title="Demo: set to expired">
          Mark expired (demo)
        </button>
      </div>

      <div className="row">
        <button className="btnSecondary" disabled={!canScan || scanning} onClick={startScan}>
          {scanning ? 'Scanning…' : 'Scan activation QR'}
        </button>
        {!canScan ? <div className="muted">Camera scanning not available in this browser.</div> : null}
      </div>

      {scanning ? (
        <div className="cameraWrap">
          <video ref={videoRef} className="camera" />
        </div>
      ) : null}

      {message ? <div className="notice">{message}</div> : null}
    </div>
  )
}

