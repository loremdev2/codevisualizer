"use client";

import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAG_VIDEO_PATH, BRAG_VIDEO_POSTER_PATH } from "@/lib/site";

interface BragVideoProps {
  /** Video file URL. Defaults to the narrated launch cut. */
  src?: string;
  /** Poster image URL shown before playback. */
  poster?: string;
  /** Accessible name for the video player. */
  label?: string;
  className?: string;
}

/** The video is fetched only after the visitor chooses to play it. */
export function BragVideo({
  src = BRAG_VIDEO_PATH,
  poster = BRAG_VIDEO_POSTER_PATH,
  label = "Launch video: DSA Lab tracing a bubble sort run step by step",
  className,
}: BragVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const startPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    video.src = src;
    video.load();
    video.muted = false;
    setHasStarted(true);
    setIsMuted(false);
    video.play().catch(() => {});
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <div className={cn("group relative", className)}>
      <video
        ref={videoRef}
        className="w-full rounded-2xl border bg-background shadow-lg"
        src={hasStarted ? src : undefined}
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        preload={hasStarted ? "metadata" : "none"}
        aria-label={label}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {!hasStarted ? (
        <button
          type="button"
          aria-label="Load and play launch video with sound"
          onClick={startPlayback}
          className="absolute inset-0 grid place-items-center rounded-2xl bg-black/25 transition-opacity group-hover:bg-black/15"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-xl transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            aria-label={isPlaying ? "Pause launch video" : "Play launch video"}
            onClick={togglePlayback}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            aria-label={isMuted ? "Unmute launch video" : "Mute launch video"}
            aria-pressed={!isMuted}
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = !isMuted;
              setIsMuted(!isMuted);
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
