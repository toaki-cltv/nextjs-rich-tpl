"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function MainContent() {
  const t = useTranslations("pages.home");

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none mask-[radial-gradient(ellipse_at_center,black,transparent_70%)] overflow-hidden">
          <div className="w-[min(800px,100vw)] h-[min(800px,100vw)] md:w-[min(1000px,100vw)] md:h-[min(1000px,100vw)] bg-radial from-primary/40 to-transparent rounded-full blur-3xl mx-auto" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center">
          {t("hero.title")}
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground text-center max-w-2xl mx-auto">
          {t("hero.subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#features"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground text-background px-5 text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
          >
            {t("cta.explore")}
          </Link>
          <Link
            href="#usage"
            className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium hover:bg-foreground/5 transition whitespace-nowrap"
          >
            {t("cta.getStarted")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: t("features.perf.title"),
              desc: t("features.perf.desc"),
            },
            {
              title: t("features.i18n.title"),
              desc: t("features.i18n.desc"),
            },
            {
              title: t("features.theme.title"),
              desc: t("features.theme.desc"),
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
          <h2 className="text-xl md:text-2xl font-bold">{t("usage.title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("usage.desc")}
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-xs">
                1
              </span>
              <span className="flex-1">{t("usage.step1")}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-xs">
                2
              </span>
              <span className="flex-1">{t("usage.step2")}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-xs">
                3
              </span>
              <span className="flex-1">{t("usage.step3")}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
