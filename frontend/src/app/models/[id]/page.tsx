/**
 * Model detail page
 */

import { ModelDetailPage } from '@/components/models/model-detail-page'
import type { Metadata } from 'next'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // In a real app, you'd fetch the model data here
  const { id } = await params
  return {
    title: `Model ${id} - OpenBench`,
    description: `Detailed performance metrics and analysis for model ${id}`,
  }
}

export default async function ModelDetail({ params }: PageProps) {
  const { id } = await params
  return <ModelDetailPage modelId={id} />
}
