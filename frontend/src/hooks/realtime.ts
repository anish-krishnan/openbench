/**
 * Realtime hooks for live updates
 */

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, REALTIME_CHANNELS, REALTIME_EVENTS, type RealtimeChannelType, type RealtimeEventType } from '@/lib/supabase'
import { queryKeys } from './api'

// Generic realtime hook
export function useRealtimeChannel(
  channelName: RealtimeChannelType,
  eventType: RealtimeEventType,
  callback: (payload: any) => void,
  enabled = true
) {
  useEffect(() => {
    if (!supabase || !enabled) return

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: eventType }, callback)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, eventType, callback, enabled])
}

// Job status updates
export function useJobStatusUpdates(enabled = true) {
  const queryClient = useQueryClient()

  const handleJobUpdate = useCallback((payload: any) => {
    const { job_id, status, model_id, test_id, result } = payload.payload

    // Invalidate relevant queries
    if (test_id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(test_id) })
    }
    
    if (model_id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.models.detail(model_id) })
    }

    // Update execution queries
    queryClient.invalidateQueries({ queryKey: queryKeys.executions.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.results.all })

    // Show toast notification for completed jobs
    if (status === 'completed' || status === 'failed') {
      // You can add toast notifications here
      console.log(`Job ${job_id} ${status}`, result)
    }
  }, [queryClient])

  useRealtimeChannel(
    REALTIME_CHANNELS.JOBS,
    REALTIME_EVENTS.JOB_STATUS_CHANGED,
    handleJobUpdate,
    enabled
  )
}

// Test result updates
export function useTestResultUpdates(testId?: string, enabled = true) {
  const queryClient = useQueryClient()

  const handleResultUpdate = useCallback((payload: any) => {
    const { test_id, model_id, execution_id, result } = payload.payload

    // Only handle updates for the specific test if testId is provided
    if (testId && test_id !== testId) return

    // Invalidate result queries
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.results.list({ test_case_id: test_id })
    })

    if (execution_id) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.results.execution(execution_id)
      })
    }

    // Update test detail
    if (test_id) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.detail(test_id)
      })
    }
  }, [queryClient, testId])

  useRealtimeChannel(
    REALTIME_CHANNELS.RESULTS,
    REALTIME_EVENTS.RESULT_UPDATED,
    handleResultUpdate,
    enabled
  )
}

// Test moderation updates
export function useTestModerationUpdates(enabled = true) {
  const queryClient = useQueryClient()

  const handleTestApproved = useCallback((payload: any) => {
    const { test_id } = payload.payload

    // Invalidate test lists and admin queries
    queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
    
    if (test_id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(test_id) })
    }
  }, [queryClient])

  const handleTestRejected = useCallback((payload: any) => {
    const { test_id } = payload.payload

    // Invalidate admin queries
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
    
    if (test_id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(test_id) })
    }
  }, [queryClient])

  useRealtimeChannel(
    REALTIME_CHANNELS.TESTS,
    REALTIME_EVENTS.TEST_APPROVED,
    handleTestApproved,
    enabled
  )

  useRealtimeChannel(
    REALTIME_CHANNELS.TESTS,
    REALTIME_EVENTS.TEST_REJECTED,
    handleTestRejected,
    enabled
  )
}

// Model status updates
export function useModelStatusUpdates(enabled = true) {
  const queryClient = useQueryClient()

  const handleModelStatusChange = useCallback((payload: any) => {
    const { model_id, status } = payload.payload

    // Invalidate model queries
    queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() })
    
    if (model_id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.models.detail(model_id) })
    }
  }, [queryClient])

  useRealtimeChannel(
    REALTIME_CHANNELS.MODELS,
    REALTIME_EVENTS.MODEL_STATUS_CHANGED,
    handleModelStatusChange,
    enabled
  )
}

// Connection status
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setConnectionError('Supabase not configured')
      return
    }

    const channel = supabase.channel('connection-test')

    channel
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true)
        setConnectionError(null)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionError('Connection failed')
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setConnectionError('Connection timed out')
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setConnectionError(null)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { isConnected, connectionError }
}

// Broadcast functions for sending realtime updates
export const realtimeBroadcast = {
  jobStatusChanged: (jobId: string, status: string, modelId?: string, testId?: string, result?: any) => {
    if (!supabase) return
    
    supabase
      .channel(REALTIME_CHANNELS.JOBS)
      .send({
        type: 'broadcast',
        event: REALTIME_EVENTS.JOB_STATUS_CHANGED,
        payload: { job_id: jobId, status, model_id: modelId, test_id: testId, result }
      })
  },

  resultUpdated: (testId: string, modelId: string, executionId: string, result: any) => {
    if (!supabase) return
    
    supabase
      .channel(REALTIME_CHANNELS.RESULTS)
      .send({
        type: 'broadcast',
        event: REALTIME_EVENTS.RESULT_UPDATED,
        payload: { test_id: testId, model_id: modelId, execution_id: executionId, result }
      })
  },

  testApproved: (testId: string) => {
    if (!supabase) return
    
    supabase
      .channel(REALTIME_CHANNELS.TESTS)
      .send({
        type: 'broadcast',
        event: REALTIME_EVENTS.TEST_APPROVED,
        payload: { test_id: testId }
      })
  },

  testRejected: (testId: string, reason?: string) => {
    if (!supabase) return
    
    supabase
      .channel(REALTIME_CHANNELS.TESTS)
      .send({
        type: 'broadcast',
        event: REALTIME_EVENTS.TEST_REJECTED,
        payload: { test_id: testId, reason }
      })
  },

  modelStatusChanged: (modelId: string, status: string) => {
    if (!supabase) return
    
    supabase
      .channel(REALTIME_CHANNELS.MODELS)
      .send({
        type: 'broadcast',
        event: REALTIME_EVENTS.MODEL_STATUS_CHANGED,
        payload: { model_id: modelId, status }
      })
  }
}
