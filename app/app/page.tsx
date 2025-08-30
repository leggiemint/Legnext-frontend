"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/pngtuber-maker");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-[#06b6d4]"></div>
        <p className="mt-4 text-gray-600">Redirecting to PngTuber Maker...</p>
      </div>
    </div>
  );
} 
