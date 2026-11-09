"use client";

import { Code2, Loader2, ShieldCheck, Sparkles } from "lucide-react";

interface AuthLoaderScreenProps {
  title?: string;
  subtitle?: string;
  statusText?: string;
  step?: 1 | 2 | 3;
}

export function AuthLoaderScreen({
  title = "Signing in...",
  subtitle = "Connecting your account and preparing your algorithm workspace",
  statusText = "Connecting with Google...",
  step = 1,
}: AuthLoaderScreenProps) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-foreground px-5 py-8 text-background">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[url('/algorithm-workspace-hero.png')] bg-cover bg-center opacity-50" />
      <div className="absolute inset-0 bg-foreground/60" />

      {/* Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-white/15 bg-background/95 p-8 text-foreground shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          {/* Animated Spinner & Brand Icon */}
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-blue-400 animate-[spin_1.5s_linear_infinite_reverse]" />

            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary shadow-inner">
              <Code2 className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          {/* User-friendly Title & Subtitle */}
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>

          {/* Simple Progress Checklist */}
          <div className="mt-6 w-full space-y-2.5 rounded-lg border border-border/60 bg-muted/40 p-4 text-left text-xs">
            <div className="flex items-center gap-2.5">
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                ✓
              </span>
              <span className={step >= 1 ? "font-medium text-foreground" : "text-muted-foreground"}>
                Google Sign-In
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {step === 2 ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > 2 ? "✓" : "2"}
                </span>
              )}
              <span className={step >= 2 ? "font-medium text-foreground" : "text-muted-foreground"}>
                Loading Your Account
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {step === 3 ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                  3
                </span>
              )}
              <span className={step === 3 ? "font-medium text-foreground" : "text-muted-foreground"}>
                Opening Workspace
              </span>
            </div>
          </div>

          {/* Live User-facing Message */}
          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>{statusText}</span>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Encrypted & Secure Login</span>
          </div>
        </div>
      </div>
    </div>
  );
}
