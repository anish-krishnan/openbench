/**
 * Test submission wizard component
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useCreateTest } from '@/hooks/api'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  FileText,
  Settings,
  Code,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import type { TestCaseCreate, TestCaseFormData } from '@/types/api'

const steps = [
  { id: 'basics', title: 'Basics', icon: FileText },
  { id: 'prompt', title: 'Prompt & Schema', icon: Code },
  { id: 'evaluation', title: 'Evaluation', icon: Settings },
  { id: 'review', title: 'Review', icon: CheckCircle }
]

interface TestSubmissionWizardProps {
  initialData?: Partial<TestCaseFormData>
  onSubmit?: (formData: Partial<TestCaseFormData>) => Promise<void>
  submitButtonText?: string
  isEdit?: boolean
}

export function TestSubmissionWizard({ 
  initialData, 
  onSubmit, 
  submitButtonText = 'Submit Test',
  isEdit = false 
}: TestSubmissionWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<TestCaseFormData>>(initialData || {
    title: '',
    description: '',
    category: '',
    tags: [],
    difficulty: 'medium',
    prompt_template: '',
    expected_output: {},
    evaluation_type: 'exact_match',
    visibility: 'public',
    is_parameterized: false
  })
  
  const { data: session } = useSession()
  
  // Development bypass - mock authenticated user (only on client side to avoid hydration mismatch)
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
  
  const router = useRouter()
  const createTestMutation = useCreateTest()

  // Redirect if not authenticated
  if (!effectiveSession) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to contribute tests to the platform.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const updateFormData = (updates: Partial<TestCaseFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    // If custom onSubmit is provided, use it (for editing)
    if (onSubmit) {
      await onSubmit(formData)
      return
    }

    // Default submission logic for creating new tests
    try {
      // Transform form data to match backend schema
      const submissionData: TestCaseCreate = {
        title: formData.title!,
        description: formData.description,
        category: formData.category!,
        tags: formData.tags || [],
        difficulty: formData.difficulty || 'medium',
        prompt: formData.prompt_template!,
        // Ensure expected_output is always an object
        expected_output: typeof formData.expected_output === 'string' 
          ? { answer: formData.expected_output }
          : formData.expected_output || { answer: '' },
        evaluation_type: formData.evaluation_type || 'exact_match',
        evaluation_config: formData.evaluation_config,
        is_public: formData.visibility === 'public',
        language: 'en',
        timeout_seconds: 30
      }
      
      console.log('Submitting test data:', submissionData)
      
      const result = await createTestMutation.mutateAsync(submissionData)
      toast.success('Test submitted successfully! It will be reviewed before being published.')
      router.push(`/tests/${result.data.id}`)
    } catch (error: any) {
      console.error('Test submission failed:', error)
      
      // Show specific error message if available
      let errorMessage = 'Failed to submit test. Please try again.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details && Array.isArray(error.details)) {
        // Handle validation errors
        const validationErrors = error.details.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
        errorMessage = `Validation errors: ${validationErrors}`
      }
      
      toast.error(errorMessage)
    }
  }

  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return formData.title && formData.description && formData.category
      case 1:
        return formData.prompt_template && formData.expected_output
      case 2:
        return formData.evaluation_type
      default:
        return true
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/tests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
        <h1 className="text-3xl font-bold mt-4 mb-2">Contribute a Test</h1>
        <p className="text-muted-foreground text-lg">
          Help improve LLM evaluation by contributing a new test case
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isValid = isStepValid(index)
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${isActive 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-500 text-white'
                      : isValid
                        ? 'border-muted-foreground bg-background text-muted-foreground'
                        : 'border-red-300 bg-background text-red-500'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <div className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-muted mx-4" />
                )}
              </div>
            )
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && "Provide basic information about your test"}
            {currentStep === 1 && "Define the prompt template and expected output format"}
            {currentStep === 2 && "Configure how responses will be evaluated"}
            {currentStep === 3 && "Review your test before submission"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basics */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Test Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mathematical Reasoning Challenge"
                  value={formData.title || ''}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test evaluates and how it works..."
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(value) => updateFormData({ category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Language">Language</SelectItem>
                      <SelectItem value="Reasoning">Reasoning</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty || 'medium'}
                    onValueChange={(value: any) => updateFormData({ difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g., math, reasoning, algebra)"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => updateFormData({ 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={formData.visibility === 'public'}
                  onCheckedChange={(checked) => 
                    updateFormData({ visibility: checked ? 'public' : 'private' })
                  }
                />
                <Label htmlFor="public">Make this test public</Label>
              </div>
            </div>
          )}

          {/* Step 2: Prompt & Schema */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt Template *</Label>
                <Textarea
                  id="prompt"
                  placeholder="Write your prompt template here. Use {variable} for dynamic content..."
                  value={formData.prompt_template || ''}
                  onChange={(e) => updateFormData({ prompt_template: e.target.value })}
                  rows={6}
                />
                <div className="text-sm text-muted-foreground">
                  <Info className="inline h-4 w-4 mr-1" />
                  Use curly braces for variables, e.g., "Solve this problem: {'{problem}'}"
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected-output">Expected Output Example *</Label>
                <Textarea
                  id="expected-output"
                  placeholder="Provide an example of the expected response format (JSON recommended)..."
                  value={typeof formData.expected_output === 'string' 
                    ? formData.expected_output 
                    : JSON.stringify(formData.expected_output, null, 2)
                  }
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      updateFormData({ expected_output: parsed })
                    } catch {
                      updateFormData({ expected_output: e.target.value })
                    }
                  }}
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parameterized"
                  checked={formData.is_parameterized || false}
                  onCheckedChange={(checked) => 
                    updateFormData({ is_parameterized: Boolean(checked) })
                  }
                />
                <Label htmlFor="parameterized">This test uses multiple input variations</Label>
              </div>

              {formData.is_parameterized && (
                <div className="space-y-2">
                  <Label htmlFor="max-cases">Maximum Test Cases</Label>
                  <Input
                    id="max-cases"
                    type="number"
                    placeholder="50"
                    value={formData.max_test_cases || ''}
                    onChange={(e) => updateFormData({ 
                      max_test_cases: parseInt(e.target.value) || undefined 
                    })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Evaluation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Evaluation Type *</Label>
                <Select
                  value={formData.evaluation_type || 'exact_match'}
                  onValueChange={(value: any) => updateFormData({ evaluation_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact_match">Exact Match</SelectItem>
                    <SelectItem value="structured_match">Structured Match</SelectItem>
                    <SelectItem value="llm_judge">LLM Judge</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {formData.evaluation_type === 'exact_match' && 
                    "Response must match expected output exactly"}
                  {formData.evaluation_type === 'structured_match' && 
                    "Response is validated against a schema with some flexibility"}
                  {formData.evaluation_type === 'llm_judge' && 
                    "An LLM evaluates the quality of the response"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eval-config">Evaluation Configuration (Optional)</Label>
                <Textarea
                  id="eval-config"
                  placeholder="Additional evaluation settings as JSON..."
                  value={formData.evaluation_config 
                    ? JSON.stringify(formData.evaluation_config, null, 2)
                    : ''
                  }
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      updateFormData({ evaluation_config: parsed })
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Test Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>
                    <div>{formData.title}</div>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <div>{formData.category}</div>
                  </div>
                  <div>
                    <span className="font-medium">Difficulty:</span>
                    <div className="capitalize">{formData.difficulty}</div>
                  </div>
                  <div>
                    <span className="font-medium">Evaluation:</span>
                    <div>{formData.evaluation_type?.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{formData.description}</p>
                </div>
                
                <div>
                  <span className="font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Review Process
                    </div>
                    <div className="text-blue-700 dark:text-blue-200">
                      Your test will be reviewed by our moderation team before being published. 
                      You'll be notified via email once the review is complete.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createTestMutation.isPending || !isStepValid(currentStep)}
            >
              <Send className="mr-2 h-4 w-4" />
              {createTestMutation.isPending ? (isEdit ? 'Updating...' : 'Submitting...') : submitButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
