/**
 * Leaderboard table component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  ExternalLink,
  GitCompare
} from 'lucide-react'
import type { LeaderboardData, LeaderboardFilters } from '@/types/api'

interface LeaderboardTableProps {
  data?: LeaderboardData
  metric: 'accuracy' | 'latency' | 'cost'
  filters: LeaderboardFilters
}

export function LeaderboardTable({ data, metric, filters }: LeaderboardTableProps) {
  // Mock data if no real data available
  const mockEntries = [
    {
      model_id: 'gpt-4-turbo',
      model_name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      accuracy: 0.94,
      total_tests: 1247,
      avg_latency: 2.3,
      avg_cost: 0.045,
      rank: 1,
    },
    {
      model_id: 'claude-3-opus',
      model_name: 'Claude 3 Opus',
      provider: 'Anthropic',
      accuracy: 0.92,
      total_tests: 1098,
      avg_latency: 3.1,
      avg_cost: 0.052,
      rank: 2,
    },
    {
      model_id: 'gemini-pro',
      model_name: 'Gemini Pro',
      provider: 'Google',
      accuracy: 0.89,
      total_tests: 987,
      avg_latency: 1.8,
      avg_cost: 0.028,
      rank: 3,
    },
    {
      model_id: 'gpt-3.5-turbo',
      model_name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      accuracy: 0.86,
      total_tests: 1456,
      avg_latency: 1.2,
      avg_cost: 0.012,
      rank: 4,
    },
    {
      model_id: 'claude-3-haiku',
      model_name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      accuracy: 0.83,
      total_tests: 743,
      avg_latency: 0.9,
      avg_cost: 0.008,
      rank: 5,
    }
  ]

  const entries = data?.entries || mockEntries

  // Sort entries based on metric
  const sortedEntries = [...entries].sort((a, b) => {
    switch (metric) {
      case 'accuracy':
        return b.accuracy - a.accuracy
      case 'latency':
        return a.avg_latency - b.avg_latency // Lower is better
      case 'cost':
        return a.avg_cost - b.avg_cost // Lower is better
      default:
        return a.rank - b.rank
    }
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'anthropic': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'google': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getMetricValue = (entry: any, metric: string) => {
    switch (metric) {
      case 'accuracy':
        return `${Math.round(entry.accuracy * 100)}%`
      case 'latency':
        return `${entry.avg_latency ? entry.avg_latency.toFixed(1) : '0.0'}s`
      case 'cost':
        return `$${entry.avg_cost ? entry.avg_cost.toFixed(3) : '0.000'}`
      default:
        return '-'
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'accuracy': return TrendingUp
      case 'latency': return Clock
      case 'cost': return DollarSign
      default: return Trophy
    }
  }

  const MetricIcon = getMetricIcon(metric)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MetricIcon className="h-5 w-5" />
            {metric.charAt(0).toUpperCase() + metric.slice(1)} Leaderboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {entries.length} models
            </span>
            <Button variant="outline" size="sm">
              <GitCompare className="mr-2 h-4 w-4" />
              Compare Selected
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </TableHead>
                <TableHead className="text-right">Tests</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry, index) => (
                <TableRow key={entry.model_id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getRankIcon(index + 1)}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {index === 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : index < 3 ? (
                          <TrendingUp className="h-3 w-3 text-blue-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/models/${entry.model_id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {entry.model_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getProviderColor(entry.provider)}
                    >
                      {entry.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="font-semibold">
                      {getMetricValue(entry, metric)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.total_tests.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/models/${entry.model_id}`}>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Showing {entries.length} of {entries.length} models
          </div>
          <div>
            Updated {data?.last_updated ? new Date(data.last_updated).toLocaleString() : 'recently'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
