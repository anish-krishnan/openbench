/**
 * Test edit wizard component - reuses submission wizard for editing existing tests
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUpdateTest, useTest } from '@/hooks/api'
import { useSession } from 'next-auth/react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageLoading } from '@/components/ui/loading'
import { TestSubmissionWizard } from './test-submission-wizard'
import type { TestCaseCreate, TestCaseFormData, TestCase } from '@/types/api'

interface TestEditWizardProps {
  testId: string
}

export function TestEditWizard({ testId }: TestEditWizardProps) {
  const router = useRouter()
  const { data: testResponse, isLoading, error } = useTest(testId)
  const updateTestMutation = useUpdateTest()
  const { data: session } = useSession()
  
  // Development bypass - mock authenticated user
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const mockSession = isClient ? {
    user: {
      id: 'dev-user',
      name: 'Developer',
      email: 'admin@example.com',
      role: 'admin'
    }
  } : null
  
  const effectiveSession = session || mockSession

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Test Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The test you're trying to edit could not be found or you don't have permission to edit it.
            </p>
            <Button onClick={() => router.push('/tests')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!effectiveSession) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to edit tests.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const test = testResponse?.data
  if (!test) {
    return null
  }

  // Transform test data to form data format
  const initialFormData: Partial<TestCaseFormData> = {
    title: test.title,
    description: test.description || '',
    category: test.category,
    tags: test.tags || [],
    difficulty: test.difficulty,
    prompt_template: test.prompt,
    expected_output: test.expected_output,
    evaluation_type: test.evaluation_type,
    evaluation_config: test.evaluation_config,
    visibility: test.is_public ? 'public' : 'private',
    is_parameterized: false // This field doesn't exist in current TestCase but is in form
  }

  const handleUpdate = async (formData: Partial<TestCaseFormData>) => {
    try {
      // Transform form data to API format
      const updateData: Partial<TestCaseCreate> = {
        title: formData.title!,
        description: formData.description,
        category: formData.category!,
        tags: formData.tags || [],
        difficulty: formData.difficulty || 'medium',
        prompt: formData.prompt_template!,
        expected_output: typeof formData.expected_output === 'string' 
          ? { answer: formData.expected_output }
          : formData.expected_output || { answer: '' },
        evaluation_type: formData.evaluation_type || 'exact_match',
        evaluation_config: formData.evaluation_config,
        is_public: formData.visibility === 'public',
        language: 'en',
        timeout_seconds: 30
      }
      
      console.log('Updating test data:', updateData)
      
      await updateTestMutation.mutateAsync({ id: testId, updates: updateData })
      toast.success('Test updated successfully!')
      router.push(`/tests/${testId}`)
    } catch (error: any) {
      console.error('Test update failed:', error)
      
      let errorMessage = 'Failed to update test. Please try again.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details && Array.isArray(error.details)) {
        const validationErrors = error.details.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
        errorMessage = `Validation errors: ${validationErrors}`
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push(`/tests/${testId}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Test
        </Button>
        <h1 className="text-3xl font-bold mb-2">Edit Test</h1>
        <p className="text-muted-foreground text-lg">
          Update your test case details and configuration
        </p>
      </div>

      {/* Reuse the submission wizard but pass initial data and custom submit handler */}
      <TestSubmissionWizard
        initialData={initialFormData}
        onSubmit={handleUpdate}
        submitButtonText="Update Test"
        isEdit={true}
      />
    </div>
  )
}
