"use client";

import { useState } from "react";
import { Flame, Calendar, Target, TrendingUp, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useDailyGoal,
  setDailyGoal,
} from "@/lib/user-preferences";

// ---------------------------------------------------------------------------
// Profile stats cards: Today's Progress (with daily goal), Current Streak,
// Longest Streak, Total Solved. The daily goal bar is the primary retention
// lever — it turns abstract progress into a concrete daily target.
// ---------------------------------------------------------------------------

function toDateKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toEpochDay(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor(new Date(y, m - 1, d).getTime() / 86_400_000);
}

type StreakStats = {
  totalSolved: number;
  todayCount: number;
  currentStreak: number;
  longestStreak: number;
  practiceDays: number;
};

function computeStats(
  timestamps: Record<number, number>,
  totalSolvedCount: number,
): StreakStats {
  const daySet = new Set<string>();
  const todayKey = toDateKey(Date.now());
  let todayCount = 0;

  for (const epochMs of Object.values(timestamps)) {
    if (epochMs > 0) {
      const key = toDateKey(epochMs);
      daySet.add(key);
      if (key === todayKey) todayCount++;
    }
  }

  if (daySet.size === 0) {
    return {
      totalSolved: totalSolvedCount,
      todayCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      practiceDays: 0,
    };
  }

  const epochDays = Array.from(daySet)
    .map((key) => toEpochDay(key))
    .sort((a, b) => a - b);

  const today = toEpochDay(todayKey);

  // Current streak: count backward from today (or yesterday if no solve today).
  let currentStreak = 0;
  let checkDay = daySet.has(todayKey) ? today : today - 1;
  const daySetEpoch = new Set(epochDays);
  while (daySetEpoch.has(checkDay)) {
    currentStreak++;
    checkDay--;
  }

  // Longest streak: scan all sorted days.
  let longestStreak = epochDays.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < epochDays.length; i++) {
    if (epochDays[i] === epochDays[i - 1] + 1) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  return {
    totalSolved: totalSolvedCount,
    todayCount,
    currentStreak,
    longestStreak,
    practiceDays: daySet.size,
  };
}

export function StatsCards({
  timestamps,
  totalSolvedCount,
}: {
  timestamps: Record<number, number>;
  totalSolvedCount: number;
}) {
  const dailyGoal = useDailyGoal();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  const stats = computeStats(timestamps, totalSolvedCount);
  const goalPct = Math.min(100, Math.round((stats.todayCount / dailyGoal) * 100));
  const goalMet = stats.todayCount >= dailyGoal;

  const handleSaveGoal = () => {
    const parsed = parseInt(goalInput, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 100) {
      void setDailyGoal(parsed);
    }
    setEditingGoal(false);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Today's Progress — the primary card */}
      <div className="col-span-2 rounded-lg border bg-card p-4 sm:col-span-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                goalMet ? "bg-emerald-500/15" : "bg-orange-500/10"
              }`}
            >
              {goalMet ? (
                <span className="text-lg" aria-hidden="true">✓</span>
              ) : (
                <Target className="h-4 w-4 text-orange-500" aria-hidden="true" />
              )}
            </span>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setGoalInput(String(dailyGoal));
              setEditingGoal(!editingGoal);
            }}
            className="rounded p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
            title="Set daily goal"
          >
            <Settings2 className="h-3 w-3" />
          </button>
        </div>

        {editingGoal ? (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={100}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveGoal();
                if (e.key === "Escape") setEditingGoal(false);
              }}
              className="h-7 w-14 rounded border bg-muted px-2 text-sm font-semibold"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">/ day</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={handleSaveGoal}
            >
              Save
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {stats.todayCount}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}/ {dailyGoal}
            </span>
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goalMet ? "bg-emerald-500" : "bg-orange-400"
            }`}
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {goalMet
            ? "🎉 Daily goal reached!"
            : `${dailyGoal - stats.todayCount} more to reach your goal`}
        </p>
      </div>

      {/* Current Streak */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/10">
            <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
          </span>
          <span className="text-xs text-muted-foreground">Streak</span>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {stats.currentStreak}
          <span className="text-sm font-normal text-muted-foreground">
            {stats.currentStreak === 1 ? " day" : " days"}
          </span>
        </p>
      </div>

      {/* Longest Streak */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10">
            <TrendingUp className="h-4 w-4 text-blue-500" aria-hidden="true" />
          </span>
          <span className="text-xs text-muted-foreground">Best Streak</span>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {stats.longestStreak}
          <span className="text-sm font-normal text-muted-foreground">
            {stats.longestStreak === 1 ? " day" : " days"}
          </span>
        </p>
      </div>

      {/* Total Solved — spans the full remaining row on the 2-col mobile
          grid (Today spans both, leaving 3 cards: 1+2), and sits normally in
          the 4-col desktop grid. */}
      <div className="col-span-2 rounded-lg border bg-card p-4 sm:col-span-1">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10">
            <Calendar className="h-4 w-4 text-violet-500" aria-hidden="true" />
          </span>
          <span className="text-xs text-muted-foreground">Total Solved</span>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {stats.totalSolved}
        </p>
      </div>
    </div>
  );
}
