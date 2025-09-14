"use client";

import { useState } from "react";
import StepsSection from "@/components/StepsSection";
import OCMakerExamples from "@/components/OCMakerExamples";
import FAQ from "@/components/FAQ";
import { defaultFAQList } from "@/components/FAQData";
import FileUpload from "@/components/FileUpload";
import LoginModal from "@/components/LoginModal";
import ProgressBar from "@/components/ProgressBar";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "react-hot-toast";

export const dynamic = 'force-dynamic';

export default function VideoPage() {
  const { isAuthenticated } = useAuth();
  const [textDescription, setTextDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [upscaledVideo, setUpscaledVideo] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [, setUploadedReference] = useState<{
    url: string;
    fileKey: string;
    fileName: string;
  } | null>(null);

  // Steps data for the StepsSection component
  const createSteps = [
    {
      number: 1,
      title: "Craft Your Video Prompt",
      description: "Write a detailed description of the video you want to create. Be specific about style, composition, lighting, mood, and motion. You can also upload a reference image to guide the AI generation."
    },
    {
      number: 2,
      title: "Execute Video Generation",
      description: "Click \"Generate Video\" to send your prompt to our AI video generation API. The AI will process your request and create stunning videos based on your description."
    },
    {
      number: 3,
      title: "Review & Enhance",
      description: "Examine the generated videos and choose your favorites. You can download high-resolution versions or enhance your video with upscaling and quality improvements."
    }
  ];

  const handleGenerate = () => {
    // 检查用户是否已登录
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!textDescription.trim()) {
      toast.error('Please enter a prompt for video generation');
      return;
    }

    setIsGenerating(true);
    
    // 构建完整的视频生成命令
    let fullPrompt = textDescription.trim();
    
    // 如果包含参考图片，添加图片URL到prompt中
    if (fullPrompt.includes('@')) {
      // 图片URL已经包含在prompt中
    }

    console.log('Sending video generation command:', fullPrompt);
    
    // TODO: 调用视频生成API
    // 这里应该调用视频生成API
    // 进度条会在onComplete回调中处理结果
  };

  const handleFileUploaded = (fileData: {
    url: string;
    fileKey: string;
    fileName: string;
  }) => {
    setUploadedReference(fileData);
    // 将图片URL添加到文本描述中
    const imagePrompt = `@${fileData.url} `;
    setTextDescription(prev => imagePrompt + prev);
  };

  const handleUpscale = () => {
    // 检查用户是否已登录
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsUpscaling(true);
    // 模拟Upscale过程
    // 进度条会在onComplete回调中处理结果
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI Video Generation Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create stunning AI-generated videos using our powerful video generation API. No technical skills required &ndash; just describe your vision and watch it come to life in motion.
          </p>
        </div>

      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Video Generation Demo</h1>
      </div>

      {/* Step 1: Choose Input Method */}
      <div className="space-y-6 max-w-7xl mx-auto">
          <div className="card bg-white shadow-lg border-2 border-[#4f46e5]">
            <div className="card-body">
              <h2 className="card-title mb-4">Create Your Video</h2>
              
              {/* Split Input Field */}
              <div className="form-control">
                <div className="flex gap-4">
                  {/* Left: Square Upload Area */}
                  <div className="flex-shrink-0">
                    <FileUpload
                      onFileUploaded={handleFileUploaded}
                      type="reference"
                      maxSize={5 * 1024 * 1024} // 5MB
                      accept="image/*"
                    />
                  </div>
                  
                  {/* Right: Text Input Area */}
                  <div className="flex-1">
                    <textarea 
                      className="textarea w-full h-32 resize-none bg-gray-100 border-0 px-4 py-3 text-base-content placeholder-base-content/60" 
                      placeholder="Type your video prompt here... e.g., 'a majestic dragon flying over a futuristic city, cinematic lighting, slow motion, 4k resolution'"
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                    ></textarea>

                  </div>
                </div>
                
                <div className="mt-2 text-sm text-base-content/60 text-center">
                  Upload a reference image to guide the AI generation (Optional)
                </div>
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
                      Generating Video...
                    </>
                  ) : (
                    "Generate Video"
                  )}
                </button>
              </div>

              {/* Generated Videos Section */}
              <div className="mt-8">
                <h2 className="card-title mb-4 text-center">Generated Videos</h2>
              
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                  <div className="loading loading-spinner loading-lg text-[#4f46e5]"></div>
                  <p className="text-lg text-gray-600">Generating your video with AI...</p>
                  <ProgressBar 
                    isVisible={isGenerating}
                    duration={10000}
                    label="Generating video..."
                    onComplete={() => {
                      setIsGenerating(false);
                      // Simulate generated videos for demo
                      const mockVideos = [
                        "/api/placeholder/512/512?text=Generated+Video+1",
                        "/api/placeholder/512/512?text=Generated+Video+2",
                        "/api/placeholder/512/512?text=Generated+Video+3",
                        "/api/placeholder/512/512?text=Generated+Video+4"
                      ];
                      setGeneratedVideos(mockVideos);
                      toast.success('Videos generated successfully!');
                    }}
                  />
                </div>
              ) : generatedVideos.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {generatedVideos.map((videoUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#4f46e5] transition-colors max-w-[200px] mx-auto">
                          <video 
                            src={videoUrl} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            controls
                            muted
                            loop
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="btn btn-sm bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none"
                            onClick={() => handleUpscale()}
                          >
                            Enhance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Upscaled Video Display */}
                  {isUpscaling ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="loading loading-spinner loading-lg text-[#4f46e5]"></div>
                      <p className="text-lg text-gray-600">Enhancing your video...</p>
                      <ProgressBar 
                        isVisible={isUpscaling}
                        duration={10000}
                        label="Enhancing video..."
                        onComplete={() => {
                          // 模拟生成增强的视频
                          const upscaledUrl = generatedVideos[0]?.replace('512', '1024') || "/api/placeholder/1024/1024?text=Enhanced+Video";
                          setUpscaledVideo(upscaledUrl);
                          setIsUpscaling(false);
                          toast.success('Video enhanced successfully!');
                        }}
                      />
                    </div>
                  ) : upscaledVideo && (
                    <div className="flex justify-center">
                      <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg shadow-lg">
                        <video 
                          src={upscaledVideo} 
                          className="w-full h-full object-cover"
                          controls
                          autoPlay
                          loop
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-600">No videos generated yet</p>
                  <p className="text-sm text-gray-500">Enter a prompt above and click &quot;Generate Video&quot; to create stunning AI videos</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

      {/* What is Video Generation API */}
      <div className="text-center py-12 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#4f46e5] mb-4">
          What is AI Video Generation
        </h2>
        <p className="text-lg text-gray-700 px-6">
          Our AI Video Generation API provides programmatic access to cutting-edge video creation capabilities. Generate high-quality videos from text descriptions, making it perfect for content creators, marketers, and developers who want to integrate AI video generation into their applications.
        </p>
      </div>

      {/* Steps Section */}
      <div className="max-w-6xl mx-auto">
        <StepsSection 
          title="How to Use AI Video Generation in 3 Simple Steps" 
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
          toast.success('Welcome! You can now generate videos.');
        }}
      />
    </div>
  );
}
