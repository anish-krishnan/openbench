/**
 * Realtime provider component
 */

'use client'

import { useJobStatusUpdates, useTestModerationUpdates, useModelStatusUpdates } from '@/hooks/realtime'

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Set up global realtime subscriptions
  useJobStatusUpdates()
  useTestModerationUpdates() 
  useModelStatusUpdates()

  return <>{children}</>
}
