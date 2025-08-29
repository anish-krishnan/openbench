/**
 * Recent activity component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/loading'
import { 
  Activity, 
  ArrowRight,
  FileText,
  Play,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'test_created' | 'test_run' | 'test_approved'
  title: string
  user: string
  timestamp: string
  status?: 'passed' | 'failed' | 'running' | 'approved'
  testId?: string
}

export function RecentActivity() {
  // Mock recent activity data
  const mockActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'test_created',
      title: 'Logical Reasoning Challenge',
      user: 'researcher_jane',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'approved',
      testId: 'test-123'
    },
    {
      id: '2',
      type: 'test_run',
      title: 'Mathematical Reasoning',
      user: 'ai_evaluator',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      status: 'passed',
      testId: 'test-456'
    },
    {
      id: '3',
      type: 'test_approved',
      title: 'Code Generation & Debugging',
      user: 'admin_alex',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
      testId: 'test-789'
    },
    {
      id: '4',
      type: 'test_run',
      title: 'Creative Writing Assessment',
      user: 'model_tester',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: 'running',
      testId: 'test-101'
    },
    {
      id: '5',
      type: 'test_created',
      title: 'Scientific Reasoning',
      user: 'scientist_bob',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      testId: 'test-202'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'test_created': return FileText
      case 'test_run': return Play
      case 'test_approved': return Activity
      default: return Activity
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'test_created': return 'created test'
      case 'test_run': return 'ran test'
      case 'test_approved': return 'approved test'
      default: return 'activity'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/activity">
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivity.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          return (
            <div key={activity.id} className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    <Link 
                      href={`/users/${activity.user}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {activity.user}
                    </Link>
                    {' '}
                    {getActivityLabel(activity.type)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Link 
                    href={`/tests/${activity.testId}`}
                    className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                  >
                    {activity.title}
                  </Link>
                  {activity.status && (
                    <StatusPill 
                      status={activity.status} 
                      showIcon={false}
                      className="text-xs py-0 px-1.5 h-5"
                    />
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
          )
        })}

        <div className="pt-3 border-t">
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/tests/new">
              <FileText className="mr-2 h-4 w-4" />
              Contribute Test
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
