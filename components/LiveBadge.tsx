export function LiveBadge({ tiny = false }: { tiny?: boolean }) {
  if (tiny) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-live">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live animate-pulse-dot" />
        LIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-live/50 bg-live/15 px-2.5 py-1 text-xs font-bold tracking-widest text-live">
      <span aria-hidden className="h-2 w-2 rounded-full bg-live animate-pulse-dot" />
      LIVE
    </span>
  );
}
