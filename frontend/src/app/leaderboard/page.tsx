/**
 * Leaderboard page
 */

import { LeaderboardPage } from '@/components/leaderboard/leaderboard-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaderboard - OpenBench',
  description: 'Compare LLM performance across different benchmarks and categories',
}

export default function Leaderboard() {
  return <LeaderboardPage />
}
