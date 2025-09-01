"use client";

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useSession, signIn } from 'next-auth/react';

interface FileUploadProps {
  onFileUploaded: (fileData: {
    url: string;
    fileKey: string;
    fileName: string;
  }) => void;
  type?: 'reference' | 'avatar' | 'expression';
  maxSize?: number; // in bytes
  accept?: string;
  className?: string;
}

export default function FileUpload({
  onFileUploaded,
  type = 'reference',
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = 'image/*',
  className = ''
}: FileUploadProps) {
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查用户登录状态
    if (status === 'unauthenticated') {
      toast.error('Please login to upload files');
      signIn(undefined, { callbackUrl: '/app/pngtuber-maker' });
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // 验证文件大小
    if (file.size > maxSize) {
      toast.error(`File size too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB allowed.`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      if (result.success) {
        const fileData = {
          url: result.url,
          fileKey: result.fileKey,
          fileName: result.fileName,
        };

        onFileUploaded(fileData);
        toast.success('File uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    // 检查用户登录状态
    if (status === 'unauthenticated') {
      toast.error('Please login to upload files');
      signIn(undefined, { callbackUrl: '/app/pngtuber-maker' });
      return;
    }
    
    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    
    // 模拟文件选择事件
    const mockEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileSelect(mockEvent);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUploadClick = () => {
    // 检查用户登录状态
    if (status === 'unauthenticated') {
      toast.error('Please login to upload files');
      signIn(undefined, { callbackUrl: '/app/pngtuber-maker' });
      return;
    }
    fileInputRef.current?.click();
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleUploadClick}
      >
        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="loading loading-spinner loading-md text-[#06b6d4]"></div>
              <p className="text-xs text-gray-500 mt-2">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 text-gray-400 hover:text-[#06b6d4] transition-colors mx-auto mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">Upload Image</p>
              <p className="text-xs text-gray-400 mt-1">or drag & drop</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );
}
