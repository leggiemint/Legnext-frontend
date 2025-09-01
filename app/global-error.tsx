"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <section className="relative bg-white text-gray-900 min-h-screen w-full flex flex-col justify-center gap-8 items-center p-10">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-bold text-[#4f46e5]">Error</h1>
              <p className="text-lg md:text-xl font-semibold text-gray-900">
                Something went wrong! 🥲
              </p>
              <p className="text-gray-600 max-w-md mx-auto">
                We&apos;ve been notified about this error and will look into it.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={reset}
                className="btn bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}