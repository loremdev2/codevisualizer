"use client";

import { useState } from "react";
import { HeartHandshake, MessageSquare } from "lucide-react";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { Button } from "@/components/ui/button";

/**
 * A friendly mission + honesty note for the marketing/learning pages:
 * DSA Lab exists to help students and learners, and visualization is never
 * guaranteed perfect — so we invite users to report anything that looks wrong.
 */
export function LearnerNote() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <section
      aria-label="About this project"
      className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card"
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Built to help you learn</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            DSA Lab exists for one reason: to help students and learners actually understand algorithms —
            by watching every step, not just memorizing the answer. It&apos;s free, and it&apos;s made
            with that goal in mind.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            One honest note: visualizations are generated from real code traces, and we check them
            against known answers — but no tool is perfect. If a step ever looks wrong or confusing,
            it probably is. Tell us and we&apos;ll fix it.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setFeedbackOpen(true)}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              Send feedback
            </Button>
          </div>
        </div>
      </div>

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </section>
  );
}
