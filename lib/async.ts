// Bounded-concurrency map: run `fn` over `items` with at most `limit` in flight,
// preserving input order. Shared by lib/data.ts and lib/insights.ts to fan out
// per-match external calls without serializing them (or stampeding the origin).

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length || 1) }, worker));
  return out;
}
