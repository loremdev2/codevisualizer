import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BackToTop } from "@/components/back-to-top";
import { MobileHint } from "@/components/mobile-hint";
import { SearchProvider } from "@/components/search-trigger";
import { ThemeInitScript } from "@/components/theme-init";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AUTHOR_LINKEDIN, AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME, url: AUTHOR_LINKEDIN }],
  keywords: [
    "algorithm visualizer",
    "data structures",
    "DSA practice",
    "code tracing",
    "Top Interview 150 question bank",
    "interview prep",
  ],
  // NOTE: no canonical here. Root-layout metadata is inherited by every route,
  // so a canonical of "/" would make Google treat /learn, /guide, /docs… as
  // duplicates of the homepage and drop them from the index. Each page sets
  // its own canonical instead.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "FNUa1AciQ9Yud4MaBkU0fb1i3TRC3HeqdbEjzROyIdk",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        {/* Injects the pre-paint theme script via useServerInsertedHTML so it
            stays out of the React tree (no script-tag warning on hydration). */}
        <ThemeInitScript />
        <MobileHint />
        <SearchProvider>
          <TooltipProvider delayDuration={300}>
          {children}
        <BackToTop />
        {/* App-wide toast/snackbar host — store-based, so any client code can
            call toast() without a provider. */}
        <Toaster />
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: SITE_NAME,
                  url: SITE_URL,
                  description: SITE_DESCRIPTION,
                  author: {
                    "@type": "Person",
                    name: AUTHOR_NAME,
                    url: AUTHOR_LINKEDIN,
                  },
                },
                {
                  "@type": "Organization",
                  name: SITE_NAME,
                  url: SITE_URL,
                  description: SITE_DESCRIPTION,
                  founder: {
                    "@type": "Person",
                    name: AUTHOR_NAME,
                    url: AUTHOR_LINKEDIN,
                  },
                },
                {
                  "@type": "Person",
                  name: AUTHOR_NAME,
                  url: AUTHOR_LINKEDIN,
                  sameAs: [AUTHOR_LINKEDIN],
                },
              ],
            }),
          }}
        />
          </TooltipProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
