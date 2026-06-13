// Supplies an explicit TTF to ImageResponse so @vercel/og never falls back to
// its bundled font (whose path resolution throws on Windows). Fetched once per
// lambda and cached. Returns null on failure (routes then omit fonts, which
// still works on Vercel/Linux).

let cached: Promise<ArrayBuffer | null> | null = null;

async function load(): Promise<ArrayBuffer | null> {
  try {
    // A legacy User-Agent makes Google Fonts serve TTF (satori-friendly).
    const css = await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)" },
    }).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export function ogFont(): Promise<ArrayBuffer | null> {
  if (!cached) cached = load();
  return cached;
}

/** ImageResponse `fonts` option, or undefined when the fetch failed. */
export async function ogFonts() {
  const data = await ogFont();
  return data ? [{ name: "Inter", data, weight: 700 as const, style: "normal" as const }] : undefined;
}
