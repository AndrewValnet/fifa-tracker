export default function Loading() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8" aria-busy aria-label="Loading predictions">
      <div className="skeleton h-10 w-72" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="skeleton h-[32rem] rounded-[2rem]" />
        <div className="grid gap-4">
          <div className="skeleton h-64 rounded-[2rem]" />
          <div className="skeleton h-64 rounded-[2rem]" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
