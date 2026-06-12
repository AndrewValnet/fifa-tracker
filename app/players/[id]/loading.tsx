export default function PlayerLoading() {
  return (
    <div className="mx-auto max-w-shell px-4 py-10" aria-busy aria-label="Loading player">
      <div className="flex items-center gap-6">
        <div className="skeleton h-28 w-28 rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="skeleton h-9 w-64" />
          <div className="skeleton h-4 w-40" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
      <div className="skeleton mt-8 h-64 w-full" />
    </div>
  );
}
