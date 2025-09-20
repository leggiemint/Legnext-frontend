"use client";
import Image from "next/image";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export const dynamic = 'force-dynamic';

interface GeneratedImage {
  id: string;
  prompt: string;
  model: string | null;
  status: string;
  progress: number;
  imageUrl: string | null;
  storedImages: any; // JSON field from database
  createdAt: string;
  // Additional properties for UI state
  isFavorite?: boolean;
}

export default function ImagesPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status;
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fix hydration mismatch for date formatting
  useEffect(() => {
    setIsClient(true);
  }, []);

          // Fetch user's generated images
  useEffect(() => {
    const fetchImages = async () => {
      if (status === "loading") return;
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/avatars');
        if (!response.ok) {
          throw new Error('Failed to fetch generated images');
        }
        const data = await response.json();
        setImages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load generated images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [session, status]);

  const formatDate = (dateString: string) => {
    if (!isClient) {
      // 服务器端渲染时返回一个占位符，避免水合错误
      return 'Loading...';
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleFavorite = async (imageId: string) => {
    try {
      const currentImage = images.find(img => img.id === imageId);
      const newFavoriteState = !currentImage?.isFavorite;
      
      const response = await fetch(`/api/avatars/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newFavoriteState })
      });
      if (!response.ok) throw new Error('Failed to update favorite');
      
      setImages(prev => 
        prev.map(image => 
          image.id === imageId ? { ...image, isFavorite: newFavoriteState } : image
        )
      );
    } catch (err) {
      console.error('Error updating favorite:', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) 
        ? prev.filter(imageId => imageId !== id)
        : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    try {
      const response = await fetch('/api/avatars/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: selectedImages })
      });
      if (!response.ok) throw new Error('Failed to delete images');
      
      setImages(prev => prev.filter(image => !selectedImages.includes(image.id)));
      setSelectedImages([]);
      setIsSelecting(false);
    } catch (err) {
              console.error('Error deleting images:', err);
    }
  };

  const downloadSelected = async () => {
    try {
      // For now, download each image individually
      const selectedImagesData = images.filter(image => selectedImages.includes(image.id));
      
      for (const image of selectedImagesData) {
        const imageUrl = image.storedImages?.original?.url || image.imageUrl;
        if (imageUrl) {
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `generated-image-${image.id}.png`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Add delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setIsSelecting(false);
    } catch (err) {
              console.error('Error downloading images:', err);
    }
  };

  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
                      <h1 className="text-2xl font-bold">My Generated Images</h1>
          <p className="text-base-content/70">Loading your generated images...</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-200 shadow-lg animate-pulse">
              <div className="aspect-square bg-base-300"></div>
              <div className="card-body">
                <div className="h-4 bg-base-300 rounded w-3/4"></div>
                <div className="h-3 bg-base-300 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show login required state
  if (!session?.user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-32 h-32 bg-base-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Please log in to view your generated images</h3>
          <p className="text-base-content/60 mb-6">You need to be logged in to see and manage your generated images.</p>
          <Link href="/auth/signin">
            <button className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-32 h-32 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Failed to load generated images</h3>
          <p className="text-base-content/60 mb-6">{error}</p>
          <button 
            className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Generated Images</h1>
          <p className="text-base-content/70">
            {images.length} image{images.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <div className="flex gap-2">
          {isSelecting ? (
            <>
              <button 
                className="btn btn-ghost"
                onClick={() => {
                  setIsSelecting(false);
                  setSelectedImages([]);
                }}
              >
                Cancel
              </button>
              {selectedImages.length > 0 && (
                <>
                  <button 
                    className="btn btn-outline"
                    onClick={downloadSelected}
                  >
                    Download ({selectedImages.length})
                  </button>
                  <button 
                    className="btn btn-error"
                    onClick={deleteSelected}
                  >
                    Delete ({selectedImages.length})
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button 
                className="btn btn-ghost"
                onClick={() => setIsSelecting(true)}
                disabled={images.length === 0}
              >
                Select
              </button>
              <Link href="/app/midjourney">
                <button className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Generate New
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-32 h-32 bg-base-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No images generated yet</h3>
          <p className="text-base-content/60 mb-6">Generate your first AI image using Midjourney API to get started!</p>
          <Link href="/app/midjourney">
            <button className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none">
              Generate Your First Image
            </button>
          </Link>
        </div>
      ) : (
        /* Generated Images Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div 
              key={image.id} 
              className={`card bg-base-200 shadow-lg transition-all hover:shadow-xl ${
                selectedImages.includes(image.id) ? 'ring-2 ring-[#4f46e5]' : ''
              }`}
            >
              {/* Selection Checkbox */}
              {isSelecting && (
                <div className="absolute top-4 left-4 z-10">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary"
                    checked={selectedImages.includes(image.id)}
                    onChange={() => toggleSelect(image.id)}
                  />
                </div>
              )}

              {/* Generated Image Preview */}
              <div className="aspect-square bg-gradient-to-br from-[#4f46e5]/20 to-[#6366f1]/20 relative">
                {(image.imageUrl || image.storedImages?.original?.url) ? (
                  <Image 
                    src={image.storedImages?.original?.url || image.imageUrl || ''}
                    alt={`Generated image: ${image.prompt.substring(0, 30)}...`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-[#4f46e5]/30 rounded-full flex items-center justify-center">
                      {image.status === 'generating' ? (
                        <div className="loading loading-spinner loading-md text-[#4f46e5]"></div>
                      ) : (
                        <svg className="w-12 h-12 text-[#4f46e5]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Favorite Button */}
                <button 
                  className={`absolute top-4 right-4 btn btn-ghost btn-sm btn-circle ${
                    image.isFavorite ? 'text-red-500' : 'text-base-content/40'
                  }`}
                  onClick={() => toggleFavorite(image.id)}
                >
                  <svg className="w-5 h-5" fill={image.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Progress Badge */}
                {image.progress > 0 && image.progress < 100 && (
                  <div className="absolute bottom-4 left-4">
                    <div className="badge badge-sm badge-info">
                      {image.progress}%
                    </div>
                  </div>
                )}

                {/* Model Badge */}
                {image.model && (
                  <div className="absolute bottom-4 right-4">
                    <div className="badge badge-sm badge-primary">
                      {image.model.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                {image.status !== 'completed' && (
                  <div className="absolute top-4 left-4">
                    <div className={`badge badge-sm ${
                      image.status === 'generating' ? 'badge-warning' :
                      image.status === 'processing' ? 'badge-info' :
                      image.status === 'failed' ? 'badge-error' : 'badge-neutral'
                    }`}>
                      {image.status}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="card-title text-lg truncate">
                      {image.prompt.length > 30 ? `${image.prompt.substring(0, 30)}...` : image.prompt}
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Generated {isClient ? formatDate(image.createdAt) : 'Loading...'}
                    </p>
                    {image.prompt && (
                      <p className="text-xs text-base-content/50 mt-1 line-clamp-2">
                        &ldquo;{image.prompt}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Model Info */}
                {image.model && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-base-content/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Model: {image.model}
                    </div>
                  </div>
                )}

                <div className="card-actions justify-end mt-4">
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                      <li>
                        <button>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                      </li>
                      <li>
                        <button>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </li>
                      <li>
                        <button>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          Share
                        </button>
                      </li>
                      <li>
                        <button className="text-error">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                  <button className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none btn-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Favorites Section */}
      {images.some(image => image.isFavorite) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            <svg className="w-5 h-5 inline mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorite Images
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.filter(image => image.isFavorite).map((image) => (
              <div key={image.id} className="aspect-square bg-gradient-to-br from-[#4f46e5]/20 to-[#6366f1]/20 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  {(image.imageUrl || image.storedImages?.original?.url) ? (
                    <Image 
                      src={image.storedImages?.original?.url || image.imageUrl || ''}
                      alt={`Generated: ${image.prompt.substring(0, 20)}...`}
                      width={64}
                      height={64}
                      className="rounded-lg mx-auto mb-2 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#4f46e5]/30 rounded-lg mx-auto mb-2"></div>
                  )}
                  <p className="text-sm font-medium truncate">
                    {image.prompt.length > 15 ? `${image.prompt.substring(0, 15)}...` : image.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}