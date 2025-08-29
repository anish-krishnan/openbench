/**
 * Test run panel component
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { StatusPill } from '@/components/ui/status-pill'
import { useModels, useRunTest } from '@/hooks/api'
import { useTestResultUpdates } from '@/hooks/realtime'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  Play,
  Square,
  Zap,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import type { TestCase } from '@/types/api'

interface TestRunPanelProps {
  test: TestCase
}

interface ModelRunStatus {
  model_id: string
  status: 'idle' | 'queued' | 'running' | 'passed' | 'failed' | 'error'
  progress?: number
  result?: {
    score: number
    latency_ms: number
    cost: number
    tokens_used: number
  }
  error?: string
}

export function TestRunPanel({ test }: TestRunPanelProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [runStatuses, setRunStatuses] = useState<Record<string, ModelRunStatus>>({})
  const [isRunning, setIsRunning] = useState(false)
  
  const { data: modelsResponse, isLoading: modelsLoading } = useModels({ 
    is_active: true,
    size: 50 
  })
  const runTestMutation = useRunTest()
  
  // Subscribe to realtime updates for this test
  useTestResultUpdates(test.id)

  // Mock models if no data
  const mockModels = [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      cost_per_input_token: 0.01,
      cost_per_output_token: 0.03,
      supports_structured_output: true
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      cost_per_input_token: 0.015,
      cost_per_output_token: 0.075,
      supports_structured_output: true
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      cost_per_input_token: 0.0005,
      cost_per_output_token: 0.0015,
      supports_structured_output: false
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      cost_per_input_token: 0.0005,
      cost_per_output_token: 0.0015,
      supports_structured_output: false
    }
  ]

  const models = modelsResponse?.data || mockModels

  // Filter models based on test requirements
  const compatibleModels = models.filter(model => {
    if (test.evaluation_type === 'structured_match' && !model.supports_structured_output) {
      return false
    }
    return true
  })

  const handleModelSelection = (modelId: string, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, modelId])
    } else {
      setSelectedModels(prev => prev.filter(id => id !== modelId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedModels(compatibleModels.map(m => m.id))
    } else {
      setSelectedModels([])
    }
  }

  const handleRunTest = async () => {
    if (selectedModels.length === 0) return

    setIsRunning(true)
    
    // Initialize run statuses
    const initialStatuses: Record<string, ModelRunStatus> = {}
    selectedModels.forEach(modelId => {
      initialStatuses[modelId] = {
        model_id: modelId,
        status: 'queued',
        progress: 0
      }
    })
    setRunStatuses(initialStatuses)

    try {
      // Simulate test execution
      for (const modelId of selectedModels) {
        // Update to running
        setRunStatuses(prev => ({
          ...prev,
          [modelId]: { ...prev[modelId], status: 'running', progress: 25 }
        }))

        // Simulate progress
        await new Promise(resolve => setTimeout(resolve, 1000))
        setRunStatuses(prev => ({
          ...prev,
          [modelId]: { ...prev[modelId], progress: 75 }
        }))

        await new Promise(resolve => setTimeout(resolve, 1500))

        // Mock result
        const mockResult = {
          score: 0.8 + Math.random() * 0.2,
          latency_ms: 1000 + Math.random() * 3000,
          cost: 0.01 + Math.random() * 0.05,
          tokens_used: 100 + Math.floor(Math.random() * 200)
        }

        const finalStatus: ModelRunStatus = {
          model_id: modelId,
          status: mockResult.score > 0.7 ? 'passed' : 'failed',
          progress: 100,
          result: mockResult
        }

        setRunStatuses(prev => ({
          ...prev,
          [modelId]: finalStatus
        }))
      }

      // Call actual API
      await runTestMutation.mutateAsync({ testId: test.id, modelIds: selectedModels })
    } catch (error) {
      console.error('Test run failed:', error)
      // Update failed statuses
      selectedModels.forEach(modelId => {
        setRunStatuses(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            status: 'error',
            error: 'Test execution failed'
          }
        }))
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleStopTest = () => {
    setIsRunning(false)
    // Reset statuses
    setRunStatuses({})
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'anthropic': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'google': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const estimatedCost = selectedModels.reduce((total, modelId) => {
    const model = models.find(m => m.id === modelId)
    if (!model) return total
    // Rough estimate: 150 input tokens, 100 output tokens
    return total + (model.cost_per_input_token * 150 + model.cost_per_output_token * 100) / 1000
  }, 0)

  if (modelsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
          <p>Loading available models...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Models to Test</CardTitle>
              <CardDescription>
                Choose which models to run this test against
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedModels.length === compatibleModels.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All ({compatibleModels.length})
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compatibleModels.map((model) => (
              <div 
                key={model.id} 
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  id={model.id}
                  checked={selectedModels.includes(model.id)}
                  onCheckedChange={(checked) => handleModelSelection(model.id, Boolean(checked))}
                  disabled={isRunning}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label 
                      htmlFor={model.id} 
                      className="font-medium cursor-pointer"
                    >
                      {model.name}
                    </label>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getProviderColor(model.provider)}`}
                    >
                      {model.provider}
                    </Badge>
                    {model.supports_structured_output && (
                      <Badge variant="outline" className="text-xs">
                        Structured
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~${((model.cost_per_input_token * 150 + model.cost_per_output_token * 100) / 1000).toFixed(4)} per run
                  </div>
                </div>
                {runStatuses[model.id] && (
                  <StatusPill status={runStatuses[model.id].status} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Run Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Execution</CardTitle>
          <CardDescription>
            Run the selected models against this test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Execution Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{selectedModels.length}</div>
              <div className="text-sm text-muted-foreground">Models Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">~{(estimatedCost * selectedModels.length).toFixed(3)}</div>
              <div className="text-sm text-muted-foreground">Est. Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">~{Math.ceil(selectedModels.length * 2.5)}</div>
              <div className="text-sm text-muted-foreground">Est. Time (s)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <Button 
                onClick={handleRunTest}
                disabled={selectedModels.length === 0}
                size="lg"
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Run Test on {selectedModels.length} Model{selectedModels.length !== 1 ? 's' : ''}
              </Button>
            ) : (
              <Button 
                onClick={handleStopTest}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Execution
              </Button>
            )}
          </div>

          {/* Progress Display */}
          {isRunning && Object.keys(runStatuses).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Execution Progress</h4>
              {Object.values(runStatuses).map((status) => {
                const model = models.find(m => m.id === status.model_id)
                return (
                  <div key={status.model_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model?.name}</span>
                        <StatusPill status={status.status} />
                      </div>
                      {status.result && (
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-green-600" />
                            {Math.round(status.result.score * 100)}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            {(status.result.latency_ms / 1000).toFixed(1)}s
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-orange-600" />
                            ${status.result.cost.toFixed(3)}
                          </div>
                        </div>
                      )}
                    </div>
                    {status.progress !== undefined && status.status === 'running' && (
                      <Progress value={status.progress} className="h-2" />
                    )}
                    {status.error && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {status.error}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Test Requirements</CardTitle>
          <CardDescription>
            Model compatibility and requirements for this test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Evaluation Type:</span>
              <Badge variant="outline">{test.evaluation_type.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Structured Output Required:</span>
              <div className="flex items-center gap-1">
                {test.evaluation_type === 'structured_match' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">
                  {test.evaluation_type === 'structured_match' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Compatible Models:</span>
              <span className="text-sm font-medium">
                {compatibleModels.length} of {models.length}
              </span>
            </div>
            {test.is_parameterized && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Max Test Cases:</span>
                <span className="text-sm font-medium">{test.max_test_cases}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
