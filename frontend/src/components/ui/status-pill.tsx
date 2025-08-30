/**
 * Status pill component for showing execution/test status
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'

export type StatusType = 'idle' | 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'pending' | 'approved' | 'rejected'

interface StatusPillProps {
  status: StatusType
  className?: string
  showIcon?: boolean
}

const statusConfig = {
  idle: {
    label: 'Idle',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800',
  },
  queued: {
    label: 'Queued',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800',
  },
  running: {
    label: 'Running',
    variant: 'secondary' as const,
    icon: Loader2,
    className: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900 animate-pulse',
  },
  passed: {
    label: 'Passed',
    variant: 'secondary' as const,
    icon: CheckCircle,
    className: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900',
  },
  failed: {
    label: 'Failed',
    variant: 'secondary' as const,
    icon: XCircle,
    className: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900',
  },
  error: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900',
  },
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900',
  },
  approved: {
    label: 'Approved',
    variant: 'secondary' as const,
    icon: CheckCircle,
    className: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900',
  },
  rejected: {
    label: 'Rejected',
    variant: 'secondary' as const,
    icon: XCircle,
    className: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900',
  },
}

export function StatusPill({ status, className, showIcon = true }: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.pending // Fallback to pending for unknown statuses
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          'h-3 w-3',
          status === 'running' && 'animate-spin'
        )} />
      )}
      {config.label}
    </Badge>
  )
}
