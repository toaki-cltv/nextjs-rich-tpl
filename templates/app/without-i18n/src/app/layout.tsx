import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  };
}

// config
import siteConfig from "../../richtpl.config";

import { headers } from "next/headers";

import { Toaster } from "sonner";
import AdaptiveThemeProvider from "@/components/providers/AdaptiveThemeProvider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export async function generateMetadata(): Promise<Metadata> {
  const header = await headers();
  const origin = header.get("x-origin") ?? siteConfig.url;
  const url = header.get("x-url") ?? siteConfig.url;

  // titleの値を判別
  const titleData = siteConfig.themeConfig?.metadata?.title;
  const title =
    typeof titleData === "string"
      ? titleData
      : titleData && "default" in titleData
        ? titleData.default
        : titleData && "absolute" in titleData
          ? titleData.absolute
          : siteConfig.title
            ? siteConfig.title
            : "Next.js Rich Tpl";

  return {
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: siteConfig.description,
    referrer: "origin-when-cross-origin",
    keywords: ["Vercel", "Next.js"],
    authors: siteConfig.themeConfig?.metadata?.authors ?? [
      { name: "Toa Kiryu", url: "https://toakiryu.com" },
    ],
    creator: "Toa Kiryu",
    icons: siteConfig.favicon ?? "/favicon.ico",
    generator: "Next.js",
    publisher: "Vercel",
    robots: "follow, index",
    openGraph: {
      type: "website",
      siteName: title,
      url: url,
      images: siteConfig.themeConfig.image,
      locale: "ja-JP",
    },
    twitter: {
      card: "summary_large_image",
      site: `@${siteConfig.themeConfig?.metadata?.creator ?? "Toa Kiryu"}`,
      creator: `@${siteConfig.themeConfig?.metadata?.creator ?? "Toa Kiryu"}`,
      images: siteConfig.themeConfig.image,
    },
    ...siteConfig.themeConfig?.metadata,
    metadataBase: new URL(
      origin ??
        siteConfig.themeConfig?.metadata?.metadataBase ??
        siteConfig.url,
    ),
  };
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body
        className={`bg-linear-to-bl from-background to-foreground/5 relative w-full h-full overflow-x-clip ${geistSans.variable} ${geistMono.variable} antialiased scrollbar-hidden`}
        suppressHydrationWarning
      >
        <AdaptiveThemeProvider
          defaultTheme={siteConfig.themeConfig.colorMode.defaultMode}
          custom={siteConfig.themeConfig.colorMode.custom}
        >
          <SmoothScrollProvider>
            <Toaster />
            {children}
          </SmoothScrollProvider>
        </AdaptiveThemeProvider>
      </body>
    </html>
  );
}
