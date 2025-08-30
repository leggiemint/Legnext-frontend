import Link from "next/link";

// Simple 404 page with a button to go home and a button to contact support
export default function Custom404() {
  return (
    <section className="relative bg-base-100 text-base-content min-h-screen w-full flex flex-col justify-center gap-8 items-center p-10">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold text-[#06b6d4]">404</h1>
          <p className="text-lg md:text-xl font-semibold text-base-content">
            This page doesn&apos;t exist 😅
          </p>
          <p className="text-base-content/60 max-w-md mx-auto">
            The page you&apos;re looking for might have been moved, deleted, or never existed.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>

          <Link href="/contact" className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            Support
          </Link>
        </div>
      </div>
    </section>
  );
}
