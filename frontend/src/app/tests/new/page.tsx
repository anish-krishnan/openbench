/**
 * Test submission wizard page
 */

import { TestSubmissionWizard } from '@/components/tests/test-submission-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contribute Test - OpenBench',
  description: 'Submit a new test to help evaluate and improve LLM capabilities',
}

export default function NewTest() {
  return <TestSubmissionWizard />
}
