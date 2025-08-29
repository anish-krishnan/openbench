/**
 * Admin dashboard page
 */

import { AdminDashboard } from '@/components/admin/admin-dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - OpenBench',
  description: 'Administrative dashboard for managing OpenBench platform',
}

export default function Admin() {
  return <AdminDashboard />
}
