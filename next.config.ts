import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsPDF resta esterno al bundle server: contiene un import opzionale di "canvg"
  // che il bundler non deve tracciare (la generazione PDF avviene in una route API Node).
  serverExternalPackages: ['jspdf'],

  // PWA headers and stability from Agenda Guide (Mirroring working config)
  async headers() {
    return [
      {
        source: '/sw-v4.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
