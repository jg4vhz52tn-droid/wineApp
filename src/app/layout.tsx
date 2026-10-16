import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif, Inter } from "next/font/google";
import { AppearanceProvider } from "@/components/app/appearance-provider";
import { ServiceWorker } from "@/components/app/service-worker";
import { SessionProvider } from "@/components/app/session-provider";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import { appearanceScript } from "@/lib/appearance";
import "./globals.css";

// Look A: elegant serif headlines + clear sans body.
const serifA = Instrument_Serif({ variable: "--font-serif-a", subsets: ["latin"], weight: "400" });
const sansA = Inter({ variable: "--font-sans-a", subsets: ["latin"] });
// Look B: one modern grotesk for everything.
const sansB = Geist({ variable: "--font-sans-b", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#140b10",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      data-look="a"
      data-theme="dark"
      suppressHydrationWarning
      className={`${serifA.variable} ${sansA.variable} ${sansB.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-full bg-bg text-fg">
        <AppearanceProvider>
          <SessionProvider>{children}</SessionProvider>
        </AppearanceProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
