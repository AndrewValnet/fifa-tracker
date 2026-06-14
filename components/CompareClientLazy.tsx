"use client";

import dynamic from "next/dynamic";

// Code-split the comparison picker so /compare ships a lean shell.
export const CompareClient = dynamic(() => import("@/components/CompareClient").then((m) => m.CompareClient), {
  ssr: false,
  loading: () => <div className="skeleton h-40 w-full" aria-hidden />,
});
