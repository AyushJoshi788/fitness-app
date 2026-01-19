// Demo-only token signing/verification for QR activation.
// Production: generate + verify tokens server-side and verify payments via a gateway.

export type ActivationClaims = {
  plan: 'premium'
  expiresAtISO: string // YYYY-MM-DD
  issuedAtISO: string // YYYY-MM-DD
  nonce: string
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  const b64 = btoa(binary)
  return b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlDecodeToBytes(input: string) {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((input.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function utf8Bytes(str: string) {
  return new TextEncoder().encode(str)
}

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    utf8Bytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, utf8Bytes(message))
  return new Uint8Array(sig)
}

export async function createActivationToken(claims: ActivationClaims, secret: string) {
  const payloadJson = JSON.stringify(claims)
  const payload = base64UrlEncodeBytes(utf8Bytes(payloadJson))
  const sigBytes = await hmacSha256(secret, payload)
  const sig = base64UrlEncodeBytes(sigBytes)
  return `${payload}.${sig}`
}

export async function verifyActivationToken(token: string, secret: string) {
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false as const, reason: 'Invalid token format.' }
  const [payload, sig] = parts
  const expected = base64UrlEncodeBytes(await hmacSha256(secret, payload))
  if (expected !== sig) return { ok: false as const, reason: 'Invalid signature.' }

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecodeToBytes(payload))
    const claims = JSON.parse(payloadJson) as ActivationClaims
    if (claims.plan !== 'premium') return { ok: false as const, reason: 'Unsupported plan.' }
    if (!claims.expiresAtISO) return { ok: false as const, reason: 'Missing expiry.' }
    return { ok: true as const, claims }
  } catch {
    return { ok: false as const, reason: 'Malformed payload.' }
  }
}

export function newNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return base64UrlEncodeBytes(bytes)
}

export function normalizeScannedText(raw: string) {
  const text = raw.trim()
  // Support app-style links: fitnessapp://activate?token=...
  try {
    if (text.startsWith('fitnessapp://')) {
      const url = new URL(text)
      const token = url.searchParams.get('token')
      return token ?? text
    }
  } catch {
    // ignore
  }
  return text
}

