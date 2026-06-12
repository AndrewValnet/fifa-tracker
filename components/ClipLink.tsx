// Goal-clip finder: no free API serves per-goal video URLs, so scorer names
// link to targeted searches on the platforms where clips surface first.

const enc = encodeURIComponent;

export function clipQuery(player: string, home: string, away: string): string {
  return `${player} goal ${home} vs ${away} World Cup 2026`;
}

export function ClipLink({
  player,
  home,
  away,
  className = "",
}: {
  player: string;
  home: string;
  away: string;
  className?: string;
}) {
  const q = clipQuery(player, home, away);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={`https://www.youtube.com/results?search_query=${enc(q)}`}
        target="_blank"
        rel="noopener noreferrer"
        title={`Find a clip: ${q}`}
        className="underline decoration-dotted underline-offset-2 hover:text-gold"
      >
        {player}
        <span aria-hidden className="ml-1 text-[10px] text-pitch">▶</span>
      </a>
      <a
        href={`https://x.com/search?q=${enc(q)}&f=video`}
        target="_blank"
        rel="noopener noreferrer"
        title="Search clip on X"
        aria-label={`Search ${player} goal clip on X`}
        className="text-[10px] text-dim hover:text-ink"
      >
        𝕏
      </a>
      <a
        href={`https://www.reddit.com/search/?q=${enc(q)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Search clip on Reddit"
        aria-label={`Search ${player} goal clip on Reddit`}
        className="text-[10px] text-dim hover:text-ink"
      >
        ⬡
      </a>
    </span>
  );
}
