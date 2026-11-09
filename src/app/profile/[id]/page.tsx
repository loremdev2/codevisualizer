"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Flame,
  Trophy,
  Target,
  BookOpen,
  Clock,
  Layers,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsernameBadge } from "@/components/ui/username-badge";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { SHOW_WHITEBOARD_UI } from "@/lib/feature-flags";

type UserProfile = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

type UserStats = {
  totalSolved: number;
  top150Solved: number;
  neetcodeSolved: number;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
};

type ProfileData = {
  user: UserProfile;
  stats: UserStats;
};

const ACTIVITY_LABELS: Record<number, string> = {
  1: "1 question", 2: "2 questions", 5: "5 questions",
};

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [timestamps, setTimestamps] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [profileRes, activityRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/users/${userId}/activity`),
        ]);
        const profileData = await profileRes.json();
        const activityData = await activityRes.json();
        if (!profileRes.ok) {
          setError(profileData.error ?? "Failed to load profile.");
        } else {
          setProfile(profileData);
          setTimestamps(activityData.timestamps ?? {});
          
          // Redirect from UUID to username for clean URLs
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
          if (isUuid && profileData.user?.username) {
            window.history.replaceState({}, '', `/profile/${profileData.user.username}`);
          }
        }
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error ?? "User not found."}</p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const { user, stats } = profile;
  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name ?? "User"}
              referrerPolicy="no-referrer"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name + meta */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {user.name ?? "Anonymous User"}
            </h1>
            {user.username && (
              <UsernameBadge username={user.username} />
            )}
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {joinedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {stats.totalDaysActive} active days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Solved */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Total Solved
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.totalSolved}</p>
        </div>

        {/* Current Streak */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Current Streak
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-orange-500">
            {stats.currentStreak} days
          </p>
        </div>

        {/* Longest Streak */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Best Streak
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-yellow-500">
            {stats.longestStreak} days
          </p>
        </div>

        {/* Active Days */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Active Days
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.totalDaysActive}</p>
        </div>
      </div>

      {/* Bank breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Top 150 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-medium">Top Interview 150</span>
            </div>
            <Badge variant="secondary">
              {stats.top150Solved} / 150
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.round((stats.top150Solved / 150) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round((stats.top150Solved / 150) * 100)}% complete
          </p>
        </div>

        {/* NeetCode */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              <span className="font-medium">NeetCode Roadmap</span>
            </div>
            <Badge variant="secondary">
              {stats.neetcodeSolved} / 362
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{
                width: `${Math.round((stats.neetcodeSolved / 362) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round((stats.neetcodeSolved / 362) * 100)}% complete
          </p>
        </div>
      </div>

      {/* Activity heatmap */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-medium tracking-tight">Activity</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Questions solved per day — like a GitHub contribution graph for DSA
        </p>
        <div className="mt-4">
          {Object.keys(timestamps).length > 0 ? (
            <ActivityHeatmap timestamps={timestamps} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet
            </p>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        {SHOW_WHITEBOARD_UI ? (
          <Button asChild variant="outline">
            <Link href="/whiteboard/gallery">View Public Whiteboards</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/learn">Start Learning</Link>
        </Button>
      </div>
    </div>
  );
}
