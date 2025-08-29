/**
 * Leaderboard charts component
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTrends } from '@/hooks/api'
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
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react'
import type { LeaderboardData, LeaderboardFilters } from '@/types/api'

interface LeaderboardChartsProps {
  data?: LeaderboardData
  metric: 'accuracy' | 'latency' | 'cost'
  filters: LeaderboardFilters
}

export function LeaderboardCharts({ data, metric, filters }: LeaderboardChartsProps) {
  const { data: trendsResponse } = useTrends(
    metric,
    filters.timeframe,
    filters.category
  )

  // Mock chart data
  const mockTrendData = [
    { date: '2024-01-01', 'GPT-4 Turbo': 0.92, 'Claude 3 Opus': 0.89, 'Gemini Pro': 0.85 },
    { date: '2024-01-08', 'GPT-4 Turbo': 0.93, 'Claude 3 Opus': 0.90, 'Gemini Pro': 0.86 },
    { date: '2024-01-15', 'GPT-4 Turbo': 0.94, 'Claude 3 Opus': 0.91, 'Gemini Pro': 0.87 },
    { date: '2024-01-22', 'GPT-4 Turbo': 0.94, 'Claude 3 Opus': 0.92, 'Gemini Pro': 0.89 },
  ]

  const mockProviderData = [
    { name: 'OpenAI', value: 35, color: '#10B981' },
    { name: 'Anthropic', value: 25, color: '#F59E0B' },
    { name: 'Google', value: 20, color: '#3B82F6' },
    { name: 'Meta', value: 12, color: '#8B5CF6' },
    { name: 'Others', value: 8, color: '#6B7280' },
  ]

  const mockCategoryData = [
    { category: 'Math', accuracy: 0.89, tests: 156 },
    { category: 'Code', accuracy: 0.85, tests: 243 },
    { category: 'Language', accuracy: 0.92, tests: 189 },
    { category: 'Reasoning', accuracy: 0.87, tests: 134 },
    { category: 'Science', accuracy: 0.83, tests: 98 },
  ]

  const formatMetricValue = (value: number) => {
    switch (metric) {
      case 'accuracy':
        return `${Math.round(value * 100)}%`
      case 'latency':
        return `${value ? value.toFixed(1) : '0.0'}s`
      case 'cost':
        return `$${value ? value.toFixed(3) : '0.000'}`
      default:
        return value.toString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {metric.charAt(0).toUpperCase() + metric.slice(1)} Trends
          </CardTitle>
          <CardDescription>
            Performance over time for top models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatMetricValue}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [formatMetricValue(value), '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="GPT-4 Turbo" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Claude 3 Opus" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gemini Pro" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Provider Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Provider Distribution
          </CardTitle>
          <CardDescription>
            Market share by provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockProviderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {mockProviderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {mockProviderData.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: provider.color }}
                  />
                  {provider.name}
                </div>
                <span className="font-medium">{provider.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Category Performance
          </CardTitle>
          <CardDescription>
            Average {metric} by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCategoryData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatMetricValue}
                />
                <Tooltip 
                  formatter={(value: number) => [formatMetricValue(value), metric]}
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
    </div>
  )
}
