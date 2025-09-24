"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { log } from "@/libs/logger";

export interface TaskStatus {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  taskType: 'diffusion' | 'upscale';
  progress?: number;
  message?: string;
  output?: any;
  error?: {
    code: number;
    message: string;
    raw_message?: string;
  };
  createdAt?: string;
  completedAt?: string;
}

export interface TaskManagerConfig {
  sseEndpoint: string;
  pollingInterval?: number; // 轮询间隔，默认2秒
  maxReconnects?: number; // 最大重连次数，默认3次
  reconnectDelay?: number; // 重连延迟，默认1秒
  enablePollingFallback?: boolean; // 是否启用轮询备用，默认true
}

export interface TaskManagerCallbacks {
  onTaskUpdate?: (task: TaskStatus) => void;
  onTaskCompleted?: (task: TaskStatus) => void;
  onTaskFailed?: (task: TaskStatus) => void;
  onConnectionError?: (error: Event) => void;
  onConnectionRestored?: () => void;
}

/**
 * 可复用的任务管理器Hook
 * 提供按需SSE连接、轮询备用、智能重连等功能
 */
export function useTaskManager(
  config: TaskManagerConfig,
  callbacks: TaskManagerCallbacks = {}
) {
  const {
    sseEndpoint,
    pollingInterval = 2000,
    maxReconnects = 3,
    reconnectDelay = 1000,
    enablePollingFallback = true
  } = config;

  // 状态管理
  const [activeTasks, setActiveTasks] = useState<Set<string>>(new Set());
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 引用管理
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const taskStatusCache = useRef<Map<string, TaskStatus>>(new Map());
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    // 清理轮询
    pollingIntervals.current.forEach((interval) => {
      clearInterval(interval);
    });
    pollingIntervals.current.clear();

    // 清理重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    // 清理连接超时定时器
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = null;
    }

    // 关闭SSE连接
    if (sseConnection) {
      sseConnection.close();
      setSseConnection(null);
    }

    setIsConnected(false);
    setConnectionError(null);
  }, [sseConnection]);

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (jobId: string): Promise<TaskStatus | null> => {
    try {
      const response = await fetch(`/api/backend-proxy/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const taskStatus: TaskStatus = {
        jobId: data.job_id,
        status: data.status,
        taskType: data.task_type,
        progress: data.progress,
        message: data.message,
        output: data.output,
        error: data.error?.code > 0 ? data.error : undefined,
        createdAt: data.meta?.created_at,
        completedAt: data.meta?.ended_at,
      };

      // 更新缓存
      taskStatusCache.current.set(jobId, taskStatus);
      
      return taskStatus;
    } catch (error) {
      log.error('Error polling task status:', error);
      return null;
    }
  }, []);

  // 处理任务更新
  const handleTaskUpdate = useCallback((task: TaskStatus) => {
    // 更新缓存
    taskStatusCache.current.set(task.jobId, task);
    
    // 调用回调
    callbacks.onTaskUpdate?.(task);
    
    // 根据状态调用特定回调
    if (task.status === 'completed') {
      callbacks.onTaskCompleted?.(task);
    } else if (task.status === 'failed') {
      callbacks.onTaskFailed?.(task);
    }
  }, [callbacks]);

  // 开始轮询
  const startPolling = useCallback((jobId: string) => {
    if (!enablePollingFallback) return;
    
    // 如果已经在轮询，先停止
    stopPolling(jobId);
    
    const interval = setInterval(async () => {
      const taskStatus = await pollTaskStatus(jobId);
      if (taskStatus) {
        handleTaskUpdate(taskStatus);
        
        // 任务完成或失败时停止轮询
        if (['completed', 'failed', 'canceled'].includes(taskStatus.status)) {
          stopPolling(jobId);
        }
      }
    }, pollingInterval);
    
    pollingIntervals.current.set(jobId, interval);
    log.info(`🔄 Started polling for task: ${jobId}`);
  }, [enablePollingFallback, pollingInterval, pollTaskStatus, handleTaskUpdate]);

  // 停止轮询
  const stopPolling = useCallback((jobId: string) => {
    const interval = pollingIntervals.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingIntervals.current.delete(jobId);
      log.info(`⏹️ Stopped polling for task: ${jobId}`);
    }
  }, []);

  // 建立SSE连接
  const establishSSEConnection = useCallback(() => {
    if (sseConnection?.readyState === EventSource.OPEN) {
      log.info('🔗 SSE connection already open, skipping');
      return; // 已连接
    }

    log.info('🔗 Establishing SSE connection...', {
      endpoint: sseEndpoint,
      currentState: sseConnection?.readyState,
      activeTasks: activeTasks.size
    });

    // 清理旧的连接超时定时器
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = null;
    }

    const eventSource = new EventSource(sseEndpoint);
    setSseConnection(eventSource);

    // 设置280秒超时，主动断开连接避免Vercel 300秒限制
    connectionTimeout.current = setTimeout(() => {
      log.warn('⏰ SSE connection approaching 280s timeout, proactive disconnect');
      if (eventSource.readyState === EventSource.OPEN) {
        eventSource.close();
        setSseConnection(null);
        setIsConnected(false);
        setConnectionError('Connection timeout');
      }
    }, 280000);

    eventSource.onopen = () => {
      log.info('✅ SSE connection established', {
        endpoint: sseEndpoint,
        activeTasks: activeTasks.size
      });
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      callbacks.onConnectionRestored?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle heartbeat pings
        if (data.type === 'ping') {
          log.debug('💓 Received heartbeat ping');
          return;
        }
        
        if (data.type === 'task_completed' || data.type === 'task_failed' || data.type === 'task_progress') {
          const taskStatus: TaskStatus = {
            jobId: data.job_id,
            status: data.type === 'task_completed' ? 'completed' : 
                   data.type === 'task_failed' ? 'failed' : 
                   data.status || 'running',
            taskType: data.task_type,
            progress: data.progress,
            message: data.message,
            output: data.output,
            error: data.error,
            createdAt: data.created_at,
            completedAt: data.completed_at,
          };
          
          handleTaskUpdate(taskStatus);
        }
      } catch (error) {
        log.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      log.error('❌ SSE connection error:', error);
      setIsConnected(false);
      setConnectionError('Connection error');
      callbacks.onConnectionError?.(error);
      
      // 自动重连
      if (reconnectAttempts.current < maxReconnects) {
        reconnectAttempts.current++;
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current - 1);
        
        log.info(`🔄 Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnects})`);
        
        reconnectTimeout.current = setTimeout(() => {
          if (eventSource.readyState === EventSource.CLOSED) {
            establishSSEConnection();
          }
        }, delay);
      } else {
        log.error('❌ Max reconnection attempts reached, falling back to polling');
        // 切换到轮询模式
        activeTasks.forEach(jobId => {
          startPolling(jobId);
        });
      }
    };
  }, [sseEndpoint, sseConnection, maxReconnects, reconnectDelay, callbacks, handleTaskUpdate, activeTasks, startPolling]);

  // 关闭SSE连接
  const closeSSEConnection = useCallback(() => {
    if (sseConnection) {
      log.info('🔌 Closing SSE connection', {
        currentState: sseConnection.readyState,
        activeTasks: activeTasks.size
      });
      sseConnection.close();
      setSseConnection(null);
      setIsConnected(false);
    } else {
      log.info('🔌 No SSE connection to close');
    }

    // 清理连接超时定时器
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = null;
    }
  }, [sseConnection, activeTasks.size]);

  // 开始任务
  const startTask = useCallback((jobId: string, taskType: 'diffusion' | 'upscale') => {
    log.info(`🚀 Starting task: ${jobId} (${taskType})`, {
      currentConnectionState: sseConnection?.readyState,
      currentActiveTasks: activeTasks.size
    });
    
    // 添加到活跃任务列表
    setActiveTasks(prev => {
      const newSet = new Set(prev).add(jobId);
      log.info(`📊 Active tasks after adding: ${newSet.size} (was ${prev.size})`);
      return newSet;
    });
    
    // 建立SSE连接（如果还没有）
    if (!sseConnection || sseConnection.readyState !== EventSource.OPEN) {
      log.info('🔗 SSE connection not available, establishing new connection');
      establishSSEConnection();
    } else {
      log.info('🔗 SSE connection already available, reusing existing connection');
    }
    
    // 同时启动轮询作为备用
    if (enablePollingFallback) {
      startPolling(jobId);
    }
  }, [sseConnection, activeTasks.size, establishSSEConnection, enablePollingFallback, startPolling]);

  // 结束任务
  const endTask = useCallback((jobId: string) => {
    log.info(`🏁 Ending task: ${jobId}`);

    // 停止轮询
    stopPolling(jobId);

    // 清理任务缓存
    taskStatusCache.current.delete(jobId);

    // 从活跃任务列表移除
    setActiveTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      const newSize = newSet.size;

      log.info(`📊 Active tasks after removal: ${newSize} (was ${prev.size})`);

      // 如果没有活跃任务，立即关闭SSE连接
      if (newSize === 0) {
        log.info('🔌 No active tasks remaining, closing SSE connection immediately');
        closeSSEConnection();
      }

      return newSet;
    });
  }, [stopPolling, closeSSEConnection]);

  // 连接健康检查
  const checkConnectionHealth = useCallback(() => {
    if (sseConnection && sseConnection.readyState === EventSource.OPEN) {
      // 连接正常
      setIsConnected(true);
      setConnectionError(null);
    } else if (sseConnection && sseConnection.readyState === EventSource.CLOSED) {
      // 连接已关闭
      setIsConnected(false);
      setConnectionError('Connection closed');
      
      // 如果有活跃任务，尝试重连
      if (activeTasks.size > 0) {
        log.info('🔄 Connection closed with active tasks, attempting reconnection');
        establishSSEConnection();
      }
    }
  }, [sseConnection, activeTasks.size, establishSSEConnection]);

  // 定期检查连接健康状态
  useEffect(() => {
    const healthCheckInterval = setInterval(checkConnectionHealth, 30000); // 每30秒检查一次
    return () => clearInterval(healthCheckInterval);
  }, [checkConnectionHealth]);

  // 获取任务状态
  const getTaskStatus = useCallback((jobId: string): TaskStatus | undefined => {
    return taskStatusCache.current.get(jobId);
  }, []);

  // 获取所有活跃任务
  const getActiveTasks = useCallback((): string[] => {
    return Array.from(activeTasks);
  }, [activeTasks]);

  // 清理所有任务
  const clearAllTasks = useCallback(() => {
    log.info('🧹 Clearing all tasks');
    activeTasks.forEach(jobId => {
      stopPolling(jobId);
    });
    setActiveTasks(new Set());
    closeSSEConnection();
  }, [activeTasks, stopPolling, closeSSEConnection]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // 状态
    isConnected,
    connectionError,
    activeTasks: getActiveTasks(),
    
    // 方法
    startTask,
    endTask,
    getTaskStatus,
    clearAllTasks,
    
    // 手动控制
    establishSSEConnection,
    closeSSEConnection,
    startPolling,
    stopPolling,
  };
}
