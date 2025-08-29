/**
 * Top models component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLeaderboard } from '@/hooks/api'
import { LoadingSpinner, Skeleton } from '@/components/ui/loading'
import { 
  ArrowRight, 
  Trophy,
  TrendingUp,
  Zap
} from 'lucide-react'

export function TopModels() {
  const { data: leaderboardResponse, isLoading, error } = useLeaderboard({
    limit: 5,
    timeframe: '30d'
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Unable to load leaderboard
          </p>
        </CardContent>
      </Card>
    )
  }

  const leaderboard = leaderboardResponse?.data

  // Mock data if no real data available
  const mockModels = [
    {
      model_id: 'gpt-4-turbo',
      model_name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      accuracy: 0.94,
      rank: 1,
      total_tests: 1247,
    },
    {
      model_id: 'claude-3-opus',
      model_name: 'Claude 3 Opus',
      provider: 'Anthropic',
      accuracy: 0.92,
      rank: 2,
      total_tests: 1098,
    },
    {
      model_id: 'gemini-pro',
      model_name: 'Gemini Pro',
      provider: 'Google',
      accuracy: 0.89,
      rank: 3,
      total_tests: 987,
    },
    {
      model_id: 'gpt-3.5-turbo',
      model_name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      accuracy: 0.86,
      rank: 4,
      total_tests: 1456,
    },
    {
      model_id: 'claude-3-haiku',
      model_name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      accuracy: 0.83,
      rank: 5,
      total_tests: 743,
    }
  ]

  const displayModels = leaderboard?.entries?.slice(0, 5) || mockModels

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Models
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leaderboard">
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayModels.map((model) => (
          <div key={model.model_id} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 text-sm font-bold">
              {getRankIcon(model.rank)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  href={`/models/${model.model_id}`}
                  className="font-medium hover:text-primary transition-colors truncate"
                >
                  {model.model_name}
                </Link>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getProviderColor(model.provider)}`}
                >
                  {model.provider}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {model.total_tests} tests completed
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                {Math.round(model.accuracy * 100)}%
              </div>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t">
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/compare">
              <Zap className="mr-2 h-4 w-4" />
              Compare Models
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
