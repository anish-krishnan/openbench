/**
 * Test results component
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusPill } from '@/components/ui/status-pill'
import { useResults } from '@/hooks/api'
import { LoadingSpinner, Skeleton } from '@/components/ui/loading'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  ExternalLink,
  Download,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { TestResult } from '@/types/api'

interface TestResultsProps {
  testId: string
}

export function TestResults({ testId }: TestResultsProps) {
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { data: resultsResponse, isLoading, error } = useResults({
    test_case_id: testId,
    page: 1,
    size: 50
  })

  // Mock results data
  const mockResults: TestResult[] = [
    {
      id: '1',
      test_case_id: testId,
      model_id: 'gpt-4-turbo',
      execution_id: 'exec-1',
      status: 'passed',
      score: 0.95,
      output: {
        solution: 'Step 1: Parse the problem...',
        answer: '42',
        confidence: 0.95
      },
      metadata: {
        tokens_used: 150,
        latency_ms: 2300,
        cost: 0.045
      },
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 30 * 60 * 1000 + 2300).toISOString()
    },
    {
      id: '2',
      test_case_id: testId,
      model_id: 'claude-3-opus',
      execution_id: 'exec-2',
      status: 'passed',
      score: 0.92,
      output: {
        solution: 'Let me work through this step by step...',
        answer: '42',
        confidence: 0.88
      },
      metadata: {
        tokens_used: 180,
        latency_ms: 3100,
        cost: 0.054
      },
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 45 * 60 * 1000 + 3100).toISOString()
    },
    {
      id: '3',
      test_case_id: testId,
      model_id: 'gemini-pro',
      execution_id: 'exec-3',
      status: 'failed',
      score: 0.23,
      output: {
        solution: 'I need to solve this mathematical problem...',
        answer: '24',
        confidence: 0.45
      },
      error_message: 'Incorrect answer provided',
      metadata: {
        tokens_used: 120,
        latency_ms: 1800,
        cost: 0.012
      },
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 60 * 60 * 1000 + 1800).toISOString()
    }
  ]

  const results = resultsResponse?.data || mockResults

  // Filter results
  const filteredResults = results.filter(result => {
    if (modelFilter !== 'all' && result.model_id !== modelFilter) return false
    if (statusFilter !== 'all' && result.status !== statusFilter) return false
    return true
  })

  // Get unique models for filter
  const uniqueModels = Array.from(new Set(results.map(r => r.model_id)))

  // Calculate summary stats
  const totalResults = filteredResults.length
  const passedResults = filteredResults.filter(r => r.status === 'passed').length
  const failedResults = filteredResults.filter(r => r.status === 'failed').length
  const avgScore = totalResults > 0 ? filteredResults.reduce((sum, r) => sum + r.score, 0) / totalResults : 0
  const avgLatency = totalResults > 0 ? filteredResults.reduce((sum, r) => sum + r.metadata.latency_ms, 0) / totalResults : 0
  const avgCost = totalResults > 0 ? filteredResults.reduce((sum, r) => sum + r.metadata.cost, 0) / totalResults : 0

  // Prepare chart data
  const chartData = uniqueModels.map(modelId => {
    const modelResults = filteredResults.filter(r => r.model_id === modelId)
    const avgScore = modelResults.length > 0 ? modelResults.reduce((sum, r) => sum + r.score, 0) / modelResults.length : 0
    const avgLatency = modelResults.length > 0 ? modelResults.reduce((sum, r) => sum + r.metadata.latency_ms, 0) / modelResults.length : 0
    const passRate = modelResults.length > 0 ? modelResults.filter(r => r.status === 'passed').length / modelResults.length : 0
    
    return {
      model: modelId,
      score: avgScore,
      latency: avgLatency / 1000, // Convert to seconds
      passRate: passRate,
      total: modelResults.length
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Unable to load results</h3>
          <p className="text-muted-foreground">
            There was an error loading test results. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Runs</span>
            </div>
            <div className="text-2xl font-bold">{totalResults}</div>
            <div className="text-xs text-muted-foreground">
              {passedResults} passed, {failedResults} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Score</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(avgScore * 100)}%</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((passedResults / totalResults) * 100)}% pass rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Latency</span>
            </div>
            <div className="text-2xl font-bold">{avgLatency ? (avgLatency / 1000).toFixed(1) : '0.0'}s</div>
            <div className="text-xs text-muted-foreground">
              Response time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Cost</span>
            </div>
            <div className="text-2xl font-bold">${avgCost ? avgCost.toFixed(3) : '0.000'}</div>
            <div className="text-xs text-muted-foreground">
              Per evaluation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Comparison</CardTitle>
          <CardDescription>
            Score and latency comparison across different models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="model" 
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
                  formatter={(value: number, name: string) => {
                    if (name === 'score' || name === 'passRate') {
                      return [`${Math.round(value * 100)}%`, name === 'score' ? 'Avg Score' : 'Pass Rate']
                    }
                    return [`${value ? value.toFixed(1) : '0.0'}s`, 'Avg Latency']
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                Individual test execution results
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All models</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.model_id}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={result.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Math.round(result.score * 100)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {result.metadata.latency_ms ? (result.metadata.latency_ms / 1000).toFixed(1) : '0.0'}s
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${result.metadata.cost ? result.metadata.cost.toFixed(3) : '0.000'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {result.metadata.tokens_used}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {result.completed_at ? 
                        formatDistanceToNow(new Date(result.completed_at), { addSuffix: true }) : 
                        'In progress'
                      }
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results match the current filters</p>
              <p className="text-sm">Try adjusting your filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
