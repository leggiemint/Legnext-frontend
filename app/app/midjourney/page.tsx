"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import StepsSection from "@/components/StepsSection";
import OCMakerExamples from "@/components/OCMakerExamples";
import FAQ from "@/components/FAQ";
import { defaultFAQList } from "@/components/FAQData";
// import FileUpload from "@/components/FileUpload";
import LoginModal from "@/components/LoginModal";
import ProgressBar from "@/components/ProgressBar";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "react-hot-toast";
import { log } from "@/libs/logger";

export const dynamic = 'force-dynamic';

// 轮询配置常量
const POLLING_CONFIG = {
  INITIAL_INTERVAL: 2000,    // 开始2秒轮询
  PROGRESSIVE_INTERVALS: [2000, 3000, 5000, 8000, 10000], // 渐进式轮询间隔
  MAX_INTERVAL: 15000,       // 最大15秒轮询间隔
  MAX_DURATION: 180000,      // 最大轮询时长3分钟
  MAX_RETRIES: 3,            // 单次请求最大重试次数
  RETRY_DELAY_BASE: 1000,    // 重试延迟基数
};

export default function CreatePage() {
  const { isAuthenticated } = useAuth();
  const [textDescription, setTextDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [, setSelectedImageIndex] = useState<number | null>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [, setUploadedReference] = useState<{
    url: string;
    fileKey: string;
    fileName: string;
  } | null>(null);

  // 轮询任务追踪
  const pollingIntervalsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingTasksRef = useRef<Map<string, {
    type: 'diffusion' | 'upscale',
    startTime: number,
    retryCount: number,
    pollCount: number,
    lastPollTime: number,
    totalPolls: number,
    errors: string[]
  }>>(new Map());


  // Steps data for the StepsSection component
  const createSteps = [
    {
      number: 1,
      title: "Craft Your Prompt",
      description: "Write a detailed description of the image you want to create. Be specific about style, composition, lighting, and mood. You can also upload a reference image to guide the AI generation."
    },
    {
      number: 2,
      title: "Generate Images",
      description: "Click \"Generate with /imagine\" to send your prompt to our Midjourney API. The AI will process your request and create 4 stunning image variations based on your description."
    },
    {
      number: 3,
      title: "Upscale & Download",
      description: "Review the generated images and click \"Upscale\" on your favorite to enhance it to high resolution. The upscaled image will be ready for download and use in your projects."
    }
  ];

  // 获取用户API Key - 直接从用户profile获取init key
  useEffect(() => {
    const fetchApiKey = async () => {
      if (!isAuthenticated || isLoadingApiKey || userApiKey) return; // 如果已有API Key则跳过
      
      setIsLoadingApiKey(true);
      try {
        // 直接从用户profile获取init key
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        if (data.profile?.initApiKey) {
          // 直接使用存储的init key
          setUserApiKey(data.profile.initApiKey);
          log.info('✅ Using stored init API key');
        } else {
          toast.error('No API key found. Please create an API key in your dashboard.');
        }
      } catch (error: any) {
        log.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      } finally {
        setIsLoadingApiKey(false);
      }
    };

    fetchApiKey();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    // 检查用户是否已登录
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!textDescription.trim()) {
      toast.error('Please enter a prompt for the /imagine command');
      return;
    }

    if (!userApiKey) {
      toast.error('API key not available. Please wait or refresh the page.');
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setUpscaledImage(null);
    setCurrentTaskId(null);

    try {
      // 构建完整的/imagine命令
      let fullPrompt = textDescription.trim();

      log.info('Sending /imagine command to diffusion API:', fullPrompt);

      // 调用业务 Diffusion API (通过代理路由) - 使用轮询方式
      const response = await fetch('/api/backend-proxy/v1/diffusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          text: fullPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate images');
      }

      const result = await response.json();
      setCurrentTaskId(result.job_id);

      // 启动轮询任务状态
      startPolling(result.job_id, 'diffusion');

      toast.success('Generation started! Please wait for completion...');

    } catch (error: any) {
      log.error('Error generating images:', error);
      toast.error(error.message || 'Failed to generate images');
      setIsGenerating(false);
    }
  };

  // 计算轮询间隔（渐进式）
  const getPollingInterval = (pollCount: number): number => {
    if (pollCount < POLLING_CONFIG.PROGRESSIVE_INTERVALS.length) {
      return POLLING_CONFIG.PROGRESSIVE_INTERVALS[pollCount];
    }
    return POLLING_CONFIG.MAX_INTERVAL;
  };

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (jobId: string, pollCount = 0): Promise<void> => {
    const taskInfo = pendingTasksRef.current.get(jobId);
    if (!taskInfo || !userApiKey) {
      log.warn('❌ Polling stopped - task not found or API key missing');
      return;
    }

    const { type: taskType, startTime, retryCount, totalPolls, errors } = taskInfo;
    const now = Date.now();
    const elapsed = now - startTime;

    // 更新轮询统计信息
    const updatedTaskInfo = {
      ...taskInfo,
      pollCount,
      lastPollTime: now,
      totalPolls: totalPolls + 1
    };
    pendingTasksRef.current.set(jobId, updatedTaskInfo);

    // 检查是否超时
    if (elapsed > POLLING_CONFIG.MAX_DURATION) {
      log.error('⏰ Task timeout:', {
        jobId: jobId.substring(0, 8) + '...',
        taskType,
        duration: `${Math.round(elapsed / 1000)}s`
      });
      toast.error('Task timeout. Please try again.');

      // 清理任务
      if (taskType === 'diffusion') {
        setIsGenerating(false);
      } else {
        setIsUpscaling(false);
      }

      // 标记任务处理完成（超时）
      sessionStorage.setItem(`task_${jobId}_processed`, 'true');
      sessionStorage.removeItem(`task_${jobId}_processing`);
      stopPolling(jobId);
      return;
    }

    try {
      // 简化轮询日志 - 只在重要节点记录
      if (pollCount === 0 || pollCount % 5 === 0 || pollCount > 10) {
        log.info(`🔍 Polling task status:`, {
          jobId: jobId.substring(0, 8) + '...',
          taskType,
          elapsed: `${Math.round(elapsed / 1000)}s`,
          poll: pollCount + 1,
          errors: errors.length
        });
      }

      // 调用状态检查API
      const apiStartTime = Date.now();
      const response = await fetch(`/api/backend-proxy/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
      });
      const apiDuration = Date.now() - apiStartTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      // 只在状态变化时记录API响应
      if (data.status === 'completed' || data.status === 'failed' || apiDuration > 5000) {
        log.info('📊 API Response:', {
          jobId: jobId.substring(0, 8) + '...',
          status: data.status,
          duration: `${apiDuration}ms`
        });
      }

      // 处理任务结果
      if (data.status === 'completed') {
        // 防止重复处理 - 但只有在任务确实已被成功处理过时才跳过
        const isAlreadyProcessed = sessionStorage.getItem(`task_${jobId}_processed`);
        const currentTaskInProgress = taskType === 'diffusion' ? isGenerating : isUpscaling;

        if (isAlreadyProcessed && !currentTaskInProgress) {
          log.warn('Task already processed and UI updated, ignoring duplicate result:', {
            jobId: jobId.substring(0, 8) + '...',
            taskType,
            uiInProgress: currentTaskInProgress
          });
          stopPolling(jobId);
          return;
        }

        // 标记任务开始处理，但还未完成UI更新
        sessionStorage.setItem(`task_${jobId}_processing`, 'true');

        log.info('✅ Task completed:', {
          jobId: jobId.substring(0, 8) + '...',
          taskType,
          duration: `${Math.round(elapsed / 1000)}s`,
          polls: totalPolls + 1,
          imageCount: data.output?.image_urls?.length || (data.output?.image_url ? 1 : 0)
        });

        if (taskType === 'diffusion') {
          // 处理生成的图片
          const images: string[] = [];
          if (data.output?.image_urls && data.output.image_urls.length > 0) {
            data.output.image_urls.forEach((url: string) => {
              if (url && url.trim() !== '') {
                images.push(url);
              }
            });
          }

          setGeneratedImages(images);
          setIsGenerating(false);
          toast.success(`Images generated successfully! Found ${images.length} images.`);
        } else if (taskType === 'upscale') {
          // 处理放大的图片
          if (data.output?.image_url) {
            setUpscaledImage(data.output.image_url);
          }
          setIsUpscaling(false);
          toast.success('Image upscaled successfully!');
        }

        // 标记任务完全处理完成
        sessionStorage.setItem(`task_${jobId}_processed`, 'true');
        sessionStorage.removeItem(`task_${jobId}_processing`);
        stopPolling(jobId);
      } else if (data.status === 'failed') {
        log.error('❌ Task failed:', {
          jobId: jobId.substring(0, 8) + '...',
          taskType,
          duration: `${Math.round(elapsed / 1000)}s`,
          error: data.error?.message || data.error?.raw_message || 'Unknown error'
        });

        let errorMessage = data.error?.raw_message ||
                          data.error?.message ||
                          data.failure_reason ||
                          'Task failed';

        // 简化错误消息
        if (errorMessage.includes('unknown error, please contact support')) {
          errorMessage = 'Image generation failed due to server error. Please try again or contact support.';
        } else if (errorMessage.includes('task failed')) {
          errorMessage = 'Image generation failed. Please check your prompt and try again.';
        }

        toast.error(errorMessage);

        if (taskType === 'diffusion') {
          setIsGenerating(false);
        } else {
          setIsUpscaling(false);
        }

        // 标记任务处理完成（失败）
        sessionStorage.setItem(`task_${jobId}_processed`, 'true');
        sessionStorage.removeItem(`task_${jobId}_processing`);
        stopPolling(jobId);
      } else {
        // 任务仍在进行中，继续轮询
        const nextInterval = getPollingInterval(pollCount);

        // 只在特定情况下记录进度日志
        if (pollCount === 0 || pollCount % 5 === 0 || elapsed > 60000) {
          log.info('⏳ Task processing:', {
            jobId: jobId.substring(0, 8) + '...',
            status: data.status,
            elapsed: `${Math.round(elapsed / 1000)}s`,
            poll: pollCount + 1
          });
        }

        // 更新任务信息（重置重试计数）
        pendingTasksRef.current.set(jobId, {
          ...updatedTaskInfo,
          retryCount: 0
        });

        // 设置下一次轮询
        const timeoutId = setTimeout(() => {
          pollTaskStatus(jobId, pollCount + 1);
        }, nextInterval);

        pollingIntervalsRef.current.set(jobId, timeoutId);
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const updatedErrors = [...errors, errorMessage];

      log.error('🚫 Polling failed:', {
        jobId: jobId.substring(0, 8) + '...',
        error: errorMessage,
        retry: `${retryCount + 1}/${POLLING_CONFIG.MAX_RETRIES}`,
        elapsed: `${Math.round(elapsed / 1000)}s`
      });

      // 增加重试计数并记录错误
      const newRetryCount = retryCount + 1;

      if (newRetryCount >= POLLING_CONFIG.MAX_RETRIES) {
        // 达到最大重试次数
        log.error('🛑 Max retries reached:', {
          jobId: jobId.substring(0, 8) + '...',
          taskType,
          duration: `${Math.round(elapsed / 1000)}s`,
          finalError: errorMessage
        });

        toast.error('Network error. Please check your connection and try again.');

        if (taskType === 'diffusion') {
          setIsGenerating(false);
        } else {
          setIsUpscaling(false);
        }

        // 标记任务处理完成（网络错误）
        sessionStorage.setItem(`task_${jobId}_processed`, 'true');
        sessionStorage.removeItem(`task_${jobId}_processing`);
        stopPolling(jobId);
      } else {
        // 指数退避重试
        const retryDelay = POLLING_CONFIG.RETRY_DELAY_BASE * Math.pow(2, newRetryCount - 1);

        log.info(`🔄 Retrying in ${retryDelay}ms (${newRetryCount}/${POLLING_CONFIG.MAX_RETRIES})`);

        // 更新重试计数和错误历史
        pendingTasksRef.current.set(jobId, {
          ...updatedTaskInfo,
          retryCount: newRetryCount,
          errors: updatedErrors
        });

        // 延迟重试
        const timeoutId = setTimeout(() => {
          pollTaskStatus(jobId, pollCount);
        }, retryDelay);

        pollingIntervalsRef.current.set(jobId, timeoutId);
      }
    }
  }, [userApiKey]);

  // 停止轮询
  const stopPolling = useCallback((jobId: string) => {
    const taskInfo = pendingTasksRef.current.get(jobId);
    const timeoutId = pollingIntervalsRef.current.get(jobId);

    if (taskInfo) {
      const elapsed = Date.now() - taskInfo.startTime;
      log.info('🛑 Stopping polling:', {
        jobId: jobId.substring(0, 8) + '...',
        taskType: taskInfo.type,
        duration: `${Math.round(elapsed / 1000)}s`,
        polls: taskInfo.totalPolls
      });
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      pollingIntervalsRef.current.delete(jobId);
    }
    pendingTasksRef.current.delete(jobId);
    // 不在这里标记为已处理，让调用方决定
  }, []);

  // 启动轮询
  const startPolling = useCallback((jobId: string, taskType: 'diffusion' | 'upscale') => {
    // 清理可能存在的旧轮询和session storage
    stopPolling(jobId);
    sessionStorage.removeItem(`task_${jobId}_processed`);
    sessionStorage.removeItem(`task_${jobId}_processing`);

    const startTime = Date.now();

    // 添加任务到待处理列表
    const newTaskInfo = {
      type: taskType,
      startTime,
      retryCount: 0,
      pollCount: 0,
      lastPollTime: 0,
      totalPolls: 0,
      errors: [] as string[]
    };

    pendingTasksRef.current.set(jobId, newTaskInfo);

    log.info('🚀 Starting polling:', {
      jobId: jobId.substring(0, 8) + '...',
      taskType
    });

    // 立即开始轮询
    pollTaskStatus(jobId, 0);
  }, [pollTaskStatus, stopPolling]);

  // 清理轮询资源
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有轮询
      const currentPollingIntervals = pollingIntervalsRef.current;
      currentPollingIntervals.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      currentPollingIntervals.clear();
      pendingTasksRef.current.clear();
    };
  }, []); // 空依赖数组，只在组件卸载时执行

  const handleUpscale = async (imageIndex: number) => {
    // 检查用户是否已登录
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!currentTaskId) {
      toast.error('No generation task found');
      return;
    }

    if (!userApiKey) {
      toast.error('API key not available. Please wait or refresh the page.');
      return;
    }

    setIsUpscaling(true);
    setSelectedImageIndex(imageIndex);
    setUpscaledImage(null);

    try {
      log.info('Sending upscale request for image index:', imageIndex);

      // 调用业务 Upscale API (通过代理路由) - 使用轮询方式
      const response = await fetch('/api/backend-proxy/v1/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          jobId: currentTaskId,
          imageNo: imageIndex, // 0-3 对应4张图片
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upscale image');
      }

      const result = await response.json();

      // 启动轮询任务状态
      startPolling(result.job_id, 'upscale');

      toast.success('Upscale started! Please wait for completion...');

    } catch (error: any) {
      log.error('Error upscaling image:', error);
      toast.error(error.message || 'Failed to upscale image');
      setIsUpscaling(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Midjourney API Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of Midjourney&apos;s /imagine command through our API. Generate 4 unique image variations from your text description, then upscale your favorites to high resolution.
          </p>
        </div>

      {/* Step 1: Choose Input Method */}
      <div className="space-y-6 max-w-7xl mx-auto">
          <div className="card bg-white shadow-lg border-2 border-[#4f46e5]">
            <div className="card-body">
              <h2 className="card-title mb-4">Create Your Masterpiece</h2>
              
              {/* Split Input Field */}
              <div className="form-control">
                <div className="flex gap-4">
                  {/* Left: Square Upload Area */}
                  {/* <div className="flex-shrink-0">
                    <FileUpload
                      onFileUploaded={handleFileUploaded}
                      type="reference"
                      maxSize={5 * 1024 * 1024} // 5MB
                      accept="image/*"
                    />
                  </div> */}
                  
                  {/* Right: Text Input Area */}
                  <div className="flex-1">
                    <textarea 
                      className="textarea w-full h-32 resize-none bg-gray-100 border-0 px-4 py-3 text-base-content placeholder-base-content/60" 
                      placeholder="Describe your image... e.g., 'a majestic dragon flying over a futuristic city, cinematic lighting, 8k resolution'"
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                    ></textarea>

                  </div>
                </div>
                
                {/* <div className="mt-2 text-sm text-base-content/60 text-center">
                  Upload a reference image to guide the AI generation (Optional)
                </div> */}
              </div>

              <div className="card-actions justify-end mt-6">
                <button 
                  className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none"
                  onClick={handleGenerate}
                  disabled={!textDescription.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Generating with Midjourney...
                    </>
                  ) : (
                    "Generate 4 Images"
                  )}
                </button>
              </div>

              {/* Generated Images Section */}
              <div className="mt-8">
                <h2 className="card-title mb-4 text-center">Your Image Variations</h2>
              
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                  <div className="loading loading-spinner loading-lg text-[#4f46e5]"></div>
                  <p className="text-lg text-gray-600">Generating your images with Midjourney...</p>
                  <ProgressBar 
                    isVisible={isGenerating}
                    duration={60000}
                    label="Generating images with Midjourney..."
                    onComplete={() => {
                      // 进度条结束后，继续等待API返回结果
                      // 实际的结果处理在pollTaskStatus中完成
                    }}
                  />
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#4f46e5] transition-colors max-w-[200px] mx-auto">
                          <Image 
                            src={imageUrl} 
                            alt={`Generated image ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="btn btn-sm bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none"
                            onClick={() => handleUpscale(index)}
                          >
                            Upscale
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Upscaled Image Display */}
                  {isUpscaling ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="loading loading-spinner loading-lg text-[#4f46e5]"></div>
                      <p className="text-lg text-gray-600">Upscaling your image...</p>
                      <ProgressBar 
                        isVisible={isUpscaling}
                        duration={60000}
                        label="Upscaling image with Midjourney..."
                        onComplete={() => {
                          // 进度条结束后，继续等待API返回结果
                          // 实际的结果处理在pollTaskStatus中完成
                        }}
                      />
                    </div>
                  ) : upscaledImage && (
                    <div className="flex justify-center">
                      <div className="aspect-square w-full max-w-md overflow-hidden rounded-lg shadow-lg">
                        <Image 
                          src={upscaledImage} 
                          alt="Upscaled image"
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-600">No images generated yet</p>
                  <p className="text-sm text-gray-500">Enter a prompt above and click &quot;Generate 4 Images&quot; to create stunning AI images</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>


      {/* What is Midjourney API */}
      <div className="text-center py-12 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#4f46e5] mb-4">
          What is Midjourney API
        </h2>
        <p className="text-lg text-gray-700 px-6">
          Our Midjourney API provides seamless access to Midjourney&apos;s powerful AI image generation. Generate 4 unique image variations from any text description, then upscale your favorites to high resolution - perfect for artists, designers, and developers building creative applications.
        </p>
      </div>

      {/* Steps Section */}
      <div className="max-w-6xl mx-auto">
        <StepsSection 
          title="How to Use Midjourney API in 3 Simple Steps" 
          steps={createSteps} 
        />
      </div>

      {/* OC Maker Examples */}
      <div className="max-w-7xl mx-auto">
        <OCMakerExamples />
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto">
        <FAQ 
          title="Frequently Asked Questions" 
          faqList={defaultFAQList} 
          variant="midjourney"
        />
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          toast.success('Welcome! You can now generate images.');
        }}
      />
    </div>
  );
}