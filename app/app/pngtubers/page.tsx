"use client";
import Image from "next/image";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Avatar {
  _id: string;
  avatarId: string;
  name: string;
  createdAt: string;
  isFavorite: boolean;
  animations: {
    hasAnimations: boolean;
  };
  metadata: {
    format: string;
  };
  images: {
    thumbnail?: {
      url: string;
    };
    original?: {
      url: string;
    };
  };
  status: string;
}

export default function AvatarsPage() {
  const { data: session, status } = useSession();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatars, setSelectedAvatars] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fix hydration mismatch for date formatting
  useEffect(() => {
    setIsClient(true);
  }, []);

          // Fetch user's PngTubers
  useEffect(() => {
    const fetchAvatars = async () => {
      if (status === "loading") return;
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/avatars');
        if (!response.ok) {
          throw new Error('Failed to fetch PngTubers');
        }
        const data = await response.json();
        setAvatars(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PngTubers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();
  }, [session, status]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleFavorite = async (avatarId: string) => {
    try {
      const response = await fetch(`/api/avatars/${avatarId}/favorite`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to update favorite');
      
      setAvatars(prev => 
        prev.map(avatar => 
          avatar._id === avatarId ? { ...avatar, isFavorite: !avatar.isFavorite } : avatar
        )
      );
    } catch (err) {
      console.error('Error updating favorite:', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedAvatars(prev => 
      prev.includes(id) 
        ? prev.filter(avatarId => avatarId !== id)
        : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    try {
      const response = await fetch('/api/avatars/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarIds: selectedAvatars })
      });
      if (!response.ok) throw new Error('Failed to delete PngTubers');
      
      setAvatars(prev => prev.filter(avatar => !selectedAvatars.includes(avatar._id)));
      setSelectedAvatars([]);
      setIsSelecting(false);
    } catch (err) {
              console.error('Error deleting PngTubers:', err);
    }
  };

  const downloadSelected = async () => {
    try {
      const response = await fetch('/api/avatars/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarIds: selectedAvatars })
      });
      if (!response.ok) throw new Error('Failed to download PngTubers');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'avatars.zip';
      a.click();
      window.URL.revokeObjectURL(url);
      
      setIsSelecting(false);
    } catch (err) {
              console.error('Error downloading PngTubers:', err);
    }
  };

  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
                      <h1 className="text-2xl font-bold">My PngTubers</h1>
          <p className="text-base-content/70">Loading your PngTubers...</p>
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
          <h3 className="text-xl font-semibold mb-2">Please log in to view your PngTubers</h3>
          <p className="text-base-content/60 mb-6">You need to be logged in to see and manage your PngTubers.</p>
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
          <h3 className="text-xl font-semibold mb-2">Failed to load PngTubers</h3>
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
          <h1 className="text-2xl font-bold">My PngTubers</h1>
          <p className="text-base-content/70">
            {avatars.length} PngTuber{avatars.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <div className="flex gap-2">
          {isSelecting ? (
            <>
              <button 
                className="btn btn-ghost"
                onClick={() => {
                  setIsSelecting(false);
                  setSelectedAvatars([]);
                }}
              >
                Cancel
              </button>
              {selectedAvatars.length > 0 && (
                <>
                  <button 
                    className="btn btn-outline"
                    onClick={downloadSelected}
                  >
                    Download ({selectedAvatars.length})
                  </button>
                  <button 
                    className="btn btn-error"
                    onClick={deleteSelected}
                  >
                    Delete ({selectedAvatars.length})
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button 
                className="btn btn-ghost"
                onClick={() => setIsSelecting(true)}
                disabled={avatars.length === 0}
              >
                Select
              </button>
              <Link href="/app/pngtuber-maker">
                <button className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create New
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {avatars.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-32 h-32 bg-base-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No PngTubers yet</h3>
          <p className="text-base-content/60 mb-6">Create your first PNGTuber avatar to get started!</p>
          <Link href="/app/pngtuber-maker">
            <button className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none">
              Create Your First PngTuber
            </button>
          </Link>
        </div>
      ) : (
        /* PngTuber Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {avatars.map((avatar) => (
            <div 
              key={avatar._id} 
              className={`card bg-base-200 shadow-lg transition-all hover:shadow-xl ${
                selectedAvatars.includes(avatar._id) ? 'ring-2 ring-[#4f46e5]' : ''
              }`}
            >
              {/* Selection Checkbox */}
              {isSelecting && (
                <div className="absolute top-4 left-4 z-10">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary"
                    checked={selectedAvatars.includes(avatar._id)}
                    onChange={() => toggleSelect(avatar._id)}
                  />
                </div>
              )}

              {/* PngTuber Preview */}
              <div className="aspect-square bg-gradient-to-br from-[#4f46e5]/20 to-[#6366f1]/20 relative">
                {avatar.images?.thumbnail?.url ? (
                  <Image 
                    src={avatar.images.thumbnail.url}
                    alt={avatar.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-[#4f46e5]/30 rounded-full"></div>
                  </div>
                )}
                
                {/* Favorite Button */}
                <button 
                  className={`absolute top-4 right-4 btn btn-ghost btn-sm btn-circle ${
                    avatar.isFavorite ? 'text-red-500' : 'text-base-content/40'
                  }`}
                  onClick={() => toggleFavorite(avatar._id)}
                >
                  <svg className="w-5 h-5" fill={avatar.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Format Badge */}
                <div className="absolute bottom-4 left-4">
                  <div className={`badge badge-sm ${
                    avatar.metadata.format === 'png' ? 'badge-neutral' : 
                    avatar.metadata.format === 'gif' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {avatar.metadata.format?.toUpperCase() || 'PNG'}
                  </div>
                </div>

                {/* Animation Badge */}
                {avatar.animations?.hasAnimations && (
                  <div className="absolute bottom-4 right-4">
                    <div className="badge badge-sm badge-primary">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.5 15.584V8.416a.5.5 0 0 1 .77-.42l5.576 3.583a.5.5 0 0 1 0 .842l-5.576 3.584a.5.5 0 0 1-.77-.42Z"/>
                      </svg>
                      Animated
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                {avatar.status !== 'completed' && (
                  <div className="absolute top-4 left-4">
                    <div className={`badge badge-sm ${
                      avatar.status === 'generating' ? 'badge-warning' :
                      avatar.status === 'processing' ? 'badge-info' :
                      avatar.status === 'failed' ? 'badge-error' : 'badge-neutral'
                    }`}>
                      {avatar.status}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="card-title text-lg">{avatar.name}</h2>
                    <p className="text-sm text-base-content/60">
                      Created {isClient ? formatDate(avatar.createdAt) : 'Loading...'}
                    </p>
                  </div>
                </div>

                {/* Coming Soon for animations */}
                {!avatar.animations?.hasAnimations && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-base-content/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Animations: Coming Soon
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
      {avatars.some(avatar => avatar.isFavorite) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            <svg className="w-5 h-5 inline mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorites
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {avatars.filter(avatar => avatar.isFavorite).map((avatar) => (
              <div key={avatar._id} className="aspect-square bg-gradient-to-br from-[#4f46e5]/20 to-[#6366f1]/20 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  {avatar.images?.thumbnail?.url ? (
                    <Image 
                      src={avatar.images.thumbnail.url}
                      alt={avatar.name}
                      width={64}
                      height={64}
                      className="rounded-full mx-auto mb-2 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#4f46e5]/30 rounded-full mx-auto mb-2"></div>
                  )}
                  <p className="text-sm font-medium">{avatar.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}