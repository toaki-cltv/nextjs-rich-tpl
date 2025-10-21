"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-dvh font-sans flex flex-col items-center justify-center px-4">
          <div className="relative py-16 md:py-24 text-center max-w-2xl">
            <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none mask-[radial-gradient(ellipse_at_center,black,transparent_70%)] overflow-hidden">
              <div className="w-[min(400px,100vw)] h-[min(400px,100vw)] bg-radial from-red-500/40 to-transparent rounded-full blur-3xl mx-auto" />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
              Critical Error
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
              A critical error occurred. Please try again.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-8 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex h-11 items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 px-6 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition whitespace-nowrap"
              >
                Go back home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
