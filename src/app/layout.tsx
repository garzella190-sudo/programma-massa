import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Allenamenti Manu | Programma Massa",
  description: "Piano personalizzato per ipertrofia e nutrizione",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-favicon.png", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Allenamenti",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E1116",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
