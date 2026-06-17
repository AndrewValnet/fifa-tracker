export interface NavItem {
  href: string;
  label: string;
  icon: string; // emoji keeps the nav dependency-free
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "War Room", icon: "🏠" },
  { href: "/upcoming", label: "Matches", icon: "📅" },
  { href: "/standings", label: "Standings", icon: "🏆" },
  { href: "/predict", label: "Predict", icon: "🎯" },
  { href: "/dream-xi", label: "Dream XI", icon: "⭐" },
  { href: "/insights", label: "Insights", icon: "🔥" },
  { href: "/teams", label: "Teams", icon: "👕" },
  { href: "/stadiums", label: "Stadiums", icon: "🏟️" },
  { href: "/records", label: "Records", icon: "🏅" },
];
