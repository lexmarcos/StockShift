import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StockShift PWA",
    short_name: "StockShift",
    description: "A Progressive Web App built with Next.js",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo-dark.svg",
        sizes: "192x192",
        type: "image/svg",
      },
      {
        src: "/logo-dark.svg",
        sizes: "512x512",
        type: "image/svg",
      },
    ],
  };
}
