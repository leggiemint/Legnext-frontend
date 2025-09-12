'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { browserBackendApiClient } from '@/libs/backend-api-client-browser';
import { JobResponse } from '@/libs/backend-api-client';

interface GenerationJob {
  jobId: string;
  status: string;
  prompt: string;
  taskType: 'diffusion' | 'upscale';
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  usage: {
    type: string;
    frozen: number;
    consume: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * 图像生成Hook
 */
export function useImageGeneration() {
  const { user, refreshBalance } = useUser();
  const [jobs, setJobs] = useState<Map<string, GenerationJob>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 用于存储轮询定时器
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 轮询任务状态
  const pollJobStatus = useCallback(async (jobId: string) => {
    if (!user?.initApiKey) return;

    try {
      const jobResponse = await browserBackendApiClient.getJobStatus(user.initApiKey, jobId);
      
      const job: GenerationJob = {
        jobId: jobResponse.job_id,
        status: jobResponse.status,
        prompt: '',
        taskType: jobResponse.task_type as 'diffusion' | 'upscale',
        imageUrl: jobResponse.output.image_url,
        imageUrls: jobResponse.output.image_urls || undefined,
        createdAt: jobResponse.meta.created_at,
        usage: jobResponse.meta.usage,
        error: jobResponse.error.code > 0 ? {
          code: jobResponse.error.code,
          message: jobResponse.error.message
        } : undefined,
      };

      setJobs(prev => new Map(prev).set(jobId, job));

      // 如果任务完成或失败，停止轮询并刷新余额
      if (['completed', 'failed', 'canceled'].includes(job.status)) {
        const interval = pollIntervals.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollIntervals.current.delete(jobId);
        }
        // 刷新用户余额
        refreshBalance();
      }

      return job;
    } catch (err) {
      console.error('Error polling job status:', err);
      // 停止轮询
      const interval = pollIntervals.current.get(jobId);
      if (interval) {
        clearInterval(interval);
        pollIntervals.current.delete(jobId);
      }
    }
  }, [user?.initApiKey, refreshBalance]);

  // 开始轮询任务
  const startPolling = useCallback((jobId: string) => {
    // 先清除可能存在的旧轮询
    const existingInterval = pollIntervals.current.get(jobId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // 立即查询一次
    pollJobStatus(jobId);

    // 每3秒轮询一次
    const interval = setInterval(() => {
      pollJobStatus(jobId);
    }, 3000);

    pollIntervals.current.set(jobId, interval);

    // 30秒后停止轮询 (防止无限轮询)
    setTimeout(() => {
      const interval = pollIntervals.current.get(jobId);
      if (interval) {
        clearInterval(interval);
        pollIntervals.current.delete(jobId);
      }
    }, 30000);
  }, [pollJobStatus]);

  // 创建文生图任务
  const generateImage = useCallback(async (prompt: string, callback?: string) => {
    if (!user?.initApiKey) {
      throw new Error('User API key not available');
    }

    try {
      setIsGenerating(true);
      setError(null);

      const jobResponse = await browserBackendApiClient.createDiffusion(user.initApiKey, {
        text: prompt,
        callback,
      });

      const job: GenerationJob = {
        jobId: jobResponse.job_id,
        status: jobResponse.status,
        prompt: prompt,
        taskType: 'diffusion',
        imageUrl: jobResponse.output.image_url,
        imageUrls: jobResponse.output.image_urls || undefined,
        createdAt: jobResponse.meta.created_at,
        usage: jobResponse.meta.usage,
      };

      setJobs(prev => new Map(prev).set(job.jobId, job));

      // 开始轮询状态
      startPolling(job.jobId);

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [user?.initApiKey, startPolling]);

  // 创建高清放大任务
  const upscaleImage = useCallback(async (parentJobId: string, imageIndex: number, callback?: string) => {
    if (!user?.initApiKey) {
      throw new Error('User API key not available');
    }

    try {
      setError(null);

      const jobResponse = await browserBackendApiClient.createUpscale(user.initApiKey, {
        jobId: parentJobId,
        imageNo: imageIndex,
        callback,
      });

      const job: GenerationJob = {
        jobId: jobResponse.job_id,
        status: jobResponse.status,
        prompt: `Upscale from ${parentJobId}`,
        taskType: 'upscale',
        imageUrl: jobResponse.output.image_url,
        createdAt: jobResponse.meta.created_at,
        usage: jobResponse.meta.usage,
      };

      setJobs(prev => new Map(prev).set(job.jobId, job));

      // 开始轮询状态
      startPolling(job.jobId);

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upscale image';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.initApiKey, startPolling]);

  // 获取特定任务
  const getJob = useCallback((jobId: string) => {
    return jobs.get(jobId) || null;
  }, [jobs]);

  // 获取所有任务
  const getAllJobs = useCallback(() => {
    return Array.from(jobs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [jobs]);

  // 清理轮询定时器
  const cleanup = useCallback(() => {
    pollIntervals.current.forEach(interval => {
      clearInterval(interval);
    });
    pollIntervals.current.clear();
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    jobs: getAllJobs(),
    isGenerating,
    error,
    generateImage,
    upscaleImage,
    getJob,
    refreshJob: pollJobStatus,
    cleanup,
  };
}

/**
 * 单个任务状态Hook
 */
export function useJobStatus(jobId: string | null) {
  const { user } = useUser();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId || !user?.initApiKey) return;

    try {
      setIsLoading(true);
      setError(null);

      const jobResponse = await browserBackendApiClient.getJobStatus(user.initApiKey, jobId);
      setJob(jobResponse);
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job status');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, user?.initApiKey]);

  useEffect(() => {
    fetchJobStatus();
  }, [fetchJobStatus]);

  return {
    job,
    isLoading,
    error,
    refetch: fetchJobStatus,
  };
}

/**
 * 批量任务管理Hook
 */
export function useBatchGeneration() {
  const [batchJobs, setBatchJobs] = useState<GenerationJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const { generateImage } = useImageGeneration();

  const generateBatch = useCallback(async (prompts: string[]) => {
    try {
      setIsProcessing(true);
      setCompletedCount(0);
      setBatchJobs([]);

      const jobs: GenerationJob[] = [];

      for (let i = 0; i < prompts.length; i++) {
        try {
          const job = await generateImage(prompts[i]);
          jobs.push(job);
          setBatchJobs([...jobs]);
          
          // 等待1秒再执行下一个任务，避免频繁请求
          if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error(`Failed to generate image for prompt ${i + 1}:`, err);
        }
      }

      return jobs;
    } catch (err) {
      console.error('Batch generation error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [generateImage]);

  // 监听任务完成状态
  useEffect(() => {
    const completed = batchJobs.filter(job => 
      ['completed', 'failed', 'canceled'].includes(job.status)
    ).length;
    setCompletedCount(completed);
  }, [batchJobs]);

  const progress = batchJobs.length > 0 ? (completedCount / batchJobs.length) * 100 : 0;

  return {
    batchJobs,
    isProcessing,
    completedCount,
    totalCount: batchJobs.length,
    progress,
    generateBatch,
  };
}