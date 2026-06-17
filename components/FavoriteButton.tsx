"use client";

import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  teamCode: string;
  teamName: string;
  size?: "sm" | "md";
}

export function FavoriteButton({
  teamCode,
  teamName,
  size = "md",
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const favorited = isFavorite(teamCode);

  const iconSize = size === "sm" ? 20 : 28;

  return (
    <button
      type="button"
      onClick={() => toggle(teamCode)}
      aria-label={`Favorite ${teamName}`}
      aria-pressed={favorited}
      className={[
        "inline-flex items-center justify-center rounded-full transition-all duration-200",
        "hover:scale-110 active:scale-95 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy",
        size === "sm" ? "p-1" : "p-1.5",
      ].join(" ")}
      title={favorited ? `Remove ${teamName} from favorites` : `Add ${teamName} to favorites`}
    >
      {favorited ? (
        // Filled gold star
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="text-gold drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        // Outlined star
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-dim hover:text-gold transition-colors duration-150"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </button>
  );
}
