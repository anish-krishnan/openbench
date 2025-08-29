/**
 * Models catalog page component
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModelsGrid } from './models-grid'
import { ModelsFilters } from './models-filters'
import { useModels } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import type { ModelFilters } from '@/types/api'

export function ModelsPage() {
  const [filters, setFilters] = useState<ModelFilters>({
    is_active: true,
    page: 1,
    size: 24,
  })

  const { data: modelsResponse, isLoading, error } = useModels(filters)

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to load models</h2>
            <p className="text-muted-foreground">
              There was an error loading the model catalog. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const models = modelsResponse?.data || []
  const pagination = modelsResponse?.meta?.pagination

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Model Catalog</h1>
        <p className="text-muted-foreground text-lg">
          Browse and compare large language models from different providers
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ModelsFilters 
          filters={filters} 
          onChange={setFilters} 
        />
      </div>

      {/* Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination ? (
              <>
                Showing {((pagination.page - 1) * pagination.size) + 1}-{Math.min(pagination.page * pagination.size, pagination.total)} of {pagination.total} models
              </>
            ) : (
              `${models.length} models found`
            )}
          </p>
        </div>
      </div>

      {/* Models Grid */}
      <ModelsGrid 
        models={models}
        pagination={pagination}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
