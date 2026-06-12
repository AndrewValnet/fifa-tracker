// Venue card (PRD §7.2): stadium photo, facts, and a keyless OpenStreetMap embed.

import { StadiumPhoto } from "@/components/StadiumPhoto";
import { fmtNumber } from "@/lib/format";
import type { Stadium } from "@/lib/types";

export function VenueCard({ stadium }: { stadium: Stadium }) {
  const d = 0.012;
  const bbox = `${stadium.lng - d},${stadium.lat - d * 0.6},${stadium.lng + d},${stadium.lat + d * 0.6}`;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${stadium.lat}%2C${stadium.lng}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${stadium.lat}&mlon=${stadium.lng}#map=15/${stadium.lat}/${stadium.lng}`;

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-panel">
      <StadiumPhoto src={stadium.image} alt={stadium.name} />
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <h3 className="font-display text-xl font-semibold">{stadium.name}</h3>
          <p className="text-xs text-dim">FIFA name: {stadium.fifaName}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <dt className="text-dim">City</dt>
            <dd>{stadium.city}</dd>
            <dt className="text-dim">Country</dt>
            <dd>{stadium.country}</dd>
            <dt className="text-dim">Capacity</dt>
            <dd className="font-mono">{fmtNumber(stadium.capacity)}</dd>
            <dt className="text-dim">Surface</dt>
            <dd>{stadium.surface}</dd>
          </dl>
          <a
            href={osmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-pitch underline-offset-2 hover:underline"
          >
            Open in OpenStreetMap ↗
          </a>
        </div>
        <iframe
          title={`Map of ${stadium.name}`}
          src={osmEmbed}
          loading="lazy"
          className="h-48 w-full rounded-lg border border-edge"
        />
      </div>
    </div>
  );
}
