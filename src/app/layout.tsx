import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";
import { createClient } from "@/utils/supabase/server";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
  themeColor: "#09090b",
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="it"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} min-h-full flex flex-col bg-zinc-950 text-zinc-50`}>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
