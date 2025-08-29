/**
 * Model history component
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  Calendar,
  GitCommit,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ModelHistoryProps {
  modelId: string
}

export function ModelHistory({ modelId }: ModelHistoryProps) {
  // Mock historical data
  const mockHistoryData = [
    { date: '2024-01-01', accuracy: 0.89, latency: 2.8, cost: 0.052 },
    { date: '2024-01-08', accuracy: 0.91, latency: 2.6, cost: 0.049 },
    { date: '2024-01-15', accuracy: 0.92, latency: 2.4, cost: 0.047 },
    { date: '2024-01-22', accuracy: 0.94, latency: 2.3, cost: 0.045 },
  ]

  const mockVersionHistory = [
    {
      version: '1.3.0',
      date: '2024-01-22T00:00:00Z',
      changes: [
        'Improved reasoning capabilities',
        'Reduced latency by 15%',
        'Enhanced structured output support'
      ],
      type: 'major'
    },
    {
      version: '1.2.1',
      date: '2024-01-15T00:00:00Z',
      changes: [
        'Bug fixes in JSON parsing',
        'Minor performance improvements'
      ],
      type: 'patch'
    },
    {
      version: '1.2.0',
      date: '2024-01-08T00:00:00Z',
      changes: [
        'Added support for function calling',
        'Improved context handling',
        'Updated safety filters'
      ],
      type: 'minor'
    },
    {
      version: '1.1.0',
      date: '2024-01-01T00:00:00Z',
      changes: [
        'Initial release',
        'Base model capabilities'
      ],
      type: 'major'
    }
  ]

  const getVersionBadgeVariant = (type: string) => {
    switch (type) {
      case 'major': return 'default'
      case 'minor': return 'secondary'
      case 'patch': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Historical performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHistoryData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${Math.round(value * 100)}%`}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => {
                    if (name === 'accuracy') return [`${Math.round(value * 100)}%`, 'Accuracy']
                    if (name === 'latency') return [`${value ? value.toFixed(1) : 'N/A'}s`, 'Latency']
                    if (name === 'cost') return [`$${value ? value.toFixed(3) : 'N/A'}`, 'Cost']
                    return [value, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="accuracy"
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="latency"
                  yAxisId="right"
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="cost"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Latency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Cost</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            Release notes and version updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockVersionHistory.map((version, index) => (
              <div key={version.version} className="relative">
                {/* Timeline line */}
                {index < mockVersionHistory.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-border"></div>
                )}
                
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {version.version.split('.')[0]}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">Version {version.version}</h4>
                      <Badge variant={getVersionBadgeVariant(version.type)}>
                        {version.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.date), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {version.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest test runs and evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity data available</p>
            <p className="text-sm">Activity tracking will be implemented in a future update</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
