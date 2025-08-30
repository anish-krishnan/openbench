/**
 * React Query hooks for API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  modelsApi,
  testsApi,
  resultsApi,
  executionsApi,
  benchmarkApi,
  adminApi,
  authApi,
  searchApi,
} from '@/services/api'
import type {
  ModelFilters,
  TestFilters,
  ResultFilters,
  LeaderboardFilters,
  TestCaseCreate,
  ModerationAction,
} from '@/types/api'

// Query keys factory
export const queryKeys = {
  models: {
    all: ['models'] as const,
    lists: () => [...queryKeys.models.all, 'list'] as const,
    list: (filters: ModelFilters) => [...queryKeys.models.lists(), filters] as const,
    details: () => [...queryKeys.models.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.models.details(), id] as const,
    performance: (id: string, filters?: any) => 
      [...queryKeys.models.detail(id), 'performance', filters] as const,
  },
  tests: {
    all: ['tests'] as const,
    lists: () => [...queryKeys.tests.all, 'list'] as const,
    list: (filters: TestFilters) => [...queryKeys.tests.lists(), filters] as const,
    details: () => [...queryKeys.tests.all, 'detail'] as const,
    detail: (id: string, includeResults?: boolean) => 
      [...queryKeys.tests.details(), id, { includeResults }] as const,
    revisions: (id: string) => [...queryKeys.tests.detail(id), 'revisions'] as const,
  },
  results: {
    all: ['results'] as const,
    lists: () => [...queryKeys.results.all, 'list'] as const,
    list: (filters: ResultFilters) => [...queryKeys.results.lists(), filters] as const,
    execution: (executionId: string) => 
      [...queryKeys.results.all, 'execution', executionId] as const,
  },
  executions: {
    all: ['executions'] as const,
    lists: () => [...queryKeys.executions.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.executions.lists(), filters] as const,
    details: () => [...queryKeys.executions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.executions.details(), id] as const,
  },
  benchmark: {
    all: ['benchmark'] as const,
    leaderboard: (filters: LeaderboardFilters) => 
      [...queryKeys.benchmark.all, 'leaderboard', filters] as const,
    compare: (modelIds: string[], category?: string) =>
      [...queryKeys.benchmark.all, 'compare', { modelIds, category }] as const,
    trends: (metric: string, timeframe?: string, category?: string, modelIds?: string[]) =>
      [...queryKeys.benchmark.all, 'trends', { metric, timeframe, category, modelIds }] as const,
    categories: () => [...queryKeys.benchmark.all, 'categories'] as const,
    stats: () => [...queryKeys.benchmark.all, 'stats'] as const,
  },
  admin: {
    all: ['admin'] as const,
    pendingTests: (page: number, size: number) =>
      [...queryKeys.admin.all, 'pendingTests', { page, size }] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    users: (page: number, size: number) =>
      [...queryKeys.admin.all, 'users', { page, size }] as const,
  },
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  search: {
    all: ['search'] as const,
    tests: (query: string, filters?: any) =>
      [...queryKeys.search.all, 'tests', query, filters] as const,
    models: (query: string, filters?: any) =>
      [...queryKeys.search.all, 'models', query, filters] as const,
  },
}

// Model hooks
export const useModels = (filters?: ModelFilters) =>
  useQuery({
    queryKey: queryKeys.models.list(filters || {}),
    queryFn: () => modelsApi.list(filters),
  })

export const useModel = (id: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.models.detail(id),
    queryFn: () => modelsApi.getById(id),
    enabled: enabled && !!id,
  })

export const useModelPerformance = (
  id: string,
  timeframe?: string,
  category?: string,
  enabled = true
) =>
  useQuery({
    queryKey: queryKeys.models.performance(id, { timeframe, category }),
    queryFn: () => modelsApi.getPerformance(id, timeframe, category),
    enabled: enabled && !!id,
  })

// Test hooks
export const useTests = (filters?: TestFilters) =>
  useQuery({
    queryKey: queryKeys.tests.list(filters || {}),
    queryFn: () => testsApi.list(filters),
  })

export const useTest = (id: string, includeResults = false, enabled = true) =>
  useQuery({
    queryKey: queryKeys.tests.detail(id, includeResults),
    queryFn: () => testsApi.getById(id, includeResults),
    enabled: enabled && !!id,
  })

export const useTestRevisions = (id: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.tests.revisions(id),
    queryFn: () => testsApi.getRevisions(id),
    enabled: enabled && !!id,
  })

// Result hooks
export const useResults = (filters?: ResultFilters) =>
  useQuery({
    queryKey: queryKeys.results.list(filters || {}),
    queryFn: () => resultsApi.list(filters),
  })

export const useExecutionResults = (executionId: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.results.execution(executionId),
    queryFn: () => resultsApi.getByExecution(executionId),
    enabled: enabled && !!executionId,
  })

// Execution hooks
export const useExecution = (id: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.executions.detail(id),
    queryFn: () => executionsApi.getById(id),
    enabled: enabled && !!id,
  })

// Benchmark hooks
export const useLeaderboard = (filters?: LeaderboardFilters) =>
  useQuery({
    queryKey: queryKeys.benchmark.leaderboard(filters || {}),
    queryFn: () => benchmarkApi.getLeaderboard(filters),
  })

export const useModelComparison = (modelIds: string[], category?: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.benchmark.compare(modelIds, category),
    queryFn: () => benchmarkApi.compareModels(modelIds, category),
    enabled: enabled && modelIds.length > 1,
  })

export const useTrends = (
  metric: string,
  timeframe?: string,
  category?: string,
  modelIds?: string[],
  enabled = true
) =>
  useQuery({
    queryKey: queryKeys.benchmark.trends(metric, timeframe, category, modelIds),
    queryFn: () => benchmarkApi.getTrends(metric, timeframe, category, modelIds),
    enabled,
  })

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.benchmark.categories(),
    queryFn: () => benchmarkApi.getCategories(),
  })

export const usePlatformStats = () =>
  useQuery({
    queryKey: queryKeys.benchmark.stats(),
    queryFn: () => benchmarkApi.getStats(),
  })

// Admin hooks
export const usePendingTests = (page = 1, size = 20) =>
  useQuery({
    queryKey: queryKeys.admin.pendingTests(page, size),
    queryFn: () => adminApi.getPendingTests(page, size),
  })

export const useAdminStats = () =>
  useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => adminApi.getStats(),
  })

// Auth hooks
export const useProfile = () =>
  useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => authApi.getProfile(),
  })

// Search hooks
export const useSearchTests = (query: string, filters?: any, enabled = true) =>
  useQuery({
    queryKey: queryKeys.search.tests(query, filters),
    queryFn: () => searchApi.tests(query, filters),
    enabled: enabled && query.length > 0,
  })

export const useSearchModels = (query: string, filters?: any, enabled = true) =>
  useQuery({
    queryKey: queryKeys.search.models(query, filters),
    queryFn: () => searchApi.models(query, filters),
    enabled: enabled && query.length > 0,
  })

// Mutation hooks
export const useCreateTest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (testCase: TestCaseCreate) => testsApi.create(testCase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() })
    },
  })
}

export const useUpdateTest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TestCaseCreate> }) =>
      testsApi.update(id, updates),
    onSuccess: (data, variables) => {
      // Invalidate all queries related to this test
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as string[]
          return queryKey[0] === 'tests' && 
                 queryKey[1] === 'detail' && 
                 queryKey[2] === variables.id
        }
      })
      // Also invalidate test lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() })
    },
  })
}

export const useRunTest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ testId, modelIds }: { testId: string; modelIds?: string[] }) =>
      testsApi.run(testId, modelIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(variables.testId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.executions.lists() })
    },
  })
}

export const useModeratePosts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (action: ModerationAction) => adminApi.moderateTests(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() })
    },
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Parameters<typeof authApi.updateProfile>[0]) =>
      authApi.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() })
    },
  })
}
