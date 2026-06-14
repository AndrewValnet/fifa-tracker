"use client";

import dynamic from "next/dynamic";

// Code-split the pick'em widget into its own chunk so /predict ships a lean shell.
export const PickemClient = dynamic(() => import("@/components/PickemClient").then((m) => m.PickemClient), {
  ssr: false,
  loading: () => <div className="skeleton h-96 w-full" aria-hidden />,
});
