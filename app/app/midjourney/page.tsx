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

  // WebSocket连接和任务追踪
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingTasksRef = useRef<Map<string, 'diffusion' | 'upscale'>>(new Map());

  // 获取当前域名用于callback URL（给后端系统调用的webhook URL）
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}/api/backend-proxy/callback`;
    }
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/backend-proxy/callback`;
  };

  // SSE连接URL（前端使用，必须是相对路径）
  const SSE_ENDPOINT = '/api/backend-proxy/callback';

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

      log.info('Sending /imagine command to diffusion API with callback:', fullPrompt);

      // 调用业务 Diffusion API (通过代理路由) - 现在使用webhook callback
      const response = await fetch('/api/backend-proxy/v1/diffusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          text: fullPrompt,
          callback: getCallbackUrl(), // 添加callback URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate images');
      }

      const result = await response.json();
      setCurrentTaskId(result.job_id);

      // 注册任务以便处理webhook回调
      pendingTasksRef.current.set(result.job_id, 'diffusion');

      toast.success('Generation started! Please wait for completion...');

    } catch (error: any) {
      log.error('Error generating images:', error);
      toast.error(error.message || 'Failed to generate images');
      setIsGenerating(false);
    }
  };

  // 处理webhook回调通知
  const handleWebhookNotification = useCallback((jobId: string, data: any) => {
    const taskType = pendingTasksRef.current.get(jobId);
    if (!taskType) {
      log.warn('Received webhook notification for unknown task:', jobId);
      return;
    }

    // 防止重复处理同一个任务
    if (data.status === 'completed' || data.status === 'failed') {
      const isAlreadyProcessed = sessionStorage.getItem(`task_${jobId}_processed`);
      if (isAlreadyProcessed) {
        log.warn('Task already processed, ignoring duplicate webhook:', jobId);
        return;
      }
      sessionStorage.setItem(`task_${jobId}_processed`, 'true');
    }

    log.info('📨 Processing webhook notification:', {
      job_id: jobId,
      task_type: taskType,
      status: data.status,
      output: data.output
    });

    if (data.status === 'completed') {
      // 任务完成
      if (taskType === 'diffusion') {
        // 处理生成的图片
        log.info('🎨 Processing completed diffusion task:', {
          status: data.status,
          output: data.output,
          image_urls: data.output?.image_urls
        });

        const images: string[] = [];
        if (data.output?.image_urls && data.output.image_urls.length > 0) {
          // 使用后端返回的实际图片URL数组，过滤空字符串
          data.output.image_urls.forEach((url: string) => {
            if (url && url.trim() !== '') {
              images.push(url);
            }
          });
        }

        log.info('🖼️ Extracted images:', images);
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

      // 简化错误消息，使其更用户友好
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
    } else {
      // 进度更新
      log.info('📊 Task status update:', {
        job_id: jobId,
        status: data.status,
        task_type: taskType
      });
    }

    // 如果任务完成或失败，从待处理任务中移除
    if (data.status === 'completed' || data.status === 'failed') {
      pendingTasksRef.current.delete(jobId);
    }
  }, []);

  // 设置SSE连接接收webhook通知
  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectCount = 0;
    const maxReconnects = 5;

    const setupConnection = () => {
      // 使用常量确保使用相对路径
      console.log('🔗 Setting up SSE connection to:', SSE_ENDPOINT);
      const eventSource = new EventSource(SSE_ENDPOINT);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'task_completed' || data.type === 'task_failed' || data.type === 'task_progress') {
            // 处理任务状态更新
            handleWebhookNotification(data.job_id, {
              status: data.type === 'task_completed' ? 'completed' : data.type === 'task_failed' ? 'failed' : data.status,
              output: data.output,
              error: data.error
            });
          }

          // 重置重连计数
          reconnectCount = 0;
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        console.error('SSE readyState:', eventSource.readyState);
        console.error('SSE url:', eventSource.url);

        // 自动重连
        if (reconnectCount < maxReconnects) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000); // 指数退避，最大30秒
          console.log(`🔄 Attempting to reconnect SSE in ${delay}ms (attempt ${reconnectCount + 1}/${maxReconnects})`);
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              reconnectCount++;
              setupConnection();
            }
          }, delay);
        } else {
          console.error('❌ Max SSE reconnection attempts reached');
        }
      };

      return eventSource;
    };

    const eventSource = setupConnection();

    // 清理连接
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, handleWebhookNotification]);

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
      log.info('Sending upscale request for image index with callback:', imageIndex);

      // 调用业务 Upscale API (通过代理路由) - 现在使用webhook callback
      const response = await fetch('/api/backend-proxy/v1/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          jobId: currentTaskId,
          imageNo: imageIndex, // 0-3 对应4张图片
          callback: getCallbackUrl(), // 添加callback URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upscale image');
      }

      const result = await response.json();

      // 注册任务以便处理webhook回调
      pendingTasksRef.current.set(result.job_id, 'upscale');

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