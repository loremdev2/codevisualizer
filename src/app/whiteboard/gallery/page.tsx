"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Globe, Lock } from "lucide-react";

import { fetchJson } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { UsernameBadge } from "@/components/ui/username-badge";
import { UserHoverCard } from "@/components/user-hover-card";
import { SiteNav } from "@/components/site-nav";

type PublicWhiteboardAuthor = {
  name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type PublicWhiteboard = {
  id: string;
  name: string;
  user_id: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
  author: PublicWhiteboardAuthor | null;
};

export default function WhiteboardGalleryPage() {
  const [whiteboards, setWhiteboards] = useState<PublicWhiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await fetchJson<{ whiteboards?: PublicWhiteboard[] }>(
        "/api/whiteboards/public",
      );
      if (result.ok) {
        setWhiteboards(result.data.whiteboards ?? []);
      } else {
        setError(result.error);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <SiteNav />
      <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/whiteboard"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to whiteboards
        </Link>
        <h1 className="text-2xl font-bold">Public Gallery</h1>
        <p className="mt-1 text-muted-foreground">
          DSA diagrams and sketches shared by the community.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      ) : whiteboards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-medium">No public whiteboards yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to share a whiteboard! Open any whiteboard and toggle it to public.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/whiteboard">Go to your whiteboards</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {whiteboards.map((wb) => (
            <Link
              key={wb.id}
              href={`/whiteboard/${wb.id}`}
              className="group overflow-hidden rounded-lg border transition-colors hover:bg-accent"
            >
              {wb.thumbnail ? (
                <div className="relative h-36 w-full overflow-hidden bg-muted/30">
                  <img
                    src={wb.thumbnail}
                    alt=""
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-muted/20">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <h3 className="truncate font-medium">{wb.name}</h3>
                  <Globe className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Updated {new Date(wb.updated_at).toLocaleDateString()}
                </p>
                {wb.author && (
                  <div className="mt-1.5">
                    <UserHoverCard userId={wb.user_id}>
                      <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                        {wb.author.avatar_url ? (
                          <img
                            src={wb.author.avatar_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-4 w-4 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                            {(wb.author.name ?? "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground/70">
                            {wb.author.name ?? "Anonymous"}
                          </span>
                          {wb.author.username && (
                            <UsernameBadge username={wb.author.username} size="sm" />
                          )}
                        </div>
                      </div>
                    </UserHoverCard>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
