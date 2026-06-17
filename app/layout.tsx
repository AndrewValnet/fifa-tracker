import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { GoalAlerts } from "@/components/GoalAlerts";
import { LiveScoresTicker } from "@/components/LiveScoresTicker";
import { ResourceHints } from "@/components/ResourceHints";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Sidebar } from "@/components/Sidebar";
import { SWRProvider } from "@/components/SWRProvider";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "WC26 Live",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "WC26 Live" },
  title: {
    default: "WC26 Live — World Cup 2026 War Room",
    template: "%s · WC26 Live",
  },
  description:
    "Personal live dashboard for the 2026 FIFA World Cup: real-time scores, Polymarket win probabilities, news, standings, squads and stadiums across USA, Canada and Mexico.",
};

export const viewport: Viewport = {
  themeColor: "#0A0E1A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${inter.variable} ${robotoMono.variable} bg-navy font-body text-ink antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel2 focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SWRProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <LiveScoresTicker />
              <main id="main" className="min-w-0 flex-1 pb-20 lg:pb-8">
                {children}
              </main>
            </div>
          </div>
          <BottomNav />
          <GoalAlerts />
        </SWRProvider>
        <ResourceHints />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
