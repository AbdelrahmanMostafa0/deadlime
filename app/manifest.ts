import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deadlime",
    short_name: "Deadlime",
    description: "A project and task manager with attitude.",
    start_url: "/today",
    display: "standalone",
    background_color: "#FFF8EC",
    theme_color: "#FFF8EC",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
