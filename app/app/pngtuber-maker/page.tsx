"use client";

import { useState } from "react";
import Link from "next/link";
import StepsSection from "@/components/StepsSection";
import OCMakerExamples from "@/components/OCMakerExamples";
import FAQ from "@/components/FAQ";
import { pngtuberFAQList } from "@/components/FAQData";
import FileUpload from "@/components/FileUpload";
import { toast } from "react-hot-toast";

type Step = 1 | 2 | 3;

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [textDescription, setTextDescription] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedReference, setUploadedReference] = useState<{
    url: string;
    fileKey: string;
    fileName: string;
  } | null>(null);

  // Steps data for the StepsSection component
  const createSteps = [
    {
      number: 1,
      title: "Describe Your Avatar",
      description: "Enter a description of your ideal PNGtuber character or upload a reference image to guide the AI in generating your character."
    },
    {
      number: 2,
      title: "Generate Your Avatar",
      description: "Click \"Generate Avatars\" and let the AI create four different variations of your avatar for you to choose from."
    },
    {
      number: 3,
      title: "Choose & Download Your Final Avatar",
      description: "Select your favorite avatar (neutral avatar), then generate five additional expressions (e.g., happy, angry, surprised, sad, wink). Finally, download and package all your avatars and expressions."
    }
  ];

  const mockAvatars = [1, 2, 3, 4]; // Placeholder for generated avatars

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleGenerate = () => {
    if (!textDescription.trim()) {
      toast.error('Please enter a description for your PngTuber');
      return;
    }

    setIsGenerating(true);
    
    // 构建完整的prompt
    let fullPrompt = textDescription.trim();
    
    // 文本中已经包含了@URL格式的参考图，直接使用

    console.log('Sending prompt:', fullPrompt);
    
    // TODO: 调用AI生成API
    // 这里应该调用你的AI生成服务
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep(2);
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
            Create Your Perfect PngTuber with PngTuber Maker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            No Art Skills Needed – Generate Unique Avatars, Expressions, and Animations for Streaming on Twitch, YouTube, and Discord.
          </p>
        </div>

      {/* Progress Bar */}
      <div className="w-full bg-base-300 rounded-full h-2">
        <div 
          className="bg-[#06b6d4] h-2 rounded-full transition-all duration-300" 
          style={{width: `${(currentStep / 3) * 100}%`}}
        ></div>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">PngTuber Maker</h1>
        <div className="text-sm text-base-content/60">
          Step {currentStep} of 3
        </div>
      </div>

      {/* Step 1: Choose Input Method */}
      {currentStep === 1 && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="card bg-white shadow-lg border-2 border-[#06b6d4]">
            <div className="card-body">
              <h2 className="card-title mb-4">Step 1: Describe Your PngTuber</h2>
              
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
                      placeholder="What do you want to see? Describe your ideal PngTuber character..."
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                    ></textarea>

                  </div>
                </div>
                
                <div className="mt-2 text-sm text-base-content/60 text-center">
                  You can choose to upload a Reference Image (Optional)
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button 
                  className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none"
                  onClick={handleGenerate}
                  disabled={!textDescription.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Generating...
                    </>
                  ) : (
                    "Generate PngTubers"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Avatar */}
      {currentStep === 2 && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="card bg-white shadow-lg border-2 border-[#06b6d4]">
            <div className="card-body">
              <h2 className="card-title mb-4">Step 2: Choose Your Favorite</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockAvatars.map((avatar, index) => (
                  <div 
                    key={index}
                    className={`aspect-square rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      selectedAvatar === index ? "ring-4 ring-[#06b6d4]" : ""
                    }`}
                    onClick={() => setSelectedAvatar(index)}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-[#06b6d4]/20 to-[#6ecfe0]/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#06b6d4]/30 rounded-full mx-auto mb-2"></div>
                        <p className="text-xs text-base-content/60">PngTuber {index + 1}</p>
                      </div>
                    </div>
                    {selectedAvatar === index && (
                      <div className="mt-2 text-center">
                        <button className="btn btn-xs bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
                          Expression
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Generated Results Placeholder */}
              <div className="mt-8">
                <h3 className="font-semibold mb-4 text-center">Generated Expressions</h3>
                <div className="w-full">
                  <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 px-4">
                        Your complete expression pack will be generated here
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-between mt-6">
                <button className="btn btn-ghost" onClick={handleBack}>
                  ← Back
                </button>
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => setCurrentStep(1)}>
                    Regenerate
                  </button>
                  <button 
                    className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none"
                    onClick={handleNext}
                    disabled={selectedAvatar === null}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Download & Share */}
      {currentStep === 3 && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="card bg-white shadow-lg border-2 border-[#06b6d4]">
            <div className="card-body">
              <h2 className="card-title mb-4">Step 3: Your PngTuber is Ready!</h2>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Preview */}
                <div className="flex-1">
                  <div className="aspect-square bg-gradient-to-br from-[#06b6d4]/20 to-[#6ecfe0]/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-[#06b6d4]/30 rounded-full mx-auto mb-4"></div>
                      <p className="text-lg font-semibold">Your PngTuber</p>
                      <p className="text-sm text-base-content/60">High Quality • Ready to Use</p>
                    </div>
                  </div>
                </div>

                {/* Download Options */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-4">Download Options</h3>
                  <div className="space-y-3">
                    <button className="btn btn-block bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PNG
                    </button>
                    <button className="btn btn-block btn-outline">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save to My PngTubers
                    </button>
                    <button className="btn btn-block btn-outline">
                      Further Edit (Coming Soon)
                    </button>
                  </div>

                  <div className="divider">Share</div>
                  
                  <div className="space-y-3">
                    <button className="btn btn-block btn-outline">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share on Social Media
                    </button>
                    <button className="btn btn-block btn-outline">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-between mt-6">
                <button className="btn btn-ghost" onClick={handleBack}>
                  ← Back
                </button>
                <div className="flex gap-2">
                  <Link href="/app/pngtubers">
                    <button className="btn btn-outline">
                      View My PngTubers
                    </button>
                  </Link>
                  <Link href="/app/pngtuber-maker">
                    <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
                      Create Another
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What is PNGTuber Maker */}
      <div className="text-center py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-[#06b6d4] mb-4">
          What is PNGTuber Maker
        </h2>
        <p className="text-lg text-gray-700 max-w-4xl mx-auto px-6">
          PNGTuber Maker is an AI tool that allows you to design PNGTuber avatars with AI magic, where PNGTuber is short for PNG + VTuber. You can create original streaming avatars with unique appearances, expressions, and animations for your content.
        </p>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto">
        <StepsSection 
          title="Create Your PNGTuber Avatar in 3 Simple Steps" 
          steps={createSteps} 
        />
      </div>

      {/* OC Maker Examples */}
      <OCMakerExamples />

      {/* FAQ Section */}
      <FAQ 
        title="Frequently Asked Questions" 
        faqList={pngtuberFAQList} 
        variant="pngtuber"
      />
      </div>
    </div>
  );
}