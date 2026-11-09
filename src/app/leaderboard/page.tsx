"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Target,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsernameBadge } from "@/components/ui/username-badge";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  totalSolved: number;
  user: {
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to load leaderboard.");
        } else {
          setLeaderboard(data.leaderboard ?? []);
        }
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 border-yellow-500/30";
      case 2:
        return "bg-gray-400/10 border-gray-400/30";
      case 3:
        return "bg-amber-600/10 border-amber-600/30";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Top performers by questions solved
            </p>
          </div>
        </div>
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
      ) : leaderboard.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-medium">No data yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to solve a question and appear on the leaderboard!
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/learn">Start Learning</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <Link
              key={entry.userId}
              href={entry.user.username ? `/profile/${entry.user.username}` : `/profile/${entry.userId}`}
              className={`group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent ${getRankBg(entry.rank)}`}
            >
              {/* Rank */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              {entry.user.avatar_url ? (
                <img
                  src={entry.user.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {(entry.user.name ?? "U").charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">
                  {entry.user.name ?? "Anonymous"}
                </p>
                {entry.user.username && (
                  <UsernameBadge username={entry.user.username} size="sm" />
                )}
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" />
                  {entry.totalSolved}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
