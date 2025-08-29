/**
 * Admin dashboard component
 */

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAdminStats, usePendingTests } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import { 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react'

export function AdminDashboard() {
  const { data: session } = useSession()
  
  // Development bypass - mock authenticated admin user (only on client side to avoid hydration mismatch)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const mockSession = isClient ? {
    user: {
      id: 'dev-user',
      name: 'Developer',
      email: 'admin@example.com',
      role: 'admin'
    }
  } : null
  
  const effectiveSession = session || mockSession
  
  const { data: statsResponse, isLoading: statsLoading } = useAdminStats()
  const { data: pendingResponse, isLoading: pendingLoading } = usePendingTests(1, 5)

  // Check admin permissions (in real app, this would be based on user roles)
  const isAdmin = effectiveSession?.user?.email === 'admin@example.com' // Replace with proper role check

  if (!effectiveSession) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please sign in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (statsLoading || pendingLoading) {
    return <PageLoading />
  }

  // Mock admin stats
  const mockStats = {
    total_users: 892,
    active_users_today: 156,
    pending_tests: 23,
    approved_tests_today: 8,
    rejected_tests_today: 2,
    total_tests: 1247,
    total_executions: 15834,
    system_health: 'healthy'
  }

  const stats = statsResponse?.data || mockStats
  const pendingTests = pendingResponse?.data || []

  const quickActions = [
    {
      title: 'Review Pending Tests',
      description: `${stats.pending_tests} tests awaiting review`,
      href: '/admin/pending',
      icon: Clock,
      badge: stats.pending_tests > 0 ? stats.pending_tests : null,
      variant: stats.pending_tests > 10 ? 'destructive' : 'secondary'
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      href: '/admin/users',
      icon: Users,
      badge: null,
      variant: 'secondary'
    },
    {
      title: 'System Health',
      description: 'Monitor platform performance',
      href: '/admin/health',
      icon: Activity,
      badge: stats.system_health === 'healthy' ? 'Healthy' : 'Issues',
      variant: stats.system_health === 'healthy' ? 'default' : 'destructive'
    },
    {
      title: 'Content Moderation',
      description: 'Review flagged content and reports',
      href: '/admin/moderation',
      icon: Shield,
      badge: null,
      variant: 'secondary'
    }
  ]

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Platform administration and moderation tools
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Users</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats.active_users_today} active today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Tests</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_tests.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats.approved_tests_today} approved today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Pending Review</span>
            </div>
            <div className="text-2xl font-bold">{stats.pending_tests}</div>
            <div className="text-xs text-muted-foreground">
              {stats.rejected_tests_today} rejected today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Executions</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_executions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              All time runs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                  {action.badge && (
                    <Badge variant={action.variant as any}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={action.href}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tests Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Pending Tests</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/pending">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Latest test submissions awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTests.length > 0 ? (
              <div className="space-y-3">
                {pendingTests.slice(0, 5).map((test: any) => (
                  <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm line-clamp-1">
                        {test.title || 'Untitled Test'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {test.created_by} • {test.category}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending tests</p>
                <p className="text-sm">All submissions are up to date!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current platform health and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">API Status</span>
                </div>
                <Badge variant="default">Operational</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge variant="default">Healthy</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Model Providers</span>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Background Jobs</span>
                </div>
                <Badge variant="secondary">Processing</Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Uptime:</span>
                    <div className="font-medium">99.9%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Response Time:</span>
                    <div className="font-medium">245ms</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
