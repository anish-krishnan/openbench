/**
 * Test detail page component
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusPill } from '@/components/ui/status-pill'
import { useTest, useRunTest } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import { TestSchema } from './test-schema'
import { TestResults } from './test-results'
import { TestRunPanel } from './test-run-panel'
import { 
  ArrowLeft,
  Play,
  Flag,
  Edit,
  Calendar,
  User,
  Eye,
  GitBranch,
  Hash
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TestDetailPageProps {
  testId: string
}

export function TestDetailPage({ testId }: TestDetailPageProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: testResponse, isLoading: testLoading, error: testError } = useTest(testId, true)
  const runTestMutation = useRunTest()

  if (testLoading) {
    return <PageLoading />
  }

  if (testError) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Test not found</h2>
            <p className="text-muted-foreground mb-4">
              The requested test could not be found or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/tests">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tests
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const test = testResponse?.data

  // Mock data if no real data available
  const mockTest = {
    id: testId,
    title: 'Mathematical Reasoning Challenge',
    description: 'This comprehensive test evaluates mathematical problem-solving capabilities through multi-step word problems, algebraic equations, and geometric reasoning tasks. The test includes various difficulty levels and covers topics from basic arithmetic to advanced calculus.',
    category: 'Mathematics',
    tags: ['reasoning', 'math', 'word-problems', 'algebra', 'geometry'],
    difficulty: 'medium' as const,
    prompt_template: 'Solve the following mathematical problem step by step: {problem}\n\nPlease provide:\n1. Your solution\n2. Step-by-step reasoning\n3. Final answer',
    input_schema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'The mathematical problem to solve' }
      },
      required: ['problem']
    },
    expected_output_schema: {
      type: 'object',
      properties: {
        solution: { type: 'string', description: 'Step-by-step solution' },
        answer: { type: 'string', description: 'Final numerical answer' },
        confidence: { type: 'number', description: 'Confidence level (0-1)' }
      },
      required: ['solution', 'answer']
    },
    expected_output: {
      solution: 'Step 1: Identify the problem type...',
      answer: '42',
      confidence: 0.95
    },
    evaluation_type: 'structured_match' as const,
    evaluation_config: {
      tolerance: 0.01,
      required_fields: ['solution', 'answer']
    },
    status: 'approved' as const,
    visibility: 'public' as const,
    created_by: 'math_researcher',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
    is_parameterized: true,
    max_test_cases: 50
  }

  const displayTest = test || mockTest

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
      case 'structured_match': return 'Structured Match'
      case 'llm_judge': return 'LLM Judge'
      default: return type
    }
  }

  const handleRunTest = () => {
    runTestMutation.mutate({ testId: displayTest.id })
  }

  return (
    <div className="container py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/tests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3">{displayTest.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{displayTest.category}</Badge>
              <Badge 
                variant="outline" 
                className={getDifficultyColor(displayTest.difficulty)}
              >
                {displayTest.difficulty}
              </Badge>
              <Badge variant="outline">
                {getEvaluationTypeLabel(displayTest.evaluation_type)}
              </Badge>
              <StatusPill status={displayTest.status} />
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {displayTest.visibility}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg max-w-4xl leading-relaxed">
              {displayTest.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              size="sm"
              onClick={handleRunTest}
              disabled={runTestMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              {runTestMutation.isPending ? 'Running...' : 'Run Test'}
            </Button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Created by</span>
            <Link href={`/users/${displayTest.created_by}`} className="font-medium hover:text-primary">
              {displayTest.created_by}
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(displayTest.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            <span>Version {displayTest.version}</span>
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{displayTest.id}</code>
          </div>
          {displayTest.is_parameterized && (
            <Badge variant="outline" className="text-xs">
              Parameterized ({displayTest.max_test_cases} max cases)
            </Badge>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {displayTest.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="run">Run Test</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Prompt Template */}
              <Card>
                <CardHeader>
                  <CardTitle>Prompt Template</CardTitle>
                  <CardDescription>
                    The template used to generate prompts for this test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {displayTest.prompt_template}
                  </pre>
                </CardContent>
              </Card>

              {/* Expected Output */}
              <Card>
                <CardHeader>
                  <CardTitle>Expected Output Example</CardTitle>
                  <CardDescription>
                    Sample of what a correct response should look like
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(displayTest.expected_output, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Test Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="secondary">{displayTest.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(displayTest.difficulty)}
                    >
                      {displayTest.difficulty}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evaluation:</span>
                    <Badge variant="outline">
                      {getEvaluationTypeLabel(displayTest.evaluation_type)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <StatusPill status={displayTest.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility:</span>
                    <Badge variant="outline">{displayTest.visibility}</Badge>
                  </div>
                  {displayTest.is_parameterized && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Cases:</span>
                      <span className="font-medium">{displayTest.max_test_cases}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-6">
          <TestSchema test={displayTest} />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <TestResults testId={displayTest.id} />
        </TabsContent>

        <TabsContent value="run" className="space-y-6">
          <TestRunPanel test={displayTest} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
