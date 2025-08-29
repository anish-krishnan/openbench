/**
 * Tests grid component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/status-pill'
import { 
  ExternalLink,
  Play,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { TestCase, PaginationMeta, TestFilters } from '@/types/api'

interface TestsGridProps {
  tests: TestCase[]
  pagination?: PaginationMeta
  filters: TestFilters
  onFiltersChange: (filters: TestFilters) => void
}

export function TestsGrid({ tests, pagination, filters, onFiltersChange }: TestsGridProps) {
  // Mock data if no tests provided
  const mockTests: TestCase[] = [
    {
      id: '1',
      title: 'Mathematical Reasoning Challenge',
      description: 'Evaluate mathematical problem-solving capabilities with multi-step word problems, algebraic equations, and geometric reasoning tasks.',
      category: 'Mathematics',
      tags: ['reasoning', 'math', 'word-problems', 'algebra'],
      difficulty: 'medium',
      prompt_template: 'Solve the following mathematical problem step by step: {problem}',
      expected_output: { solution: 'string', steps: 'array' },
      evaluation_type: 'structured_match',
      status: 'approved',
      visibility: 'public',
      created_by: 'math_researcher',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      version: 1,
      is_parameterized: true,
      max_test_cases: 50
    },
    {
      id: '2',
      title: 'Code Generation & Debugging',
      description: 'Test ability to generate correct code and identify bugs in various programming languages including Python, JavaScript, and Java.',
      category: 'Programming',
      tags: ['coding', 'debugging', 'python', 'javascript', 'java'],
      difficulty: 'hard',
      prompt_template: 'Generate working code for: {task}. Include error handling and comments.',
      expected_output: { code: 'string', language: 'string', explanation: 'string' },
      evaluation_type: 'llm_judge',
      status: 'approved',
      visibility: 'public',
      created_by: 'dev_master',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      version: 2,
      is_parameterized: true,
      max_test_cases: 100
    },
    {
      id: '3',
      title: 'Creative Writing Assessment',
      description: 'Assess creative writing abilities through story generation, poetry creation, and narrative consistency evaluation.',
      category: 'Language',
      tags: ['creative-writing', 'storytelling', 'poetry', 'narrative'],
      difficulty: 'easy',
      prompt_template: 'Write a creative {type} about {topic} in {style} style.',
      expected_output: { text: 'string', genre: 'string', word_count: 'number' },
      evaluation_type: 'llm_judge',
      status: 'approved',
      visibility: 'public',
      created_by: 'writer_ai',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      version: 1,
      is_parameterized: false
    },
  ]

  const displayTests = tests.length > 0 ? tests : mockTests

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getEvaluationTypeLabel = (type: string) => {
    switch (type) {
      case 'exact_match': return 'Exact Match'
      case 'structured_match': return 'Structured'
      case 'llm_judge': return 'LLM Judge'
      default: return type
    }
  }

  const handlePageChange = (page: number) => {
    onFiltersChange({
      ...filters,
      page
    })
  }

  return (
    <div className="space-y-6">
      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTests.map((test) => (
          <Card key={test.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link 
                      href={`/tests/${test.id}`}
                      className="hover:text-primary transition-colors line-clamp-2"
                    >
                      {test.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{test.category}</Badge>
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(test.difficulty)}
                    >
                      {test.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getEvaluationTypeLabel(test.evaluation_type)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {test.description}
                  </CardDescription>
                </div>
                <StatusPill status={test.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {test.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {test.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{test.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {test.created_by}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                  </div>
                </div>
                {test.version > 1 && (
                  <Badge variant="outline" className="text-xs">
                    v{test.version}
                  </Badge>
                )}
              </div>

              {/* Additional info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {test.is_parameterized && (
                    <span>Parameterized</span>
                  )}
                  {test.max_test_cases && (
                    <span>Max: {test.max_test_cases} cases</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {test.visibility}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/tests/${test.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tests/${test.id}?action=run`}>
                    <Play className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.has_prev}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + Math.max(1, pagination.page - 2)
              if (page > pagination.pages) return null
              
              return (
                <Button
                  key={page}
                  variant={page === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.has_next}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
