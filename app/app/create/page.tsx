"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3;
type InputMethod = "text" | "image" | "combined";

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [inputMethod, setInputMethod] = useState<InputMethod>("text");
  const [textDescription, setTextDescription] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep(2);
    }, 3000);
  };

  const mockAvatars = [1, 2, 3, 4]; // Placeholder for generated avatars

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-base-300 rounded-full h-2">
        <div 
          className="bg-[#06b6d4] h-2 rounded-full transition-all duration-300" 
          style={{width: `${(currentStep / 3) * 100}%`}}
        ></div>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Avatar</h1>
        <div className="text-sm text-base-content/60">
          Step {currentStep} of 3
        </div>
      </div>

      {/* Step 1: Choose Input Method */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">Step 1: Choose Your Input Method</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div 
                  className={`card cursor-pointer transition-all hover:shadow-lg ${
                    inputMethod === "text" ? "ring-2 ring-[#06b6d4] bg-[#06b6d4]/10" : "bg-base-100"
                  }`}
                  onClick={() => setInputMethod("text")}
                >
                  <div className="card-body text-center">
                    <div className="text-[#06b6d4] mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Text Description</h3>
                    <p className="text-sm text-base-content/70">Describe your avatar in words</p>
                  </div>
                </div>

                <div 
                  className={`card cursor-pointer transition-all hover:shadow-lg ${
                    inputMethod === "image" ? "ring-2 ring-[#06b6d4] bg-[#06b6d4]/10" : "bg-base-100"
                  }`}
                  onClick={() => setInputMethod("image")}
                >
                  <div className="card-body text-center">
                    <div className="text-[#06b6d4] mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Image Reference</h3>
                    <p className="text-sm text-base-content/70">Upload a reference image</p>
                  </div>
                </div>

                <div 
                  className={`card cursor-pointer transition-all hover:shadow-lg ${
                    inputMethod === "combined" ? "ring-2 ring-[#06b6d4] bg-[#06b6d4]/10" : "bg-base-100"
                  }`}
                  onClick={() => setInputMethod("combined")}
                >
                  <div className="card-body text-center">
                    <div className="text-[#06b6d4] mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Combined Input</h3>
                    <p className="text-sm text-base-content/70">Text + image reference</p>
                  </div>
                </div>
              </div>

              {/* Input Forms */}
              <div className="mt-6">
                {(inputMethod === "text" || inputMethod === "combined") && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Describe your avatar:</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered h-24" 
                      placeholder="e.g., A cute anime-style girl with pink hair, wearing a cozy sweater, big expressive eyes..."
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                    ></textarea>
                  </div>
                )}

                {(inputMethod === "image" || inputMethod === "combined") && (
                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text font-semibold">Upload reference image:</span>
                    </label>
                    <input type="file" className="file-input file-input-bordered" accept="image/*" />
                  </div>
                )}
              </div>

              <div className="card-actions justify-end mt-6">
                <button 
                  className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none"
                  onClick={handleGenerate}
                  disabled={!textDescription.trim() && inputMethod !== "image"}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Generating...
                    </>
                  ) : (
                    "Generate Avatars"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Avatar */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-lg">
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
                        <p className="text-xs text-base-content/60">Avatar {index + 1}</p>
                      </div>
                    </div>
                    {selectedAvatar === index && (
                      <div className="mt-2 text-center">
                        <button className="btn btn-xs bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
                          Upscale
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Edit Options */}
              <div className="mt-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Want to refine? Edit your prompt:</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered h-20" 
                    placeholder="Modify your description to get better results..."
                    value={textDescription}
                    onChange={(e) => setTextDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="card-actions justify-between mt-6">
                <button className="btn btn-ghost" onClick={handleBack}>
                  ← Back
                </button>
                <div className="flex gap-2">
                  <button className="btn btn-outline">
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
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">Step 3: Your Avatar is Ready!</h2>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Preview */}
                <div className="flex-1">
                  <div className="aspect-square bg-gradient-to-br from-[#06b6d4]/20 to-[#6ecfe0]/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-[#06b6d4]/30 rounded-full mx-auto mb-4"></div>
                      <p className="text-lg font-semibold">Your Avatar</p>
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
                      Save to My Avatars
                    </button>
                    <button className="btn btn-block btn-outline">
                      Download with Variations
                    </button>
                  </div>

                  <div className="divider">Share</div>
                  
                  <div className="space-y-3">
                    <button className="btn btn-block btn-outline">
                      <svg className="w-5 h-5 mr-2" fill="#5865F2" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      Share to Discord
                    </button>
                    <button className="btn btn-block btn-outline">
                      <svg className="w-5 h-5 mr-2" fill="#FF0000" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Share to YouTube
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-between mt-6">
                <button className="btn btn-ghost" onClick={handleBack}>
                  ← Back
                </button>
                <div className="flex gap-2">
                  <Link href="/app/avatars">
                    <button className="btn btn-outline">
                      View My Avatars
                    </button>
                  </Link>
                  <Link href="/app/create">
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
    </div>
  );
}