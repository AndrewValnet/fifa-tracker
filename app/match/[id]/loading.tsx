export default function MatchLoading() {
  return (
    <div className="mx-auto max-w-shell px-4 py-10" aria-busy aria-label="Loading match">
      <div className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-[120px] w-[160px]" />
          <div className="skeleton h-6 w-32" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-20 w-56" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-[120px] w-[160px]" />
          <div className="skeleton h-6 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-96 lg:col-span-2" />
        <div className="skeleton h-96" />
      </div>
    </div>
  );
}
