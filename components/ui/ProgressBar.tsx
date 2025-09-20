"use client";

import { useState, useEffect } from "react";

interface ProgressBarProps {
  isVisible: boolean;
  duration?: number; // 总时长（毫秒）
  onComplete?: () => void;
  label?: string;
}

export default function ProgressBar({ 
  isVisible, 
  duration = 60000, // 默认60秒
  onComplete,
  label = "Processing..."
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 100); // 每100ms更新一次

    return () => clearInterval(interval);
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#4f46e5] h-2.5 rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          Estimated time: {Math.max(0, Math.ceil((duration - (progress / 100) * duration) / 1000))}s remaining
        </span>
      </div>
    </div>
  );
}
