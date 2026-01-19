import { useEffect, useMemo, useState } from 'react'
import { loadSubscription, saveSubscription } from '../domain/storage'
import type { SubscriptionInfo } from '../domain/types'
import { computeStatus, isPremiumActive } from './subscription'

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo>(() => loadSubscription())

  useEffect(() => {
    const normalized: SubscriptionInfo = { ...subscription, status: computeStatus(subscription) }
    saveSubscription(normalized)
    setSubscription((prev) =>
      prev.status === normalized.status && prev.expiresAtISO === normalized.expiresAtISO && prev.activatedAtISO === normalized.activatedAtISO ? prev : normalized,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription.status, subscription.expiresAtISO, subscription.activatedAtISO])

  const premiumActive = useMemo(() => isPremiumActive(subscription), [subscription])

  return { subscription, setSubscription, premiumActive }
}

