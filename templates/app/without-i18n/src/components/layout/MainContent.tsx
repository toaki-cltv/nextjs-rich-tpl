"use client";

import Link from "next/link";

export function MainContent() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none mask-[radial-gradient(ellipse_at_center,black,transparent_70%)] overflow-hidden">
          <div className="w-[min(800px,100vw)] h-[min(800px,100vw)] md:w-[min(1000px,100vw)] md:h-[min(1000px,100vw)] bg-radial from-primary/40 to-transparent rounded-full blur-3xl mx-auto" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center">
          Build quickly with a clean, modern baseline
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground text-center max-w-2xl mx-auto">
          A pragmatic Next.js starter with i18n, theming, and sensible defaults.
          No fluff, just what you need to ship.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#features"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground text-background px-5 text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
          >
            Explore features
          </Link>
          <Link
            href="#usage"
            className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium hover:bg-foreground/5 transition whitespace-nowrap"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Fast and minimal",
              desc: "Lean UI with Tailwind and no unnecessary assets.",
            },
            {
              title: "Internationalization",
              desc: "Ready-to-use i18n with locale-aware routing.",
            },
            {
              title: "Light/Dark themes",
              desc: "Built-in theme toggle with persistence.",
            },
          ].map((f, i) => (
            <article
              key={i}
              className="group rounded-xl border bg-card text-card-foreground p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-base md:text-lg font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Usage */}
      <section id="usage" className="py-12 md:py-16">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl md:text-2xl font-bold">How to use</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Kick off your project with a few simple steps.
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-xs">
                1
              </span>
              <span className="flex-1">
                Clone the template and install dependencies.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-xs">
                2
              </span>
              <span className="flex-1">
                Update brand, metadata, and routes.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-xs">
                3
              </span>
              <span className="flex-1">Deploy to your platform of choice.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
