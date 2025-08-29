/**
 * Admin pending tests page
 */

import { PendingTestsPage } from '@/components/admin/pending-tests-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pending Tests - Admin - OpenBench',
  description: 'Review and moderate pending test submissions',
}

export default function PendingTests() {
  return <PendingTestsPage />
}
