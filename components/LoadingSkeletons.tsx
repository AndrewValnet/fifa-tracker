export function OddsPanelSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="skeleton h-3 w-3/4" />
      <div className="grid grid-cols-3 gap-2">
        <div className="skeleton h-8" />
        <div className="skeleton h-8" />
        <div className="skeleton h-8" />
      </div>
      <div className="skeleton h-24 w-full" />
    </div>
  );
}

export function NewsListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-lg border border-edge bg-panel2/40 p-3">
          <div className="skeleton h-16 w-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton mt-2 h-3 w-2/3" />
            <div className="skeleton mt-3 h-2 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LineupsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-edge bg-panel2/30 p-3">
          <div className="skeleton h-72 w-full rounded-lg" />
          <div className="mt-3 flex justify-between">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SquadSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-busy>
      {[0, 1].map((team) => (
        <div key={team} className="flex flex-col gap-2">
          <div className="skeleton h-12 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 border-t border-edge/40 py-1.5">
              <div className="skeleton h-4 w-6" />
              <div className="skeleton h-7 w-7 rounded-full" />
              <div className="skeleton h-3 flex-1" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SquadSideSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy>
      <div className="skeleton h-12 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 border-t border-edge/40 py-1.5">
          <div className="skeleton h-4 w-6" />
          <div className="skeleton h-7 w-7 rounded-full" />
          <div className="skeleton h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-2" aria-busy>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <div className="skeleton h-3" />
          <div className="skeleton h-2" />
          <div className="skeleton h-3" />
        </div>
      ))}
    </div>
  );
}

export function HeadToHeadSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-10" />
        <div className="skeleton h-3 w-36" />
        <div className="skeleton h-5 w-10" />
      </div>
      <div className="skeleton h-2.5 w-full rounded-full" />
      <div className="overflow-hidden rounded-lg border border-edge/70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 border-t border-edge/40 p-2 first:border-t-0">
            <div className="skeleton h-3" />
            <div className="skeleton h-3" />
            <div className="skeleton h-3" />
            <div className="skeleton h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
