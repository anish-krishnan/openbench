/**
 * Leaderboard filters component
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/api'
import { X } from 'lucide-react'
import type { LeaderboardFilters as FilterType } from '@/types/api'

interface LeaderboardFiltersProps {
  filters: FilterType
  onChange: (filters: FilterType) => void
}

export function LeaderboardFilters({ filters, onChange }: LeaderboardFiltersProps) {
  const { data: categoriesResponse } = useCategories()
  
  // Mock categories if no data
  const mockCategories = [
    { name: 'Mathematics', total_tests: 156 },
    { name: 'Programming', total_tests: 243 },
    { name: 'Language', total_tests: 189 },
    { name: 'Reasoning', total_tests: 134 },
    { name: 'Science', total_tests: 98 },
    { name: 'Creative', total_tests: 76 }
  ]
  
  const categories = categoriesResponse?.data || mockCategories

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ]

  const minTestsOptions = [
    { value: 1, label: '1+ tests' },
    { value: 5, label: '5+ tests' },
    { value: 10, label: '10+ tests' },
    { value: 25, label: '25+ tests' },
    { value: 50, label: '50+ tests' }
  ]

  const updateFilter = (key: keyof FilterType, value: any) => {
    onChange({
      ...filters,
      [key]: value
    })
  }

  const clearCategory = () => {
    const { category, ...rest } = filters
    onChange(rest)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name} ({category.total_tests})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Period:</span>
            <Select
              value={filters.timeframe || '30d'}
              onValueChange={(value) => updateFilter('timeframe', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min Tests Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Min Tests:</span>
            <Select
              value={String(filters.min_tests || 10)}
              onValueChange={(value) => updateFilter('min_tests', parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minTestsOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limit Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Show:</span>
            <Select
              value={String(filters.limit || 50)}
              onValueChange={(value) => updateFilter('limit', parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex items-center gap-2 ml-auto">
            {filters.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.category}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={clearCategory}
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
