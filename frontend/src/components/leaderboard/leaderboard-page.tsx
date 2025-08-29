/**
 * Leaderboard page component
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardTable } from './leaderboard-table'
import { LeaderboardFilters } from './leaderboard-filters'
import { LeaderboardCharts } from './leaderboard-charts'
import { useLeaderboard } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import type { LeaderboardFilters as FilterType } from '@/types/api'

export function LeaderboardPage() {
  const [filters, setFilters] = useState<FilterType>({
    timeframe: '30d',
    limit: 50,
  })

  const [activeTab, setActiveTab] = useState('accuracy')

  const { data: leaderboardResponse, isLoading, error } = useLeaderboard(filters)

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to load leaderboard</h2>
            <p className="text-muted-foreground">
              There was an error loading the leaderboard data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const leaderboard = leaderboardResponse?.data

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LLM Leaderboard</h1>
        <p className="text-muted-foreground text-lg">
          Compare model performance across different benchmarks and categories
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <LeaderboardFilters 
          filters={filters} 
          onChange={setFilters} 
        />
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="composite">Composite</TabsTrigger>
        </TabsList>

        <TabsContent value="accuracy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeaderboardTable 
                data={leaderboard} 
                metric="accuracy"
                filters={filters}
              />
            </div>
            <div>
              <LeaderboardCharts 
                data={leaderboard} 
                metric="accuracy"
                filters={filters}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="latency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeaderboardTable 
                data={leaderboard} 
                metric="latency"
                filters={filters}
              />
            </div>
            <div>
              <LeaderboardCharts 
                data={leaderboard} 
                metric="latency"
                filters={filters}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cost" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeaderboardTable 
                data={leaderboard} 
                metric="cost"
                filters={filters}
              />
            </div>
            <div>
              <LeaderboardCharts 
                data={leaderboard} 
                metric="cost"
                filters={filters}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="composite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Composite Score</CardTitle>
              <CardDescription>
                Weighted scoring across accuracy, latency, and cost metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Composite scoring coming soon. This will combine accuracy, latency, and cost 
                into a single weighted score based on community preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
