"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAG_VIDEO_PATH, BRAG_VIDEO_POSTER_PATH } from "@/lib/site";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

interface BragVideoProps {
  /** Video file URL. Defaults to the narrated launch cut. */
  src?: string;
  /** Poster image URL shown before playback. */
  poster?: string;
  /** Accessible name for the video player. */
  label?: string;
  className?: string;
}

/**
 * The rendered launch video ("/brag" demo): starts muted+looping when the
 * section scrolls into view, shows a play button until then (and for
 * reduced-motion users), and pauses when scrolled away. A sound toggle
 * (and the explicit play button) unmutes — user-gesture-initiated, so
 * autoplay policies allow it.
 */
export function BragVideo({
  src = BRAG_VIDEO_PATH,
  poster = BRAG_VIDEO_POSTER_PATH,
  label = "Launch video: DSA Lab tracing a bubble sort run step by step",
  className,
}: BragVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    // Server snapshot: render the poster + play button during SSR.
    () => true,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView && !reducedMotion) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, reducedMotion]);

  const unmuteAndPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    video.play().catch(() => {});
  };

  return (
    <div ref={containerRef} className={cn("group relative", className)}>
      <video
        ref={videoRef}
        className="w-full rounded-2xl border bg-background shadow-lg"
        src={src}
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        aria-label={label}
      />
      {!inView || reducedMotion ? (
        <button
          type="button"
          aria-label="Play launch video with sound"
          onClick={unmuteAndPlay}
          className="absolute inset-0 grid place-items-center rounded-2xl bg-black/25 transition-opacity group-hover:bg-black/15"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-xl transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          aria-label={isMuted ? "Unmute launch video" : "Mute launch video"}
          aria-pressed={!isMuted}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (isMuted) {
              unmuteAndPlay();
            } else {
              video.muted = true;
              setIsMuted(true);
            }
          }}
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
