"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/midjourney");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-[#4f46e5]"></div>
        <p className="mt-4 text-gray-600">Redirecting to Midjourney API...</p>
      </div>
    </div>
  );
} 
