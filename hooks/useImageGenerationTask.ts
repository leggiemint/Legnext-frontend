"use client";

import { useState, useCallback, useRef } from "react";
import { useTaskManager, TaskStatus } from "./useTaskManager";
import { log } from "@/libs/logger";

export interface ImageGenerationTask {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  taskType: 'diffusion' | 'upscale';
  images?: string[];
  upscaledImage?: string;
  error?: string;
  progress?: number;
  message?: string;
}

export interface ImageGenerationCallbacks {
  onImagesGenerated?: (images: string[]) => void;
  onImageUpscaled?: (imageUrl: string) => void;
  onTaskFailed?: (error: string) => void;
  onProgressUpdate?: (progress: number, message: string) => void;
}

/**
 * 图像生成任务管理器
 * 基于通用任务管理器，专门处理图像生成和放大任务
 */
export function useImageGenerationTask(
  userApiKey: string | null,
  callbacks: ImageGenerationCallbacks = {}
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // 任务状态缓存
  const taskStatusCache = useRef<Map<string, ImageGenerationTask>>(new Map());

  // 配置任务管理器
  const taskManager = useTaskManager(
    {
      sseEndpoint: '/api/backend-proxy/callback',
      pollingInterval: 2000,
      maxReconnects: 3,
      reconnectDelay: 1000,
      enablePollingFallback: true,
    },
    {
      onTaskUpdate: handleTaskUpdate,
      onTaskCompleted: handleTaskCompleted,
      onTaskFailed: handleTaskFailed,
      onConnectionError: handleConnectionError,
      onConnectionRestored: handleConnectionRestored,
    }
  );

  // 处理任务更新
  function handleTaskUpdate(task: TaskStatus) {
    const imageTask: ImageGenerationTask = {
      jobId: task.jobId,
      status: task.status,
      taskType: task.taskType,
      progress: task.progress,
      message: task.message,
      error: task.error?.message,
    };

    // 处理输出数据
    if (task.output) {
      if (task.taskType === 'diffusion' && task.output.image_urls) {
        imageTask.images = task.output.image_urls.filter((url: string) => url && url.trim() !== '');
      } else if (task.taskType === 'upscale' && task.output.image_url) {
        imageTask.upscaledImage = task.output.image_url;
      }
    }

    // 更新缓存
    taskStatusCache.current.set(task.jobId, imageTask);

    // 调用进度更新回调
    if (task.progress !== undefined && task.message) {
      callbacks.onProgressUpdate?.(task.progress, task.message);
    }

    log.info('📊 Task update:', {
      jobId: task.jobId,
      status: task.status,
      taskType: task.taskType,
      progress: task.progress,
      message: task.message,
    });
  }

  // 处理任务完成
  function handleTaskCompleted(task: TaskStatus) {
    const imageTask = taskStatusCache.current.get(task.jobId);
    if (!imageTask) return;

    log.info('✅ Task completed:', {
      jobId: task.jobId,
      taskType: task.taskType,
      status: task.status,
    });

    if (task.taskType === 'diffusion') {
      // 处理图像生成完成
      if (imageTask.images && imageTask.images.length > 0) {
        setGeneratedImages(imageTask.images);
        callbacks.onImagesGenerated?.(imageTask.images);
        log.info(`🎨 Generated ${imageTask.images.length} images`);
      }
      setIsGenerating(false);
    } else if (task.taskType === 'upscale') {
      // 处理图像放大完成
      if (imageTask.upscaledImage) {
        setUpscaledImage(imageTask.upscaledImage);
        callbacks.onImageUpscaled?.(imageTask.upscaledImage);
        log.info('🔍 Image upscaled successfully');
      }
      setIsUpscaling(false);
    }

    // 清理任务并立即断开SSE连接
    taskManager.endTask(task.jobId);
    
    // 重置当前任务ID，表示没有活跃任务
    setCurrentTaskId(null);
  }

  // 处理任务失败
  function handleTaskFailed(task: TaskStatus) {
    const imageTask = taskStatusCache.current.get(task.jobId);
    if (!imageTask) return;

    log.error('❌ Task failed:', {
      jobId: task.jobId,
      taskType: task.taskType,
      error: task.error,
    });

    const errorMessage = task.error?.raw_message || 
                        task.error?.message || 
                        `Task failed (${task.status})`;

    // 简化错误消息
    let userFriendlyError = errorMessage;
    if (errorMessage.includes('unknown error, please contact support')) {
      userFriendlyError = 'Image generation failed due to server error. Please try again or contact support.';
    } else if (errorMessage.includes('task failed')) {
      userFriendlyError = 'Image generation failed. Please check your prompt and try again.';
    }

    callbacks.onTaskFailed?.(userFriendlyError);

    if (task.taskType === 'diffusion') {
      setIsGenerating(false);
    } else {
      setIsUpscaling(false);
    }

    // 清理任务并立即断开SSE连接
    taskManager.endTask(task.jobId);
    
    // 重置当前任务ID，表示没有活跃任务
    setCurrentTaskId(null);
  }

  // 处理连接错误
  function handleConnectionError(error: Event) {
    log.error('❌ Connection error:', error);
  }

  // 处理连接恢复
  function handleConnectionRestored() {
    log.info('✅ Connection restored');
  }

  // 开始图像生成
  const startImageGeneration = useCallback(async (prompt: string) => {
    if (!userApiKey) {
      throw new Error('API key not available');
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setUpscaledImage(null);
    setCurrentTaskId(null);

    try {
      log.info('Sending /imagine command to diffusion API:', prompt);

      const response = await fetch('/api/backend-proxy/v1/diffusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          text: prompt.trim(),
          callback: getCallbackUrl(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate images');
      }

      const result = await response.json();
      const jobId = result.job_id;
      
      setCurrentTaskId(jobId);
      
      // 开始任务管理
      taskManager.startTask(jobId, 'diffusion');
      
      log.info('🚀 Image generation started:', { jobId, prompt });
      
      return jobId;
    } catch (error: any) {
      log.error('Error starting image generation:', error);
      setIsGenerating(false);
      throw error;
    }
  }, [userApiKey, taskManager]);

  // 开始图像放大
  const startImageUpscaling = useCallback(async (imageIndex: number) => {
    if (!userApiKey) {
      throw new Error('API key not available');
    }

    if (!currentTaskId) {
      throw new Error('No generation task found');
    }

    setIsUpscaling(true);
    setUpscaledImage(null);

    try {
      log.info('Sending upscale request for image index:', imageIndex);

      const response = await fetch('/api/backend-proxy/v1/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          jobId: currentTaskId,
          imageNo: imageIndex,
          callback: getCallbackUrl(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upscale image');
      }

      const result = await response.json();
      const jobId = result.job_id;
      
      // 开始任务管理
      taskManager.startTask(jobId, 'upscale');
      
      log.info('🔍 Image upscaling started:', { jobId, imageIndex });
      
      return jobId;
    } catch (error: any) {
      log.error('Error starting image upscaling:', error);
      setIsUpscaling(false);
      throw error;
    }
  }, [userApiKey, currentTaskId, taskManager]);

  // 获取回调URL
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}/api/backend-proxy/callback`;
    }
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/backend-proxy/callback`;
  };

  // 取消当前任务
  const cancelCurrentTask = useCallback(() => {
    if (currentTaskId) {
      taskManager.endTask(currentTaskId);
      setCurrentTaskId(null);
    }
    setIsGenerating(false);
    setIsUpscaling(false);
  }, [currentTaskId, taskManager]);

  // 重置状态
  const reset = useCallback(() => {
    taskManager.clearAllTasks();
    setGeneratedImages([]);
    setUpscaledImage(null);
    setCurrentTaskId(null);
    setIsGenerating(false);
    setIsUpscaling(false);
    taskStatusCache.current.clear();
  }, [taskManager]);

  return {
    // 状态
    isGenerating,
    isUpscaling,
    generatedImages,
    upscaledImage,
    currentTaskId,
    isConnected: taskManager.isConnected,
    connectionError: taskManager.connectionError,
    activeTasks: taskManager.activeTasks,
    
    // 方法
    startImageGeneration,
    startImageUpscaling,
    cancelCurrentTask,
    reset,
    
    // 任务管理
    getTaskStatus: taskManager.getTaskStatus,
    startTask: taskManager.startTask,
    endTask: taskManager.endTask,
  };
}
