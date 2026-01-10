import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WarehouseProvider } from "@/lib/contexts/warehouse-context";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { LayoutContent } from "@/components/layout/layout-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "StockShift - Gestão de Estoque",
    template: "%s | StockShift",
  },
  description: "Sistema corporativo de gestão de estoque, produtos e movimentações",
  applicationName: "StockShift",
  authors: [{ name: "StockShift Team" }],
  generator: "Next.js",
  keywords: ["estoque", "gestão", "produtos", "movimentações", "inventário", "warehouse"],
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StockShift",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "StockShift",
    title: "StockShift - Gestão de Estoque",
    description: "Sistema corporativo de gestão de estoque, produtos e movimentações",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StockShift" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <AuthProvider>
          <WarehouseProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
          </WarehouseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
