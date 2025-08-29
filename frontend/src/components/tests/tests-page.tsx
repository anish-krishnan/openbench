/**
 * Tests directory page component
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TestsGrid } from './tests-grid'
import { TestsFilters } from './tests-filters'
import { useTests } from '@/hooks/api'
import { PageLoading } from '@/components/ui/loading'
import { Plus } from 'lucide-react'
import type { TestFilters } from '@/types/api'

export function TestsPage() {
  const [filters, setFilters] = useState<TestFilters>({
    status: 'approved',
    page: 1,
    size: 12,
  })

  const { data: testsResponse, isLoading, error } = useTests(filters)

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to load tests</h2>
            <p className="text-muted-foreground">
              There was an error loading the test directory. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tests = testsResponse?.data || []
  const pagination = testsResponse?.meta?.pagination

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Test Directory</h1>
          <p className="text-muted-foreground text-lg">
            Discover and run community-contributed evaluation tests
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/tests/new">
            <Plus className="mr-2 h-4 w-4" />
            Contribute Test
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TestsFilters 
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
                Showing {((pagination.page - 1) * pagination.size) + 1}-{Math.min(pagination.page * pagination.size, pagination.total)} of {pagination.total} tests
              </>
            ) : (
              `${tests.length} tests found`
            )}
          </p>
        </div>
      </div>

      {/* Tests Grid */}
      <TestsGrid 
        tests={tests}
        pagination={pagination}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
