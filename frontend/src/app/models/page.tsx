/**
 * Models catalog page
 */

import { ModelsPage } from '@/components/models/models-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Models - OpenBench',
  description: 'Browse and compare large language models across different providers and capabilities',
}

export default function Models() {
  return <ModelsPage />
}
