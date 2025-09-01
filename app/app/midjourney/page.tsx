"use client";

import { useState } from "react";
import StepsSection from "@/components/StepsSection";
import OCMakerExamples from "@/components/OCMakerExamples";
import FAQ from "@/components/FAQ";
import { defaultFAQList } from "@/components/FAQData";
import FileUpload from "@/components/FileUpload";
import { toast } from "react-hot-toast";

export default function CreatePage() {
  const [textDescription, setTextDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setUploadedReference] = useState<{
    url: string;
    fileKey: string;
    fileName: string;
  } | null>(null);

  // Steps data for the StepsSection component
  const createSteps = [
    {
      number: 1,
      title: "Craft Your Prompt",
      description: "Write a detailed description of the image you want to create. Be specific about style, composition, lighting, and mood. You can also upload a reference image to guide the AI generation."
    },
    {
      number: 2,
      title: "Execute /imagine Command",
      description: "Click \"Generate with /imagine\" to send your prompt to Midjourney API. The AI will process your request and create stunning images based on your description."
    },
    {
      number: 3,
      title: "Review & Refine",
      description: "Examine the generated images and choose your favorites. You can download high-resolution versions or refine your prompt to generate variations with different styles or compositions."
    }
  ];



  const handleGenerate = () => {
    if (!textDescription.trim()) {
      toast.error('Please enter a prompt for the /imagine command');
      return;
    }

    setIsGenerating(true);
    
    // 构建完整的/imagine命令
    let fullPrompt = textDescription.trim();
    
    // 如果包含参考图片，添加图片URL到prompt中
    if (fullPrompt.includes('@')) {
      // 图片URL已经包含在prompt中
    }

    console.log('Sending /imagine command:', fullPrompt);
    
    // TODO: 调用Midjourney API
    // 这里应该调用Midjourney API的/imagine命令
    setTimeout(() => {
      setIsGenerating(false);
      // Generation complete - could show success message or redirect
    }, 3000);
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

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Experience Midjourney API with /imagine Command
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create stunning AI-generated images using Midjourney&apos;s powerful /imagine command. No technical skills required &ndash; just describe your vision and watch it come to life.
          </p>
        </div>

      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Midjourney API Demo</h1>
      </div>

      {/* Step 1: Choose Input Method */}
      <div className="space-y-6 max-w-7xl mx-auto">
          <div className="card bg-white shadow-lg border-2 border-[#4f46e5]">
            <div className="card-body">
              <h2 className="card-title mb-4">Try the /imagine Command</h2>
              
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
                      placeholder="Type your /imagine prompt here... e.g., 'a majestic dragon flying over a futuristic city, cinematic lighting, 8k resolution'"
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
                      Generating with Midjourney...
                    </>
                  ) : (
                    "Generate with /imagine"
                  )}
                </button>
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
          Midjourney API provides programmatic access to Midjourney&apos;s powerful AI image generation capabilities. The /imagine command allows you to create stunning, high-quality images from text descriptions, making it perfect for artists, designers, and developers who want to integrate AI art generation into their applications.
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
    </div>
  );
}