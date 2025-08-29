/**
 * Tests filters component
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
import { useCategories } from '@/hooks/api'
import { X, Search } from 'lucide-react'
import type { TestFilters } from '@/types/api'

interface TestsFiltersProps {
  filters: TestFilters
  onChange: (filters: TestFilters) => void
}

export function TestsFilters({ filters, onChange }: TestsFiltersProps) {
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

  const statusOptions = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ]

  const updateFilter = (key: keyof TestFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filtering
    })
  }

  const clearCategory = () => {
    const { category, ...rest } = filters
    onChange({ ...rest, page: 1 })
  }

  const clearSearch = () => {
    const { search, ...rest } = filters
    onChange({ ...rest, page: 1 })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[150px]">
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

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Select
              value={filters.status || 'approved'}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Difficulty:</span>
            <Select
              value={(filters as any).difficulty || 'all'}
              onValueChange={(value) => updateFilter('difficulty' as any, value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Show:</span>
            <Select
              value={String(filters.size || 12)}
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
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
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
