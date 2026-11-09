import { Badge } from "@/components/ui/badge";

interface UsernameBadgeProps {
  username: string;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Consistent username display across the app.
 * Uses a subtle badge/chip style with muted background.
 */
export function UsernameBadge({ username, className, size = "default" }: UsernameBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`
        inline-flex items-center gap-1 font-mono text-muted-foreground
        ${size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs"}
        ${className ?? ""}
      `}
    >
      @{username}
    </Badge>
  );
}
