import type { Metadata } from "next"
import { DreamXIBuilder } from "@/components/DreamXIBuilder"

export const metadata: Metadata = {
  title: "Dream XI Builder — WC 2026",
  description: "Build your ultimate World Cup 2026 Dream XI. Pick any 11 players from any nation."
}

export default function DreamXIPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink mb-2">
        Dream XI Builder
      </h1>
      <p className="mb-8 text-sm text-dim">
        Pick any 11 players from WC 2026. Your lineup auto-saves and is shareable via link.
      </p>
      <DreamXIBuilder />
    </div>
  )
}
