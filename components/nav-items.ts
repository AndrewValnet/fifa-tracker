export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "War Room", icon: "🏠" },
  { href: "/upcoming", label: "Matches", icon: "📅" },
  { href: "/standings", label: "Standings", icon: "🏆" },
  { href: "/calendar", label: "Calendar", icon: "🗓️" },
  { href: "/predict", label: "Predict", icon: "🎯" },
  { href: "/bracket", label: "Bracket", icon: "🔮" },
  { href: "/dream-xi", label: "Dream XI", icon: "⭐" },
  { href: "/insights", label: "Insights", icon: "🔥" },
  { href: "/trivia", label: "Trivia", icon: "🧩" },
  { href: "/teams", label: "Teams", icon: "🧕" },
  { href: "/players", label: "Players", icon: "XI" },
  { href: "/stadiums", label: "Stadiums", icon: "🏟️" },
  { href: "/records", label: "Records", icon: "🏅" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
  { href: "/admin/push", label: "Push Admin", icon: "📣" },
];
