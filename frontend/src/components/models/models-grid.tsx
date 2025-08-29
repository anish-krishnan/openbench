/**
 * Models grid component
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink,
  Zap,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { Model, PaginationMeta, ModelFilters } from '@/types/api'

interface ModelsGridProps {
  models: Model[]
  pagination?: PaginationMeta
  filters: ModelFilters
  onFiltersChange: (filters: ModelFilters) => void
}

export function ModelsGrid({ models, pagination, filters, onFiltersChange }: ModelsGridProps) {
  // Mock data if no models provided
  const mockModels: Model[] = [
    {
      id: 'gpt-4-turbo',
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
      description: 'Latest GPT-4 model with improved performance and efficiency',
      release_date: '2024-01-01'
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      model_type: 'Chat',
      context_length: 200000,
      max_output_tokens: 4096,
      supports_structured_output: true,
      cost_per_input_token: 0.015,
      cost_per_output_token: 0.075,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      description: 'Most capable Claude model for complex reasoning tasks',
      release_date: '2024-02-01'
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      model_type: 'Chat',
      context_length: 32000,
      max_output_tokens: 8192,
      supports_structured_output: false,
      cost_per_input_token: 0.0005,
      cost_per_output_token: 0.0015,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      description: 'Google\'s multimodal AI model for text and reasoning',
      release_date: '2023-12-01'
    },
  ]

  const displayModels = models.length > 0 ? models : mockModels

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'anthropic': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'google': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'meta': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatContextLength = (length: number | undefined | null) => {
    if (!length || typeof length !== 'number') return 'N/A'
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
    return length.toString()
  }

  const formatCost = (cost: number | undefined | null) => {
    if (!cost || typeof cost !== 'number') return 'N/A'
    return `$${cost.toFixed(4)}`
  }

  const handlePageChange = (page: number) => {
    onFiltersChange({
      ...filters,
      page
    })
  }

  return (
    <div className="space-y-6">
      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayModels.map((model) => (
          <Card key={model.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link 
                      href={`/models/${model.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {model.name}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={getProviderColor(model.provider)}
                    >
                      {model.provider}
                    </Badge>
                    <Badge variant="outline">
                      {model.model_type}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {model.description || 'No description available'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {model.supports_structured_output ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Context:</span>
                  <span className="font-medium">{formatContextLength(model.context_length)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-muted-foreground">Output:</span>
                  <span className="font-medium">{formatContextLength(model.max_output_tokens)}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Input:</span>
                  </div>
                  <span className="font-medium font-mono">
                    {formatCost(model.cost_per_input_token)}/1K
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="text-muted-foreground">Output:</span>
                  </div>
                  <span className="font-medium font-mono">
                    {formatCost(model.cost_per_output_token)}/1K
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/models/${model.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/compare?models=${model.id}`}>
                    Compare
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
