import { LearnerNote } from "@/components/learner-note";
import { LearnErrorBoundary } from "@/components/learn/error-boundary";
import { QuestionBanks } from "@/components/learn/question-banks";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn",
  alternates: { canonical: "/learn" },
  description:
    "The Top Interview 150 and NeetCode Roadmap question banks, plus a Sorting Algorithms bank — all with runnable solutions in JavaScript, TypeScript, Python, Java, and C++.",
};

export default function LearnPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <section className="max-w-3xl py-12 sm:py-16">
          <p className="text-sm font-medium text-primary">Practice</p>
          <h1 className="mt-3 text-4xl font-medium tracking-normal sm:text-5xl">Learn</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Work through the Top Interview 150 or the NeetCode Roadmap question by question, or watch
            the Sorting Algorithms bank sort arrays step by step. Every traced problem and algorithm
            runs in the visualizer with solutions in JavaScript, TypeScript, Python, Java, and C++.
            Sign in to sync your progress across devices — or work offline and it stays on this device.
          </p>
        </section>

        <div className="mt-10">
          <LearnerNote />
        </div>

        <section className="mt-14 max-w-3xl">
          <p className="text-sm font-medium text-primary">Question banks</p>
          <h2 className="mt-2 text-3xl font-medium tracking-normal sm:text-4xl">Pick a bank</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Three ways to practice: the two curated lists of classic interview problems, and the
            Sorting Algorithms bank. In the question banks, every problem with a
            <b className="text-foreground"> Visualize </b>
            button opens instantly in the tracer with the canonical solution and its example input
            already loaded; the rest show a
            <b className="text-foreground"> Coming soon </b>
            tag until their templates land. In the sorting bank, each algorithm opens the same way
            and ships its implementation in all five languages.
          </p>
        </section>
        <div className="mt-8">
          <LearnErrorBoundary>
            <QuestionBanks />
          </LearnErrorBoundary>
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
