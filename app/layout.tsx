import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Unbounded } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["500", "700", "800", "900"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: { default: "Deadlime", template: "%s · Deadlime" },
  description: "A project and task manager with attitude.",
  // Absolute URLs for the Open Graph image. Unset on Vercel falls back to VERCEL_URL.
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
};

export const viewport: Viewport = {
  themeColor: "#FFF8EC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${unbounded.variable} ${dmSans.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
