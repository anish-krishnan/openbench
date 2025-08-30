/**
 * API service functions
 */

import { apiClient } from '@/lib/api'
import type {
  Model,
  ModelPerformance,
  ModelFilters,
  TestCase,
  TestCaseCreate,
  TestFilters,
  TestResult,
  ResultFilters,
  Execution,
  ExecutionCreate,
  LeaderboardData,
  LeaderboardFilters,
  TrendData,
  CategoryStats,
  PendingTest,
  ModerationAction,
  User,
  ApiResponse,
} from '@/types/api'

// Models API
export const modelsApi = {
  list: (filters?: ModelFilters) =>
    apiClient.get<Model[]>('/models', filters),

  getById: (id: string) =>
    apiClient.get<Model>(`/models/${id}`),

  getPerformance: (id: string, timeframe?: string, category?: string) =>
    apiClient.get<ModelPerformance>(`/models/${id}/performance`, {
      timeframe,
      category,
    }),

  register: (model: Omit<Model, 'id' | 'created_at' | 'updated_at'>) =>
    apiClient.post<Model>('/models/register', model),
}

// Tests API
export const testsApi = {
  list: (filters?: TestFilters) =>
    apiClient.get<TestCase[]>('/tests', filters),

  getById: (id: string, includeResults = false) =>
    apiClient.get<TestCase>(`/tests/${id}`, { include_results: includeResults }),

  create: (testCase: TestCaseCreate) =>
    apiClient.post<TestCase>('/tests', testCase),

  update: (id: string, updates: Partial<TestCaseCreate>) =>
    apiClient.put<TestCase>(`/tests/${id}`, updates),

  run: (id: string, modelIds?: string[]) =>
    apiClient.post<Execution>(`/tests/${id}/run`, { model_ids: modelIds }),

  getRevisions: (id: string) =>
    apiClient.get<TestCase[]>(`/tests/${id}/revisions`),

  createRevision: (id: string, revision: TestCaseCreate) =>
    apiClient.post<TestCase>(`/tests/${id}/revisions`, revision),
}

// Results API
export const resultsApi = {
  list: (filters?: ResultFilters) =>
    apiClient.get<TestResult[]>('/results', filters),

  getByExecution: (executionId: string) =>
    apiClient.get<TestResult[]>(`/results/execution/${executionId}`),
}

// Executions API
export const executionsApi = {
  create: (execution: ExecutionCreate) =>
    apiClient.post<Execution>('/executions', execution),

  getById: (id: string) =>
    apiClient.get<Execution>(`/executions/${id}`),

  list: (filters?: { test_case_id?: string; created_by?: string; status?: string }) =>
    apiClient.get<Execution[]>('/executions', filters),
}

// Benchmark/Leaderboard API
export const benchmarkApi = {
  getLeaderboard: (filters?: LeaderboardFilters) =>
    apiClient.get<LeaderboardData>('/leaderboard', filters),

  compareModels: (modelIds: string[], category?: string) =>
    apiClient.get<any>('/compare', { model_ids: modelIds, category }),

  getTrends: (metric: string, timeframe?: string, category?: string, modelIds?: string[]) =>
    apiClient.get<TrendData>('/analytics/trends', {
      metric,
      timeframe,
      category,
      model_ids: modelIds,
    }),

  getCategories: () =>
    apiClient.get<CategoryStats[]>('/categories'),

  getStats: () =>
    apiClient.get<any>('/stats'),
}

// Admin API
export const adminApi = {
  getPendingTests: (page = 1, size = 20) =>
    apiClient.get<PendingTest[]>('/admin/pending', { page, size }),

  moderateTests: (action: ModerationAction) =>
    apiClient.post<any>('/admin/moderate', action),

  getStats: () =>
    apiClient.get<any>('/admin/stats'),

  getUsers: (page = 1, size = 50) =>
    apiClient.get<User[]>('/admin/users', { page, size }),

  updateUserRole: (userId: string, role: User['role']) =>
    apiClient.patch<User>(`/admin/users/${userId}`, { role }),
}

// Auth API
export const authApi = {
  getProfile: () =>
    apiClient.get<User>('/me'),

  updateProfile: (updates: Partial<User>) =>
    apiClient.patch<User>('/me', updates),
}

// Search API
export const searchApi = {
  tests: (query: string, filters?: Omit<TestFilters, 'search'>) =>
    apiClient.get<TestCase[]>('/tests', { search: query, ...filters }),

  models: (query: string, filters?: Omit<ModelFilters, 'search'>) =>
    apiClient.get<Model[]>('/models', { search: query, ...filters }),
}
