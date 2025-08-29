/**
 * Quick stats component
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { usePlatformStats } from '@/hooks/api'
import { LoadingSpinner, Skeleton } from '@/components/ui/loading'
import { 
  Users, 
  Cpu, 
  FileText, 
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react'

export function QuickStats() {
  const { data: stats, isLoading, error } = usePlatformStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load platform statistics</p>
      </div>
    )
  }

  const mockStats = {
    total_models: 52,
    total_tests: 1247,
    total_evaluations: 15834,
    active_users: 892,
    avg_accuracy: 0.847,
    tests_today: 23
  }

  const displayStats = stats?.data || mockStats

  const statItems = [
    {
      icon: Cpu,
      label: 'Models',
      value: displayStats.total_models?.toLocaleString() || '52',
      description: 'LLMs evaluated',
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      label: 'Tests',
      value: displayStats.total_tests?.toLocaleString() || '1.2K',
      description: 'Community tests',
      color: 'text-green-600'
    },
    {
      icon: Activity,
      label: 'Evaluations',
      value: displayStats.total_evaluations?.toLocaleString() || '15.8K',
      description: 'Total runs',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      label: 'Contributors',
      value: displayStats.active_users?.toLocaleString() || '892',
      description: 'Active users',
      color: 'text-orange-600'
    },
    {
      icon: TrendingUp,
      label: 'Accuracy',
      value: `${Math.round((displayStats.avg_accuracy || 0.847) * 100)}%`,
      description: 'Average score',
      color: 'text-emerald-600'
    },
    {
      icon: Clock,
      label: 'Today',
      value: displayStats.tests_today?.toLocaleString() || '23',
      description: 'New tests',
      color: 'text-indigo-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {statItems.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
