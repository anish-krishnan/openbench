/**
 * Pending tests moderation page component
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusPill } from '@/components/ui/status-pill'
import { usePendingTests, useModeratePosts } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  Calendar,
  User,
  FileText,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { PendingTest } from '@/types/api'

export function PendingTestsPage() {
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [moderationNotes, setModerationNotes] = useState('')
  const [selectedTest, setSelectedTest] = useState<PendingTest | null>(null)
  
  const { data: pendingResponse, isLoading, error } = usePendingTests(1, 50)
  const moderateMutation = useModeratePosts()

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to load pending tests</h2>
            <p className="text-muted-foreground">
              There was an error loading the pending tests. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mock pending tests data
  const mockPendingTests: PendingTest[] = [
    {
      id: '1',
      title: 'Advanced Mathematical Reasoning',
      description: 'This test evaluates complex mathematical problem-solving abilities including calculus, linear algebra, and statistical analysis.',
      category: 'Mathematics',
      tags: ['advanced-math', 'calculus', 'statistics', 'reasoning'],
      difficulty: 'hard',
      prompt_template: 'Solve the following advanced mathematical problem: {problem}',
      expected_output: { solution: 'string', steps: 'array', confidence: 'number' },
      evaluation_type: 'structured_match',
      status: 'pending',
      visibility: 'public',
      created_by: 'math_professor',
      created_by_username: 'math_professor',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      version: 1,
      is_parameterized: true,
      max_test_cases: 100,
      submission_notes: 'This test is designed to challenge the most advanced mathematical reasoning capabilities of LLMs.'
    },
    {
      id: '2',
      title: 'Creative Story Writing',
      description: 'Evaluate creative writing skills through story generation with specific themes and constraints.',
      category: 'Language',
      tags: ['creative-writing', 'storytelling', 'narrative', 'fiction'],
      difficulty: 'medium',
      prompt_template: 'Write a {genre} story about {theme} with {constraint}.',
      expected_output: { story: 'string', word_count: 'number', genre: 'string' },
      evaluation_type: 'llm_judge',
      status: 'pending',
      visibility: 'public',
      created_by: 'writer_jane',
      created_by_username: 'writer_jane',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      version: 1,
      is_parameterized: true,
      max_test_cases: 50
    },
    {
      id: '3',
      title: 'Code Review and Bug Detection',
      description: 'Test the ability to identify bugs, security issues, and code quality problems in various programming languages.',
      category: 'Programming',
      tags: ['code-review', 'debugging', 'security', 'quality'],
      difficulty: 'hard',
      prompt_template: 'Review the following code and identify any issues: {code}',
      expected_output: { issues: 'array', severity: 'string', recommendations: 'array' },
      evaluation_type: 'structured_match',
      status: 'pending',
      visibility: 'public',
      created_by: 'security_expert',
      created_by_username: 'security_expert',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      version: 1,
      is_parameterized: true,
      max_test_cases: 75
    }
  ]

  const pendingTests = pendingResponse?.data || mockPendingTests

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests(prev => [...prev, testId])
    } else {
      setSelectedTests(prev => prev.filter(id => id !== testId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests(pendingTests.map(t => t.id))
    } else {
      setSelectedTests([])
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTests.length === 0) {
      toast.error('Please select tests to moderate')
      return
    }

    try {
      await moderateMutation.mutateAsync({
        test_ids: selectedTests,
        action,
        notes: moderationNotes || undefined
      })
      
      toast.success(`${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''} ${action}d successfully`)
      setSelectedTests([])
      setModerationNotes('')
    } catch (error) {
      toast.error(`Failed to ${action} tests`)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-4 mb-2">Pending Tests</h1>
        <p className="text-muted-foreground text-lg">
          Review and moderate test submissions from the community
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Pending</span>
            </div>
            <div className="text-2xl font-bold">{pendingTests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Selected</span>
            </div>
            <div className="text-2xl font-bold">{selectedTests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Wait Time</span>
            </div>
            <div className="text-2xl font-bold">2.3 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Moderate multiple tests at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="moderation-notes">Moderation Notes (Optional)</Label>
            <Textarea
              id="moderation-notes"
              placeholder="Add notes for the submitters..."
              value={moderationNotes}
              onChange={(e) => setModerationNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleBulkAction('approve')}
              disabled={selectedTests.length === 0 || moderateMutation.isPending}
              variant="default"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve {selectedTests.length > 0 && `(${selectedTests.length})`}
            </Button>
            
            <Button
              onClick={() => handleBulkAction('reject')}
              disabled={selectedTests.length === 0 || moderateMutation.isPending}
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject {selectedTests.length > 0 && `(${selectedTests.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Submissions</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTests.length === pendingTests.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingTests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTests.length === pendingTests.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTests.includes(test.id)}
                          onCheckedChange={(checked) => handleTestSelection(test.id, Boolean(checked))}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium line-clamp-1">{test.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {test.description}
                          </div>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{test.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getDifficultyColor(test.difficulty)}
                        >
                          {test.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {test.created_by_username}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedTest(test)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{test.title}</DialogTitle>
                                <DialogDescription>
                                  Review test details and make moderation decision
                                </DialogDescription>
                              </DialogHeader>
                              {selectedTest && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Category</Label>
                                      <div>{selectedTest.category}</div>
                                    </div>
                                    <div>
                                      <Label>Difficulty</Label>
                                      <div className="capitalize">{selectedTest.difficulty}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Description</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedTest.description}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <Label>Prompt Template</Label>
                                    <pre className="text-sm bg-muted p-3 rounded-lg mt-1 overflow-x-auto">
                                      {selectedTest.prompt_template}
                                    </pre>
                                  </div>
                                  
                                  <div>
                                    <Label>Expected Output</Label>
                                    <pre className="text-sm bg-muted p-3 rounded-lg mt-1 overflow-x-auto">
                                      {JSON.stringify(selectedTest.expected_output, null, 2)}
                                    </pre>
                                  </div>
                                  
                                  {selectedTest.submission_notes && (
                                    <div>
                                      <Label>Submission Notes</Label>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {selectedTest.submission_notes}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleBulkAction('approve')}
                                      disabled={moderateMutation.isPending}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() => handleBulkAction('reject')}
                                      disabled={moderateMutation.isPending}
                                      variant="destructive"
                                      className="flex-1"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="ghost" size="sm">
                            <Flag className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No pending tests</h3>
              <p className="text-muted-foreground">
                All test submissions have been reviewed. Great job!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
