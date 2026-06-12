import type { DataSource } from "@/lib/types";

const LABELS: Record<DataSource, { text: string; cls: string } | null> = {
  "football-data": null, // primary source — no badge needed
  gnews: null,
  worldcup26: { text: "via worldcup26.ir", cls: "text-dim" },
  demo: { text: "offline data", cls: "text-gold" },
};

/** Tiny provenance label next to section headers (only for fallback sources). */
export function SourceTag({ source }: { source?: DataSource }) {
  if (!source) return null;
  const label = LABELS[source];
  if (!label) return null;
  return <span className={`text-[10px] uppercase tracking-wider ${label.cls}`}>{label.text}</span>;
}
