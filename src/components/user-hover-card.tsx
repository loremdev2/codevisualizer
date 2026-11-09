"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, Flame, Target, ExternalLink } from "lucide-react";
import { UsernameBadge } from "@/components/ui/username-badge";

interface UserPreview {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  stats: {
    totalSolved: number;
    currentStreak: number;
    totalDaysActive: number;
  };
}

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export function UserHoverCard({ userId, children }: UserHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position below the trigger, aligned to left
      // If it would go off-screen right, align to right instead
      const cardWidth = 288; // w-72 = 18rem = 288px
      let left = rect.left;
      if (left + cardWidth > window.innerWidth - 16) {
        left = rect.right - cardWidth;
      }
      // If it would go off-screen bottom, position above
      let top = rect.bottom + 8;
      if (top + 300 > window.innerHeight) {
        top = rect.top - 8;
      }
      setPosition({ top, left });
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsOpen(true);
      if (!user) {
        setLoading(true);
        fetch(`/api/users/${userId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.user && data.stats) {
              setUser({
                ...data.user,
                stats: data.stats,
              });
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }, 300);
  }, [userId, user, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }, []);

  const handleCardMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isOpen && createPortal(
        <div
          className="fixed z-[9999] w-72 rounded-lg border bg-background shadow-xl"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >,
          {loading ? (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name ?? "User"}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                    {(user.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">
                    {user.name ?? "Anonymous"}
                  </p>
                  {user.username && <UsernameBadge username={user.username} size="sm" />}
                  {joinedDate && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {joinedDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-md bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span className="text-[10px] font-medium uppercase">Solved</span>
                  </div>
                  <p className="mt-0.5 text-lg font-bold">{user.stats.totalSolved}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-[10px] font-medium uppercase">Streak</span>
                  </div>
                  <p className="mt-0.5 text-lg font-bold text-orange-500">
                    {user.stats.currentStreak}
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px] font-medium uppercase">Days</span>
                  </div>
                  <p className="mt-0.5 text-lg font-bold">{user.stats.totalDaysActive}</p>
                </div>
              </div>

              {/* View Profile Link */}
              <a
                href={user.username ? `/profile/${user.username}` : `/profile/${user.id}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-primary/10 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                View Profile
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}
        </div>,
        document.body
      )}
    </>
  );
}
