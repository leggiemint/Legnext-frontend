"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import StepsSection from "@/components/ui/StepsSection";
import OCMakerExamples from "@/components/examples/OCMakerExamples";
import FAQ from "@/components/sections/FAQ";
import { defaultFAQList } from "@/components/sections/FAQData";
// import FileUpload from "@/components/FileUpload";
import LoginModal from "@/components/auth/LoginModal";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "react-hot-toast";
import { log } from "@/libs/logger";

export const dynamic = 'force-dynamic';

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
  // 移除未使用的 uploadedReference 状态


  // 轮询机制和任务追踪
  const pollingIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const pendingTasksRef = useRef<Map<string, 'diffusion' | 'upscale'>>(new Map());
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // 轮询间隔配置
  const POLLING_INTERVAL = 2000; // 2秒
  const POLLING_TIMEOUT = 3 * 60 * 1000; // 3分钟

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

      // 只在开发环境记录详细日志
      if (process.env.NODE_ENV === 'development') {
        log.info('Sending /imagine command to diffusion API:', fullPrompt);
      }

      // 调用业务 Diffusion API (通过代理路由) - 使用轮询机制
      const response = await fetch('/api/backend-proxy/v1/diffusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          text: fullPrompt,
          // 移除 callback URL，使用轮询机制
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate images');
      }

      const result = await response.json();
      setCurrentTaskId(result.job_id);

      // 注册任务并开始轮询
      pendingTasksRef.current.set(result.job_id, 'diffusion');
      startPolling(result.job_id, 'diffusion');

      toast.success('Generation started! Please wait for completion...');

    } catch (error: any) {
      log.error('Error generating images:', error);
      
      // 检查是否是credits不足错误
      let errorMessage = error.message || 'Failed to generate images';
      if (error.message && error.message.includes('insufficient quota')) {
        errorMessage = 'Insufficient credits. Please subscribe to a plan to continue generating images.';
        toast.error(errorMessage, {
          duration: 8000,
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
          },
        });
      } else {
        toast.error(errorMessage);
      }
      
      setIsGenerating(false);
    }
  };

  // 轮询任务状态
  const pollJobStatus = useCallback(async (jobId: string, taskType: 'diffusion' | 'upscale') => {
    if (!userApiKey) {
      log.error('No API key available for polling');
      return;
    }

    try {
      const response = await fetch(`/api/backend-proxy/v1/job/${jobId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': userApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.status}`);
      }

      const data = await response.json();
      
      // 只在开发环境或错误时记录详细日志
      if (process.env.NODE_ENV === 'development') {
        log.info('📊 Polling job status:', {
          job_id: jobId,
          task_type: taskType,
          status: data.status,
          output: data.output
        });
      }

      if (data.status === 'completed') {
        // 任务完成
        if (taskType === 'diffusion') {
          // 处理生成的图片
          if (process.env.NODE_ENV === 'development') {
            log.info('🎨 Processing completed diffusion task:', {
              status: data.status,
              output: data.output,
              image_urls: data.output?.image_urls
            });
          }

          const images: string[] = [];
          if (data.output?.image_urls && data.output.image_urls.length > 0) {
            // 使用后端返回的实际图片URL数组，过滤空字符串
            data.output.image_urls.forEach((url: string) => {
              if (url && url.trim() !== '') {
                images.push(url);
              }
            });
          }

          if (process.env.NODE_ENV === 'development') {
            log.info('🖼️ Extracted images:', images);
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

        // 停止轮询
        const interval = pollingIntervalsRef.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(jobId);
        }
        pendingTasksRef.current.delete(jobId);
        retryCountRef.current.delete(jobId);

      } else if (data.status === 'failed') {
        // 任务失败
        log.error('❌ Task failed:', {
          job_id: jobId,
          error_code: data.error?.code,
          error_message: data.error?.message,
          error_raw: data.error?.raw_message,
          task_type: taskType
        });

        let errorMessage = data.error?.raw_message ||
                          data.error?.message ||
                          data.failure_reason ||
                          `Task failed (${data.status})`;

        // 特殊处理credits不足错误
        if (data.error?.code === 10000 && data.error?.message === 'insufficient quota') {
          errorMessage = 'Insufficient credits. Please subscribe to a plan to continue generating images.';
          toast.error(errorMessage, {
            duration: 8000, // 显示更长时间
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
            },
          });
        } else {
          // 简化其他错误消息，使其更用户友好
          if (errorMessage.includes('unknown error, please contact support')) {
            errorMessage = 'Image generation failed due to server error. Please try again or contact support.';
          } else if (errorMessage.includes('task failed')) {
            errorMessage = 'Image generation failed. Please check your prompt and try again.';
          }

          toast.error(errorMessage);
        }

        if (taskType === 'diffusion') {
          setIsGenerating(false);
        } else {
          setIsUpscaling(false);
        }

        // 停止轮询
        const interval = pollingIntervalsRef.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(jobId);
        }
        pendingTasksRef.current.delete(jobId);
        retryCountRef.current.delete(jobId);

      } else {
        // 任务仍在进行中，继续轮询
        // 只在开发环境记录进度日志
        if (process.env.NODE_ENV === 'development') {
          log.info('📊 Task in progress:', {
            job_id: jobId,
            status: data.status,
            task_type: taskType
          });
        }
      }

    } catch (error: any) {
      log.error('Error polling job status:', error);
      
      // 增加重试计数
      const retryCount = retryCountRef.current.get(jobId) || 0;
      retryCountRef.current.set(jobId, retryCount + 1);
      
      // 如果重试次数过多，停止轮询
      if (retryCount >= 5) {
        log.error('Max retry attempts reached for job:', jobId);
        const interval = pollingIntervalsRef.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(jobId);
        }
        pendingTasksRef.current.delete(jobId);
        retryCountRef.current.delete(jobId);
        
        if (taskType === 'diffusion') {
          setIsGenerating(false);
          toast.error('Failed to check generation status. Please refresh and try again.');
        } else {
          setIsUpscaling(false);
          toast.error('Failed to check upscale status. Please refresh and try again.');
        }
      }
    }
  }, [userApiKey]);

  // 开始轮询任务
  const startPolling = useCallback((jobId: string, taskType: 'diffusion' | 'upscale') => {
    // 先清除可能存在的旧轮询
    const existingInterval = pollingIntervalsRef.current.get(jobId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // 立即查询一次
    pollJobStatus(jobId, taskType);

    // 按配置间隔轮询
    const interval = setInterval(() => {
      pollJobStatus(jobId, taskType);
    }, POLLING_INTERVAL);

    pollingIntervalsRef.current.set(jobId, interval);

    // 按配置超时时间停止轮询 (防止无限轮询)
    setTimeout(() => {
      const interval = pollingIntervalsRef.current.get(jobId);
      if (interval) {
        clearInterval(interval);
        pollingIntervalsRef.current.delete(jobId);
        pendingTasksRef.current.delete(jobId);
        
        if (taskType === 'diffusion') {
          setIsGenerating(false);
          toast.error('Image generation timed out. Please try again.');
        } else {
          setIsUpscaling(false);
          toast.error('Image upscaling timed out. Please try again.');
        }
      }
    }, POLLING_TIMEOUT);
  }, [pollJobStatus, POLLING_INTERVAL, POLLING_TIMEOUT]);

  // 清理轮询任务
  useEffect(() => {
    // 在 effect 内部获取 ref 的当前值
    const pollingIntervals = pollingIntervalsRef.current;
    const pendingTasks = pendingTasksRef.current;
    const retryCounts = retryCountRef.current;
    
    return () => {
      // 组件卸载时清理所有轮询任务
      pollingIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervals.clear();
      pendingTasks.clear();
      retryCounts.clear();
    };
  }, []);

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
      // 只在开发环境记录详细日志
      if (process.env.NODE_ENV === 'development') {
        log.info('Sending upscale request for image index:', imageIndex);
      }

      // 调用业务 Upscale API (通过代理路由) - 使用轮询机制
      const response = await fetch('/api/backend-proxy/v1/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          jobId: currentTaskId,
          imageNo: imageIndex, // 0-3 对应4张图片
          // 移除 callback URL，使用轮询机制
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upscale image');
      }

      const result = await response.json();

      // 注册任务并开始轮询
      pendingTasksRef.current.set(result.job_id, 'upscale');
      startPolling(result.job_id, 'upscale');

      toast.success('Upscale started! Please wait for completion...');

    } catch (error: any) {
      log.error('Error upscaling image:', error);
      
      // 检查是否是credits不足错误
      let errorMessage = error.message || 'Failed to upscale image';
      if (error.message && error.message.includes('insufficient quota')) {
        errorMessage = 'Insufficient credits. Please subscribe to a plan to continue upscaling images.';
        toast.error(errorMessage, {
          duration: 8000,
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
          },
        });
      } else {
        toast.error(errorMessage);
      }
      
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