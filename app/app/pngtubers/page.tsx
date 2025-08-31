"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Avatar {
  id: number;
  name: string;
  createdAt: string;
  isFavorite: boolean;
  hasAnimations: boolean;
  format: "PNG" | "GIF" | "MP4";
}

// Mock data - replace with real data from your API
const mockAvatars: Avatar[] = [
  {
    id: 1,
    name: "Cute Anime Girl",
    createdAt: "2024-01-15",
    isFavorite: true,
    hasAnimations: false,
    format: "PNG",
  },
  {
    id: 2,
    name: "Cool Robot Character",
    createdAt: "2024-01-14",
    isFavorite: false,
    hasAnimations: true,
    format: "GIF",
  },
  {
    id: 3,
    name: "Fantasy Wizard",
    createdAt: "2024-01-13",
    isFavorite: false,
    hasAnimations: false,
    format: "PNG",
  },
];

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>(mockAvatars);
  const [selectedAvatars, setSelectedAvatars] = useState<number[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch for date formatting
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleFavorite = (id: number) => {
    setAvatars(prev => 
      prev.map(avatar => 
        avatar.id === id ? { ...avatar, isFavorite: !avatar.isFavorite } : avatar
      )
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedAvatars(prev => 
      prev.includes(id) 
        ? prev.filter(avatarId => avatarId !== id)
        : [...prev, id]
    );
  };

  const deleteSelected = () => {
    setAvatars(prev => prev.filter(avatar => !selectedAvatars.includes(avatar.id)));
    setSelectedAvatars([]);
    setIsSelecting(false);
  };

  const downloadSelected = () => {
    // Implement batch download functionality
    console.log("Downloading avatars:", selectedAvatars);
    setIsSelecting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Avatars</h1>
          <p className="text-base-content/70">
            {avatars.length} avatar{avatars.length !== 1 ? 's' : ''} created
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
              <Link href="/app/create">
                <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
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
          <h3 className="text-xl font-semibold mb-2">No avatars yet</h3>
          <p className="text-base-content/60 mb-6">Create your first PNGTuber avatar to get started!</p>
          <Link href="/app/create">
            <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
              Create Your First Avatar
            </button>
          </Link>
        </div>
      ) : (
        /* Avatar Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {avatars.map((avatar) => (
            <div 
              key={avatar.id} 
              className={`card bg-base-200 shadow-lg transition-all hover:shadow-xl ${
                selectedAvatars.includes(avatar.id) ? 'ring-2 ring-[#06b6d4]' : ''
              }`}
            >
              {/* Selection Checkbox */}
              {isSelecting && (
                <div className="absolute top-4 left-4 z-10">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary"
                    checked={selectedAvatars.includes(avatar.id)}
                    onChange={() => toggleSelect(avatar.id)}
                  />
                </div>
              )}

              {/* Avatar Preview */}
              <div className="aspect-square bg-gradient-to-br from-[#06b6d4]/20 to-[#6ecfe0]/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-[#06b6d4]/30 rounded-full"></div>
                </div>
                
                {/* Favorite Button */}
                <button 
                  className={`absolute top-4 right-4 btn btn-ghost btn-sm btn-circle ${
                    avatar.isFavorite ? 'text-red-500' : 'text-base-content/40'
                  }`}
                  onClick={() => toggleFavorite(avatar.id)}
                >
                  <svg className="w-5 h-5" fill={avatar.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Format Badge */}
                <div className="absolute bottom-4 left-4">
                  <div className={`badge badge-sm ${avatar.format === 'PNG' ? 'badge-neutral' : avatar.format === 'GIF' ? 'badge-success' : 'badge-warning'}`}>
                    {avatar.format}
                  </div>
                </div>

                {/* Animation Badge */}
                {avatar.hasAnimations && (
                  <div className="absolute bottom-4 right-4">
                    <div className="badge badge-sm badge-primary">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.5 15.584V8.416a.5.5 0 0 1 .77-.42l5.576 3.583a.5.5 0 0 1 0 .842l-5.576 3.584a.5.5 0 0 1-.77-.42Z"/>
                      </svg>
                      Animated
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
                {!avatar.hasAnimations && (
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
                  <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none btn-sm">
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
              <div key={avatar.id} className="aspect-square bg-gradient-to-br from-[#06b6d4]/20 to-[#6ecfe0]/20 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#06b6d4]/30 rounded-full mx-auto mb-2"></div>
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