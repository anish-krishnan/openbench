/**
 * Tests directory page
 */

import { TestsPage } from '@/components/tests/tests-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tests - OpenBench',
  description: 'Browse and discover community-contributed LLM evaluation tests',
}

export default function Tests() {
  return <TestsPage />
}
