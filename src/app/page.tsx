import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, CirclePlay, GitBranch, Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BragVideo } from "@/components/brag-video";
import { DemoSection } from "@/components/demo-section";
import { HeroDemo } from "@/components/hero-demo";
import { LearnPreview } from "@/components/learn-preview";
import { LearnerNote } from "@/components/learner-note";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import {
  BRAG_VIDEO_HEIGHT,
  BRAG_VIDEO_PATH,
  BRAG_VIDEO_POSTER_PATH,
  BRAG_VIDEO_WIDTH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/algorithm-workspace-hero.png", width: 1200, height: 630, alt: "DSA Lab visualizer workspace" }],
    videos: [
      {
        // og:video must be absolute — Next only resolves image URLs against
        // metadataBase, so build the full URL here.
        url: `${SITE_URL}${BRAG_VIDEO_PATH}`,
        width: BRAG_VIDEO_WIDTH,
        height: BRAG_VIDEO_HEIGHT,
        type: "video/mp4",
      },
    ],
  },
  twitter: {
    card: "player",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    // X requires an https player page; fall back to the large image card
    // when the site runs on localhost during development.
    ...(SITE_URL.startsWith("http://localhost")
      ? { images: [BRAG_VIDEO_POSTER_PATH] }
      : {
          players: {
            playerUrl: SITE_URL,
            streamUrl: `${SITE_URL}${BRAG_VIDEO_PATH}`,
            width: BRAG_VIDEO_WIDTH,
            height: BRAG_VIDEO_HEIGHT,
          },
        }),
  },
};

const features = [
  {
    icon: CirclePlay,
    title: "Trace each move",
    description: "Run code in a focused sandbox and move through every useful state at your own pace.",
  },
  {
    icon: Layers3,
    title: "See the structures",
    description: "Arrays, hash maps, windows, stacks, queues, graphs, and recursive call stacks stay visible.",
  },
  {
    icon: Braces,
    title: "Use your own code",
    description: "Paste JavaScript or TypeScript, add JSON input, and get an inferred trace without writing custom visualization code.",
  },
  {
    icon: GitBranch,
    title: "Keep a practice library",
    description: "Sign in to save named solutions by topic, then return to them whenever you want to practice.",
  },
];

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
      <SiteNav variant="overlay" />

      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:pb-20 lg:pt-32">
        {/* Background image with gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07] dark:opacity-[0.12]"
          style={{ backgroundImage: "url(/algorithm-workspace-hero.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-950/95 to-neutral-900 dark:from-background dark:via-background/95 dark:to-primary/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          {/* Copy side */}
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-normal text-primary">
              Practice algorithms visually
            </p>
            <h1 className="text-4xl font-medium leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              DSA Lab
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              A code visualizer for understanding what an algorithm is doing, one state at a time.
              Paste your code, run the trace, and step through every comparison, swap, and call.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/visualizer">
                  Open visualizer
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/guide">How it works</Link>
              </Button>
            </div>
          </div>

          {/* Live demo side */}
          <div className="flex justify-center lg:justify-end">
            <HeroDemo />
          </div>
        </div>
      </section>

      <section className="border-b bg-background px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Built for interview practice</p>
            <h2 className="mt-2 text-3xl font-medium tracking-normal sm:text-4xl">
              Make the invisible parts of code visible.
            </h2>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="bg-card p-6">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <LearnPreview />
        </div>
      </section>

      <section className="border-y bg-muted/40 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <DemoSection />
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <h2 className="text-3xl font-medium tracking-normal sm:text-4xl">
            From pasted code to a useful explanation.
          </h2>
          <ol className="space-y-5">
            {[
              "Paste an algorithm and provide JSON input.",
              "Run the trace to infer changes in variables and data structures.",
              "Step forward, back, or play the animation while the active line stays in focus.",
            ].map((step, index) => (
              <li key={step} className="flex gap-4 border-t pt-5">
                <span className="font-mono text-sm text-primary">0{index + 1}</span>
                <p className="text-base leading-7">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y bg-muted/40 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium text-primary">Watch it in 25 seconds — with narration</p>
            <h2 className="mt-2 text-3xl font-medium tracking-normal sm:text-4xl">
              You can read code. Now watch it think.
            </h2>
          </div>
          <BragVideo />
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <LearnerNote />
        </div>
      </section>
      </main>
      <SiteFooter />
    </>
  );
}
