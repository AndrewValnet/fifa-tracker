export default function Loading() {
  return (
    <div className="mx-auto max-w-shell px-4 py-10" aria-busy aria-label="Loading">
      <div className="flex items-end justify-between gap-4">
        <div className="skeleton h-10 w-80" />
        <div className="skeleton h-8 w-48" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="skeleton h-[22rem] rounded-[2rem]" />
        <div className="grid gap-4">
          <div className="skeleton h-40 rounded-[1.5rem]" />
          <div className="skeleton h-40 rounded-[1.5rem]" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
