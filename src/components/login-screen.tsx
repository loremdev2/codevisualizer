"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthLoaderScreen } from "@/components/auth-loader-screen";
import { signInWithGoogle } from "@/lib/auth/hooks";

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = () => {
    setIsLoading(true);
    signInWithGoogle("/visualizer");
  };

  if (isLoading) {
    return (
      <AuthLoaderScreen
        title="Signing you in..."
        subtitle="Connecting securely with Google"
        statusText="Taking you to Google Sign-In..."
        step={1}
      />
    );
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-foreground px-5 py-8">
      <div className="absolute inset-0 bg-[url('/algorithm-workspace-hero.png')] bg-cover bg-center opacity-60" />
      <div className="absolute inset-0 bg-foreground/55" />
      <section className="relative w-full max-w-md border border-white/20 bg-background p-6 shadow-soft sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <p className="mt-10 text-sm font-medium text-primary">Your DSA workspace</p>
        <h1 className="mt-2 text-3xl font-medium tracking-normal">Save your practice.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in to keep algorithms organized by topic and load them whenever you are ready to revisit a problem.
        </p>
        <Button type="button" className="mt-8 w-full" size="lg" onClick={signIn} disabled={isLoading}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Redirecting" : "Continue with Google"}
        </Button>
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          You can still use the visualizer without an account. Login is only needed to save and load personal practice code.
        </p>
      </section>
    </main>
  );
}
