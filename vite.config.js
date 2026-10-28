import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Calendario Super Córdoba",
        short_name: "Calendario Super",
        lang: "es-AR",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#f6f7f2",
        theme_color: "#195a45",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,png,svg,ico}"] },
    }),
  ],
});
