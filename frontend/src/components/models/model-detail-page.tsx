/**
 * Model detail page component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useModel, useModelPerformance } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import { ModelSpecs } from './model-specs'
import { ModelPerformance } from './model-performance'
import { ModelHistory } from './model-history'
import { 
  ArrowLeft,
  ExternalLink,
  GitCompare,
  CheckCircle,
  XCircle,
  Calendar,
  Building
} from 'lucide-react'

interface ModelDetailPageProps {
  modelId: string
}

export function ModelDetailPage({ modelId }: ModelDetailPageProps) {
  const { data: modelResponse, isLoading: modelLoading, error: modelError } = useModel(modelId)
  const { data: performanceResponse, isLoading: performanceLoading } = useModelPerformance(modelId)

  if (modelLoading) {
    return <PageLoading />
  }

  if (modelError) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Model not found</h2>
            <p className="text-muted-foreground mb-4">
              The requested model could not be found or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/models">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Models
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const model = modelResponse?.data
  const performance = performanceResponse?.data

  // Mock data if no real data available
  const mockModel = {
    id: modelId,
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    model_type: 'Chat',
    context_length: 128000,
    max_output_tokens: 4096,
    supports_structured_output: true,
    cost_per_input_token: 0.01,
    cost_per_output_token: 0.03,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Latest GPT-4 model with improved performance and efficiency across a wide range of tasks including reasoning, coding, and creative writing.',
    release_date: '2024-01-01'
  }

  const displayModel = model || mockModel

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'anthropic': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'google': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'meta': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="container py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/models">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Models
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{displayModel.name}</h1>
            <div className="flex items-center gap-3 mb-3">
              <Badge 
                variant="outline" 
                className={`${getProviderColor(displayModel.provider)} flex items-center gap-1`}
              >
                <Building className="h-3 w-3" />
                {displayModel.provider}
              </Badge>
              <Badge variant="outline">
                {displayModel.model_type}
              </Badge>
              <Badge variant={displayModel.is_active ? "default" : "secondary"}>
                {displayModel.is_active ? "Active" : "Inactive"}
              </Badge>
              <div className="flex items-center gap-1">
                {displayModel.supports_structured_output ? (
                  <Badge variant="outline" className="text-green-700 bg-green-50 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Structured Output
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    No Structured Output
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl">
              {displayModel.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline">
              <GitCompare className="mr-2 h-4 w-4" />
              Compare
            </Button>
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              Run Test
            </Button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {displayModel.release_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Released {new Date(displayModel.release_date).toLocaleDateString()}
            </div>
          )}
          <div>
            Model ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{displayModel.id}</code>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ModelSpecs model={displayModel} />
            </div>
            <div>
              <ModelPerformance 
                performance={performance} 
                modelId={displayModel.id}
                loading={performanceLoading}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <ModelPerformance 
            performance={performance} 
            modelId={displayModel.id}
            loading={performanceLoading}
            detailed={true}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ModelHistory modelId={displayModel.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
