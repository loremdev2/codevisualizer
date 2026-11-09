"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error boundary that catches rendering errors in the question bank and
 * shows a friendly fallback with a retry button instead of a blank page.
 */
export class LearnErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card px-8 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-medium">Something went wrong</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            The question bank hit an unexpected error. This is usually a
            temporary issue — try refreshing the page.
          </p>
          <p className="max-w-md font-mono text-xs text-muted-foreground/60">
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
