import { TestEditWizard } from '@/components/tests/test-edit-wizard'
import { Metadata } from 'next'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Edit Test - Open Bench`,
    description: 'Edit an existing test case in the Open Bench evaluation platform',
  }
}

export default function EditTestPage({ params }: PageProps) {
  return <TestEditWizard testId={params.id} />
}
