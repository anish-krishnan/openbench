/**
 * Test detail page
 */

import { TestDetailPage } from '@/components/tests/test-detail-page'
import type { Metadata } from 'next'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // In a real app, you'd fetch the test data here
  const { id } = await params
  return {
    title: `Test ${id} - OpenBench`,
    description: `Detailed information and results for test ${id}`,
  }
}

export default async function TestDetail({ params }: PageProps) {
  const { id } = await params
  return <TestDetailPage testId={id} />
}
