"use client";

import { useFollowedTeams } from "@/hooks/useFollowedTeams";
import { useMounted } from "@/hooks/useMounted";

/** Star toggle to follow a team (localStorage). Powers the personalized War Room. */
export function FollowButton({ code, size = "md" }: { code: string; size?: "sm" | "md" }) {
  const mounted = useMounted();
  const { isFollowed, toggle } = useFollowedTeams();
  const on = mounted && isFollowed(code);
  const sm = size === "sm";

  return (
    <button
      type="button"
      onClick={() => toggle(code)}
      aria-pressed={on}
      aria-label={on ? "Unfollow team" : "Follow team"}
      title={on ? "Following — tap to unfollow" : "Follow this team"}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${
        sm ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      } ${on ? "border-gold/60 bg-gold/10 text-gold" : "border-edge text-dim hover:text-ink"}`}
    >
      <span aria-hidden>{on ? "★" : "☆"}</span>
      {on ? "Following" : "Follow"}
    </button>
  );
}
