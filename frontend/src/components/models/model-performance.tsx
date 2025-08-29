/**
 * Model performance component
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner, Skeleton } from '@/components/ui/loading'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  Target, 
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import type { ModelPerformance as ModelPerformanceType } from '@/types/api'

interface ModelPerformanceProps {
  performance?: ModelPerformanceType
  modelId: string
  loading?: boolean
  detailed?: boolean
}

export function ModelPerformance({ performance, modelId, loading, detailed = false }: ModelPerformanceProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mock performance data
  const mockPerformance: ModelPerformanceType = {
    model_id: modelId,
    total_tests: 1247,
    passed_tests: 1172,
    failed_tests: 75,
    accuracy: 0.94,
    avg_latency: 2.3,
    avg_cost: 0.045,
    category_performance: {
      'Mathematics': { total: 156, passed: 142, accuracy: 0.91 },
      'Programming': { total: 243, passed: 231, accuracy: 0.95 },
      'Language': { total: 189, passed: 181, accuracy: 0.96 },
      'Reasoning': { total: 134, passed: 125, accuracy: 0.93 },
      'Science': { total: 98, passed: 89, accuracy: 0.91 },
      'Creative': { total: 76, passed: 74, accuracy: 0.97 }
    }
  }

  const displayPerformance = performance || mockPerformance

  const overallStats = [
    {
      icon: Target,
      label: 'Overall Accuracy',
      value: `${Math.round(displayPerformance.accuracy * 100)}%`,
      description: `${displayPerformance.passed_tests} of ${displayPerformance.total_tests} tests passed`,
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Average Latency',
      value: displayPerformance.avg_latency ? `${displayPerformance.avg_latency.toFixed(1)}s` : 'N/A',
      description: 'Mean response time',
      color: 'text-blue-600'
    },
    {
      icon: DollarSign,
      label: 'Average Cost',
      value: displayPerformance.avg_cost ? `$${displayPerformance.avg_cost.toFixed(3)}` : 'N/A',
      description: 'Per evaluation',
      color: 'text-orange-600'
    },
    {
      icon: AlertTriangle,
      label: 'Failure Rate',
      value: `${Math.round((displayPerformance.failed_tests / displayPerformance.total_tests) * 100)}%`,
      description: `${displayPerformance.failed_tests} failed tests`,
      color: 'text-red-600'
    }
  ]

  const categoryData = Object.entries(displayPerformance.category_performance).map(([category, stats]) => ({
    category,
    accuracy: stats.accuracy,
    total: stats.total,
    passed: stats.passed,
    failed: stats.total - stats.passed
  }))

  const pieData = categoryData.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    color: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'][index % 6]
  }))

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Aggregate performance metrics across all tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {overallStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-background ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {detailed && (
        <>
          {/* Category Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>
                Accuracy across different test categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Accuracy']}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Bar 
                      dataKey="accuracy" 
                      fill="hsl(var(--primary))" 
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Test Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Distribution</CardTitle>
                <CardDescription>
                  Number of tests by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Tests']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieData.map((category) => (
                    <div key={category.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                      <span className="font-medium">{category.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>
                  Detailed breakdown by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.category}</span>
                        <Badge variant="outline">
                          {Math.round(category.accuracy * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{category.passed}/{category.total} passed</span>
                        <span>{category.failed} failed</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${category.accuracy * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
