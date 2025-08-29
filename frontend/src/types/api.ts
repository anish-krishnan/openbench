/**
 * API types based on backend schemas
 */

// Base types
export interface PaginationMeta {
  page: number
  size: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ResponseMeta {
  pagination?: PaginationMeta
}

export interface ApiResponse<T> {
  data: T
  meta?: ResponseMeta
}

// User types
export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  role: 'viewer' | 'contributor' | 'moderator' | 'admin'
  created_at: string
  updated_at: string
  is_active: boolean
}

// Model types
export interface Model {
  id: string
  name: string
  provider: string
  model_type: string
  context_length: number | null
  max_output_tokens: number | null
  supports_structured_output: boolean
  cost_per_input_token: number | null
  cost_per_output_token: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  description?: string
  release_date?: string
}

export interface ModelPerformance {
  model_id: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  accuracy: number
  avg_latency: number
  avg_cost: number
  category_performance: Record<string, {
    total: number
    passed: number
    accuracy: number
  }>
}

// Test types
export interface TestCase {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  prompt_template: string
  input_schema?: any
  expected_output_schema?: any
  expected_output: any
  evaluation_type: 'exact_match' | 'structured_match' | 'llm_judge'
  evaluation_config?: any
  status: 'pending' | 'approved' | 'rejected'
  visibility: 'public' | 'private'
  created_by: string
  created_at: string
  updated_at: string
  version: number
  is_parameterized: boolean
  max_test_cases?: number
}

export interface TestCaseCreate {
  title: string
  description: string
  category: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  prompt_template: string
  input_schema?: any
  expected_output_schema?: any
  expected_output: any
  evaluation_type: 'exact_match' | 'structured_match' | 'llm_judge'
  evaluation_config?: any
  visibility: 'public' | 'private'
  is_parameterized: boolean
  max_test_cases?: number
}

export interface TestResult {
  id: string
  test_case_id: string
  model_id: string
  execution_id: string
  status: 'queued' | 'running' | 'passed' | 'failed' | 'error'
  score: number
  output: any
  error_message?: string
  metadata: {
    tokens_used: number
    latency_ms: number
    cost: number
  }
  created_at: string
  completed_at?: string
}

// Execution types
export interface Execution {
  id: string
  test_case_id: string
  model_ids: string[]
  status: 'queued' | 'running' | 'completed' | 'failed'
  created_by: string
  created_at: string
  completed_at?: string
  results: TestResult[]
}

// Leaderboard types
export interface LeaderboardEntry {
  model_id: string
  model_name: string
  provider: string
  accuracy: number
  total_tests: number
  avg_latency: number
  avg_cost: number
  rank: number
  category_scores?: Record<string, number>
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  last_updated: string
  filters: {
    category?: string
    timeframe: string
    min_tests: number
  }
}

// Analytics types
export interface TrendData {
  dates: string[]
  metrics: Record<string, number[]>
}

export interface CategoryStats {
  name: string
  total_tests: number
  avg_accuracy: number
  popular_models: string[]
}

// Admin types
export interface PendingTest extends TestCase {
  created_by_username: string
  submission_notes?: string
}

export interface ModerationAction {
  test_ids: string[]
  action: 'approve' | 'reject'
  notes?: string
  feedback?: string
}

// Filter types
export interface ModelFilters {
  provider?: string
  is_active?: boolean
  supports_structured_output?: boolean
  page?: number
  size?: number
}

export interface TestFilters {
  category?: string
  status?: TestCase['status']
  created_by?: string
  search?: string
  tags?: string[]
  page?: number
  size?: number
}

export interface LeaderboardFilters {
  category?: string
  timeframe?: '7d' | '30d' | '90d' | 'all'
  min_tests?: number
  limit?: number
}

export interface ResultFilters {
  test_case_id?: string
  model_id?: string
  status?: TestResult['status']
  page?: number
  size?: number
}
