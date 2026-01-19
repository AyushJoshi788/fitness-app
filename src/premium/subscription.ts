import type { SubscriptionInfo, SubscriptionStatus } from '../domain/types'

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function computeStatus(sub: SubscriptionInfo): SubscriptionStatus {
  if (sub.status === 'premium_active') {
    if (!sub.expiresAtISO) return 'premium_active'
    return sub.expiresAtISO >= todayISO() ? 'premium_active' : 'premium_expired'
  }
  if (sub.status === 'premium_expired') return 'premium_expired'
  return 'free'
}

export function isPremiumActive(sub: SubscriptionInfo) {
  return computeStatus(sub) === 'premium_active'
}

export function activateForDays(days: number): SubscriptionInfo {
  const activatedAtISO = todayISO()
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { status: 'premium_active', activatedAtISO, expiresAtISO: expires }
}

export function expireNow(): SubscriptionInfo {
  return { status: 'premium_expired', expiresAtISO: todayISO() }
}

