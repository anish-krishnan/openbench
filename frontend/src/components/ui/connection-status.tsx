/**
 * Connection status indicator component
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { useRealtimeConnection } from '@/hooks/realtime'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function ConnectionStatus() {
  const { isConnected, connectionError } = useRealtimeConnection()

  if (connectionError) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Connection Error
      </Badge>
    )
  }

  return (
    <Badge 
      variant={isConnected ? "default" : "secondary"} 
      className="flex items-center gap-1"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      )}
    </Badge>
  )
}
