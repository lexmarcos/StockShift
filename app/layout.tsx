import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { WarehouseProvider } from "@/lib/contexts/warehouse-context";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { LayoutContent } from "@/components/layout/layout-content";
import { MobileMenuProvider } from "@/components/layout/mobile-menu-context";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerProvider } from "@/components/pwa/service-worker-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

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

type AppleStartupImage = {
  url: string;
  media: string;
};

type AppleStartupScreen = {
  fileName: string;
  width: number;
  height: number;
  pixelRatio: number;
  orientation: "portrait" | "landscape";
};

const SPLASH_SCREEN_BASE_PATH = "/splash_screens";
const CLARITY_PROJECT_ID = "wumq9sa7e2";
const SHOULD_LOAD_CLARITY = process.env.NODE_ENV === "production";

const clarityScript = `
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
`;

const appleStartupScreens: AppleStartupScreen[] = [
  { fileName: "10.2__iPad_landscape.png", width: 2160, height: 1620, pixelRatio: 2, orientation: "landscape" },
  { fileName: "10.2__iPad_portrait.png", width: 1620, height: 2160, pixelRatio: 2, orientation: "portrait" },
  { fileName: "10.5__iPad_Air_landscape.png", width: 2224, height: 1668, pixelRatio: 2, orientation: "landscape" },
  { fileName: "10.5__iPad_Air_portrait.png", width: 1668, height: 2224, pixelRatio: 2, orientation: "portrait" },
  { fileName: "10.9__iPad_Air_landscape.png", width: 2360, height: 1640, pixelRatio: 2, orientation: "landscape" },
  { fileName: "10.9__iPad_Air_portrait.png", width: 1640, height: 2360, pixelRatio: 2, orientation: "portrait" },
  { fileName: "11__iPad_Pro_M4_landscape.png", width: 2420, height: 1668, pixelRatio: 2, orientation: "landscape" },
  { fileName: "11__iPad_Pro_M4_portrait.png", width: 1668, height: 2420, pixelRatio: 2, orientation: "portrait" },
  { fileName: "11__iPad_Pro__10.5__iPad_Pro_landscape.png", width: 2388, height: 1668, pixelRatio: 2, orientation: "landscape" },
  { fileName: "11__iPad_Pro__10.5__iPad_Pro_portrait.png", width: 1668, height: 2388, pixelRatio: 2, orientation: "portrait" },
  { fileName: "12.9__iPad_Pro_landscape.png", width: 2732, height: 2048, pixelRatio: 2, orientation: "landscape" },
  { fileName: "12.9__iPad_Pro_portrait.png", width: 2048, height: 2732, pixelRatio: 2, orientation: "portrait" },
  { fileName: "13__iPad_Pro_M4_landscape.png", width: 2752, height: 2064, pixelRatio: 2, orientation: "landscape" },
  { fileName: "13__iPad_Pro_M4_portrait.png", width: 2064, height: 2752, pixelRatio: 2, orientation: "portrait" },
  { fileName: "4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape.png", width: 1136, height: 640, pixelRatio: 2, orientation: "landscape" },
  { fileName: "4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png", width: 640, height: 1136, pixelRatio: 2, orientation: "portrait" },
  { fileName: "8.3__iPad_Mini_landscape.png", width: 2266, height: 1488, pixelRatio: 2, orientation: "landscape" },
  { fileName: "8.3__iPad_Mini_portrait.png", width: 1488, height: 2266, pixelRatio: 2, orientation: "portrait" },
  { fileName: "9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_landscape.png", width: 2048, height: 1536, pixelRatio: 2, orientation: "landscape" },
  { fileName: "9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png", width: 1536, height: 2048, pixelRatio: 2, orientation: "portrait" },
  { fileName: "iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png", width: 2688, height: 1242, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png", width: 1242, height: 2688, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_11__iPhone_XR_landscape.png", width: 1792, height: 828, pixelRatio: 2, orientation: "landscape" },
  { fileName: "iPhone_11__iPhone_XR_portrait.png", width: 828, height: 1792, pixelRatio: 2, orientation: "portrait" },
  { fileName: "iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png", width: 2436, height: 1125, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png", width: 1125, height: 2436, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png", width: 2778, height: 1284, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png", width: 1284, height: 2778, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png", width: 2796, height: 1290, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png", width: 1290, height: 2796, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png", width: 2556, height: 1179, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png", width: 1179, height: 2556, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape.png", width: 2868, height: 1320, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png", width: 1320, height: 2868, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_17_Pro__iPhone_17__iPhone_16_Pro_landscape.png", width: 2622, height: 1206, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png", width: 1206, height: 2622, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png", width: 2532, height: 1170, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png", width: 1170, height: 2532, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png", width: 2208, height: 1242, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png", width: 1242, height: 2208, pixelRatio: 3, orientation: "portrait" },
  { fileName: "iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape.png", width: 1334, height: 750, pixelRatio: 2, orientation: "landscape" },
  { fileName: "iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png", width: 750, height: 1334, pixelRatio: 2, orientation: "portrait" },
  { fileName: "iPhone_Air_landscape.png", width: 2736, height: 1260, pixelRatio: 3, orientation: "landscape" },
  { fileName: "iPhone_Air_portrait.png", width: 1260, height: 2736, pixelRatio: 3, orientation: "portrait" },
];

function createAppleStartupImage(screen: AppleStartupScreen): AppleStartupImage {
  const deviceWidth = screen.width / screen.pixelRatio;
  const deviceHeight = screen.height / screen.pixelRatio;

  return {
    url: `${SPLASH_SCREEN_BASE_PATH}/${screen.fileName}`,
    media: `(device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${screen.pixelRatio}) and (orientation: ${screen.orientation})`,
  };
}

const appleStartupImages: AppleStartupImage[] = [
  ...appleStartupScreens.map(createAppleStartupImage),
];

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
    startupImage: appleStartupImages,
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
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
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
        <NuqsAdapter>
          <AuthProvider>
            <WarehouseProvider>
              <MobileMenuProvider>
                <LayoutContent>{children}</LayoutContent>
              </MobileMenuProvider>
            </WarehouseProvider>
          </AuthProvider>
        </NuqsAdapter>
        <Toaster />
        <ServiceWorkerProvider />
        {SHOULD_LOAD_CLARITY && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: clarityScript }}
          />
        )}
      </body>
    </html>
  );
}
