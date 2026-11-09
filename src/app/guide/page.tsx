import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Code2, Columns2, Database, PlayCircle, Route, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DemoSection } from "@/components/demo-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Guide",
  alternates: { canonical: "/guide" },
  description:
    "How DSA Lab works: paste JavaScript, TypeScript, or Python, add JSON input, and step through the algorithm state by state — arrays, pointers, maps, graphs, and recursion. Every run ends in a clear pass/fail verdict.",
};

const steps = [
  {
    icon: Code2,
    title: "Paste JavaScript, TypeScript, or Python",
    copy: "Use ordinary code in any of the three languages — switching rewrites the solution automatically. The visualizer observes arrays, pointers, maps, queues, graph nodes, trees, and recursion frames.",
  },
  {
    icon: Database,
    title: "Add JSON input",
    copy: "Use the Input tab for the data your code expects — { \"array\": [4, 1, 3] } or { \"graph\": { \"A\": [\"B\"] } } — with one-click edge cases for common scenarios.",
  },
  {
    icon: PlayCircle,
    title: "Control the trace",
    copy: "Hit Run, then play, pause, jump through states, or drag the timeline. Space plays, ←/→ step, Home/End jump — and the active code line follows along.",
  },
];

const capabilities = [
  {
    icon: BookOpen,
    title: "Top Interview 150 bank",
    copy: "Every question from the Top Interview 150, grouped by topic with difficulty and tags. Each one opens in the visualizer with its solution, input, and answer ready to run.",
    href: "/learn",
    cta: "Browse the 150",
  },
  {
    icon: Route,
    title: "Guided learning paths",
    copy: "Arrays → Two pointers → Sliding window → Recursion → Trees → Graphs → DP. Traceable templates in a guided order keep your practice structured, not scattered.",
    href: "/learn",
    cta: "Start a path",
  },
  {
    icon: BadgeCheck,
    title: "Instant pass/fail verdicts",
    copy: "Every traceable question ships with its known answer, so your run is graded automatically — even your own edited code — with a clear ✅ Pass or ❌ Fail in the Result tab.",
  },
  {
    icon: Columns2,
    title: "Compare & measure",
    copy: "Toggle Compare to run brute force side-by-side with the optimal solution, and watch the ⚖ comparisons, 🔄 swaps, and ✍ writes counters diverge as you step.",
  },
];

export default function GuidePage() {
  return (
    <>
      <main className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">

        <section className="max-w-3xl py-16 sm:py-24">
          <p className="text-sm font-medium text-primary">Getting started</p>
          <h1 className="mt-3 text-4xl font-medium tracking-normal sm:text-5xl">Understand the execution, not just the answer.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            DSA Lab helps you inspect the state that interview questions hide: moving pointers, changing maps, search bounds,
            tree swaps, graph visits, and recursive calls — then tells you whether your solution actually passes.
          </p>
        </section>

        <section className="grid gap-px border bg-border md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h2 className="mt-10 text-xl font-medium">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p>
              </article>
            );
          })}
        </section>

        <section className="py-16 md:py-20">
          <DemoSection />
        </section>

        <section className="border-t pt-16 md:pt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Built for interview prep</p>
            <h2 className="mt-2 text-3xl font-medium tracking-normal sm:text-4xl">Beyond the sandbox.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The same engine that traces your pasted code powers a full practice curriculum — verified answers, learning paths, and
              comparisons so you know you&apos;re getting it right.
            </p>
          </div>
          <div className="mt-10 grid gap-px border bg-border md:grid-cols-2">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <article key={cap.title} className="bg-card p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    {cap.href ? (
                      <Link
                        href={cap.href}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {cap.cta}
                        <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                  <h3 className="mt-8 text-lg font-medium">{cap.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{cap.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 py-16 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="text-2xl font-medium">New here? Take the tour.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A 30-second guided walkthrough of the visualizer — every panel, the operation counters, language switching,
              and the compare mode, with a live trace running underneath.
            </p>
            <div className="mt-5">
              <Button asChild>
                <Link href="/visualizer?tour=1">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Start the guided tour
                </Link>
              </Button>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-medium">Best results</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Start with the included presets, or paste a single algorithm function in JavaScript, TypeScript, or Python and
              keep the input serializable as JSON. The expected answer is pre-filled, so your run is graded the moment it finishes.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 border-t py-8">
          <Button asChild size="lg">
            <Link href="/visualizer">
              Start practicing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/learn">
              Browse the 150
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
