"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 md:mt-16 border-t">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Next.js Rich Template</p>
          <div className="flex items-center gap-4">
            <Link className="hover:underline" href="/" aria-label="home">
              Home
            </Link>
            <Link className="hover:underline" href="#features">
              Features
            </Link>
            <Link className="hover:underline" href="#usage">
              Usage
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
