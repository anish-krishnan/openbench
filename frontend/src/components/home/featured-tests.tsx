/**
 * Featured tests component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTests } from '@/hooks/api'
import { LoadingSpinner, Skeleton } from '@/components/ui/loading'
import { StatusPill } from '@/components/ui/status-pill'
import { 
  ArrowRight, 
  User, 
  Calendar,
  Star,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function FeaturedTests() {
  const { data: testsResponse, isLoading, error } = useTests({ 
    status: 'approved',
    page: 1,
    size: 6 
  })

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Tests</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Featured Tests</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Unable to load featured tests</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tests = testsResponse?.data || []

  // Mock featured tests if no data
  const mockTests = [
    {
      id: '1',
      title: 'Mathematical Reasoning',
      description: 'Evaluate mathematical problem-solving capabilities with multi-step word problems and algebraic equations.',
      category: 'Mathematics',
      tags: ['reasoning', 'math', 'word-problems'],
      difficulty: 'medium' as const,
      created_by: 'alice_researcher',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_approved: true,
      is_public: true,
      prompt: 'Sample prompt',
      expected_output: {},
      evaluation_type: 'exact_match' as const,
      timeout_seconds: 30,
      language: 'en',
      total_runs: 0,
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Code Generation & Debugging',
      description: 'Test ability to generate correct code and identify bugs in various programming languages.',
      category: 'Programming',
      tags: ['coding', 'debugging', 'python', 'javascript'],
      difficulty: 'hard' as const,
      created_by: 'dev_master',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      is_approved: true,
      is_public: true,
      prompt: 'Sample prompt',
      expected_output: {},
      evaluation_type: 'exact_match' as const,
      timeout_seconds: 30,
      language: 'en',
      total_runs: 0,
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Creative Writing Assessment',
      description: 'Assess creative writing abilities through story generation, poetry, and narrative consistency.',
      category: 'Language',
      tags: ['creative-writing', 'storytelling', 'poetry'],
      difficulty: 'easy' as const,
      created_by: 'writer_ai',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_approved: true,
      is_public: true,
      prompt: 'Sample prompt',
      expected_output: {},
      evaluation_type: 'exact_match' as const,
      timeout_seconds: 30,
      language: 'en',
      total_runs: 0,
      updated_at: new Date().toISOString(),
    }
  ]

  const displayTests = tests.length > 0 ? tests.slice(0, 3) : mockTests

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Featured Tests</h2>
        <Button asChild variant="outline">
          <Link href="/tests">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {displayTests.map((test) => (
          <Card key={test.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link 
                      href={`/tests/${test.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {test.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {test.description}
                  </CardDescription>
                </div>
                <StatusPill status={test.is_approved ? 'approved' : 'pending'} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{test.category}</Badge>
                <Badge 
                  variant="outline" 
                  className={getDifficultyColor(test.difficulty)}
                >
                  {test.difficulty}
                </Badge>
                {test.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {test.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{test.tags.length - 2} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {test.created_by}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/tests/${test.id}`}>
                    View Details
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
