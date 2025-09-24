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

  // 轮询任务状态 - 优化错误处理和缓存
  const pollTaskStatus = useCallback(async (jobId: string): Promise<TaskStatus | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(`/api/backend-proxy/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 404 可能表示任务不存在，这是正常情况
        if (response.status === 404) {
          log.warn(`Task ${jobId} not found (404), may have expired`);
          return null;
        }
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

      // 更新缓存，但只缓存最近30分钟的任务
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const taskTime = new Date(data.meta?.created_at || 0).getTime();

      if (taskTime > thirtyMinutesAgo) {
        taskStatusCache.current.set(jobId, taskStatus);
      }

      return taskStatus;
    } catch (error) {
      // 处理不同类型的错误
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          log.warn(`Polling timeout for task ${jobId}`);
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          log.warn(`Network error polling task ${jobId}: ${error.message}`);
        } else {
          log.error(`Error polling task status for ${jobId}:`, error);
        }
      } else {
        log.error('Unknown error polling task status:', error);
      }
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

  // 停止轮询
  const stopPolling = useCallback((jobId: string) => {
    const interval = pollingIntervals.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingIntervals.current.delete(jobId);
      log.info(`⏹️ Stopped polling for task: ${jobId}`);
    }
  }, []);

  // 开始轮询
  const startPolling = useCallback((jobId: string) => {
    if (!enablePollingFallback) return;

    // 如果已经在轮询，先停止
    stopPolling(jobId);

    let pollCount = 0;
    const maxPolls = 120; // 最多轮询4分钟 (120 * 2s = 240s)

    const interval = setInterval(async () => {
      pollCount++;

      // 检查是否超过最大轮询次数
      if (pollCount > maxPolls) {
        log.warn(`⏰ Polling timeout for task ${jobId}, stopping after ${maxPolls} attempts`);
        stopPolling(jobId);
        return;
      }

      const taskStatus = await pollTaskStatus(jobId);
      if (taskStatus) {
        handleTaskUpdate(taskStatus);

        // 任务完成或失败时停止轮询
        if (['completed', 'failed', 'canceled'].includes(taskStatus.status)) {
          stopPolling(jobId);
          log.info(`✅ Polling completed for task ${jobId} after ${pollCount} attempts`);
        }
      } else {
        // 轮询失败，可能是网络问题，但继续尝试
        log.warn(`⚠️ Polling failed for task ${jobId}, attempt ${pollCount}/${maxPolls}`);
      }
    }, pollingInterval);

    pollingIntervals.current.set(jobId, interval);
    log.info(`🔄 Started polling for task: ${jobId} (max ${maxPolls} attempts)`);
  }, [enablePollingFallback, pollingInterval, pollTaskStatus, handleTaskUpdate, stopPolling]);

  // 建立SSE连接
  const establishSSEConnection = useCallback(() => {
    if (sseConnection?.readyState === EventSource.OPEN) {
      log.info('🔗 SSE connection already open, skipping');
      return; // 已连接
    }

    // 如果存在连接正在尝试连接，不要创建新的
    if (sseConnection?.readyState === EventSource.CONNECTING) {
      log.info('🔗 SSE connection already connecting, waiting');
      return;
    }

    log.info('🔗 Establishing SSE connection...', {
      endpoint: sseEndpoint,
      currentState: sseConnection?.readyState,
      activeTasks: activeTasks.size,
      reconnectAttempts: reconnectAttempts.current
    });

    // 清理旧连接和定时器
    if (sseConnection) {
      sseConnection.close();
    }
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
      log.error('❌ SSE connection error:', {
        error,
        readyState: eventSource.readyState,
        activeTasks: activeTasks.size,
        reconnectAttempts: reconnectAttempts.current
      });

      setIsConnected(false);
      setConnectionError('Connection error');
      callbacks.onConnectionError?.(error);

      // 只有在有活跃任务时才尝试重连
      if (activeTasks.size > 0 && reconnectAttempts.current < maxReconnects) {
        reconnectAttempts.current++;
        const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts.current - 1), 30000); // 最大30秒

        log.info(`🔄 Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnects})`);

        reconnectTimeout.current = setTimeout(() => {
          // 双重检查：确保连接已关闭且仍有活跃任务
          if (eventSource.readyState === EventSource.CLOSED && activeTasks.size > 0) {
            establishSSEConnection();
          } else if (activeTasks.size === 0) {
            log.info('🔗 No active tasks, skipping reconnection');
            reconnectAttempts.current = 0; // 重置重连次数
          }
        }, delay);
      } else if (activeTasks.size > 0) {
        log.error('❌ Max reconnection attempts reached, falling back to polling only');
        reconnectAttempts.current = 0; // 重置以便后续任务可以重新尝试SSE

        // 对所有活跃任务启用轮询
        activeTasks.forEach(jobId => {
          startPolling(jobId);
        });
      } else {
        log.info('🔗 No active tasks, not attempting reconnection');
        reconnectAttempts.current = 0; // 重置重连次数
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
    if (!sseConnection) {
      // 如果有活跃任务但没有连接，尝试建立连接
      if (activeTasks.size > 0) {
        log.info('🔄 No SSE connection but has active tasks, attempting to establish');
        establishSSEConnection();
      }
      return;
    }

    const readyState = sseConnection.readyState;

    if (readyState === EventSource.OPEN) {
      // 连接正常
      setIsConnected(true);
      setConnectionError(null);
      // 重置重连计数
      if (reconnectAttempts.current > 0) {
        reconnectAttempts.current = 0;
        log.info('🔗 Connection health restored, reset reconnect attempts');
      }
    } else if (readyState === EventSource.CLOSED) {
      // 连接已关闭
      setIsConnected(false);
      setConnectionError('Connection closed');

      // 如果有活跃任务且还未达到最大重连次数，尝试重连
      if (activeTasks.size > 0 && reconnectAttempts.current < maxReconnects) {
        log.info('🔄 Connection closed with active tasks, attempting reconnection');
        establishSSEConnection();
      } else if (activeTasks.size > 0 && reconnectAttempts.current >= maxReconnects) {
        log.warn('❌ Connection closed but max reconnects reached, using polling only');
        // 确保所有活跃任务都有轮询
        activeTasks.forEach(jobId => {
          if (!pollingIntervals.current.has(jobId)) {
            startPolling(jobId);
          }
        });
      }
    } else if (readyState === EventSource.CONNECTING) {
      // 连接中，等待
      setIsConnected(false);
      setConnectionError('Connecting...');
    }
  }, [sseConnection, activeTasks.size, establishSSEConnection, maxReconnects, reconnectAttempts, startPolling]);

  // 定期检查连接健康状态 - 优化检查频率
  useEffect(() => {
    // 有活跃任务时更频繁检查，无任务时降低频率
    const checkInterval = activeTasks.size > 0 ? 15000 : 60000; // 15s vs 60s

    const healthCheckInterval = setInterval(checkConnectionHealth, checkInterval);
    return () => clearInterval(healthCheckInterval);
  }, [checkConnectionHealth, activeTasks.size]);

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
