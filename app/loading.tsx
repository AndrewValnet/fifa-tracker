export default function Loading() {
  return (
    <div className="mx-auto max-w-shell px-4 py-10" aria-busy aria-label="Loading">
      <div className="skeleton mb-6 h-9 w-72" />
      <div className="skeleton mb-8 h-56 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    </div>
  );
}
