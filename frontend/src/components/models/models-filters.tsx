/**
 * Models filters component
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Search } from 'lucide-react'
import type { ModelFilters } from '@/types/api'

interface ModelsFiltersProps {
  filters: ModelFilters
  onChange: (filters: ModelFilters) => void
}

export function ModelsFilters({ filters, onChange }: ModelsFiltersProps) {
  const providers = [
    'OpenAI',
    'Anthropic', 
    'Google',
    'Meta',
    'Mistral',
    'Cohere',
    'Together'
  ]

  const updateFilter = (key: keyof ModelFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filtering
    })
  }

  const clearProvider = () => {
    const { provider, ...rest } = filters
    onChange({ ...rest, page: 1 })
  }

  const toggleStructuredOutput = () => {
    updateFilter('supports_structured_output', 
      filters.supports_structured_output === true ? undefined : true
    )
  }

  const toggleActiveOnly = () => {
    updateFilter('is_active', 
      filters.is_active === true ? undefined : true
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={(filters as any).search || ''}
              onChange={(e) => updateFilter('search' as any, e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Provider:</span>
            <Select
              value={filters.provider || 'all'}
              onValueChange={(value) => updateFilter('provider', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="structured-output"
                checked={filters.supports_structured_output === true}
                onCheckedChange={toggleStructuredOutput}
              />
              <label
                htmlFor="structured-output"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Structured Output
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-only"
                checked={filters.is_active === true}
                onCheckedChange={toggleActiveOnly}
              />
              <label
                htmlFor="active-only"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active Only
              </label>
            </div>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Show:</span>
            <Select
              value={String(filters.size || 24)}
              onValueChange={(value) => updateFilter('size', parseInt(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex items-center gap-2 ml-auto">
            {filters.provider && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.provider}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={clearProvider}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.supports_structured_output && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Structured Output
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => updateFilter('supports_structured_output', undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
