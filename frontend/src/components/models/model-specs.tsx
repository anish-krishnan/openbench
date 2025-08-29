/**
 * Model specifications component
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Clock, 
  DollarSign,
  MessageSquare,
  Database,
  Settings
} from 'lucide-react'
import type { Model } from '@/types/api'

interface ModelSpecsProps {
  model: Model
}

export function ModelSpecs({ model }: ModelSpecsProps) {
  const formatContextLength = (length: number | null | undefined) => {
    if (!length || typeof length !== 'number') return 'N/A'
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M tokens`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K tokens`
    return `${length} tokens`
  }

  const formatCost = (cost: number | null | undefined) => {
    if (!cost || typeof cost !== 'number') return 'N/A'
    return `$${cost.toFixed(4)} per 1K tokens`
  }

  const specs = [
    {
      icon: MessageSquare,
      label: 'Model Type',
      value: model.model_type,
      description: 'Primary use case and interface type'
    },
    {
      icon: Zap,
      label: 'Context Length',
      value: formatContextLength(model.context_length),
      description: 'Maximum input context window'
    },
    {
      icon: Clock,
      label: 'Max Output',
      value: formatContextLength(model.max_output_tokens),
      description: 'Maximum tokens in response'
    },
    {
      icon: DollarSign,
      label: 'Input Cost',
      value: formatCost(model.cost_per_input_token),
      description: 'Cost for processing input tokens',
      color: 'text-green-600'
    },
    {
      icon: DollarSign,
      label: 'Output Cost',
      value: formatCost(model.cost_per_output_token),
      description: 'Cost for generating output tokens',
      color: 'text-orange-600'
    },
    {
      icon: Settings,
      label: 'Structured Output',
      value: model.supports_structured_output ? 'Supported' : 'Not Supported',
      description: 'Can generate structured JSON responses',
      badge: model.supports_structured_output ? 'success' : 'secondary'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Model Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {specs.map((spec, index) => {
            const Icon = spec.icon
            return (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-background ${spec.color || 'text-primary'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{spec.label}</span>
                    {spec.badge && (
                      <Badge 
                        variant={spec.badge === 'success' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {spec.value}
                      </Badge>
                    )}
                  </div>
                  {!spec.badge && (
                    <div className="font-semibold text-lg mb-1">
                      {spec.value}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {spec.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold mb-3">Additional Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <div className="font-medium">
                {new Date(model.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <div className="font-medium">
                {new Date(model.updated_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="font-medium">
                <Badge variant={model.is_active ? "default" : "secondary"}>
                  {model.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Provider:</span>
              <div className="font-medium">{model.provider}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
