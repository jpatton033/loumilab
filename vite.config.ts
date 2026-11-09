import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { imagetools } from "vite-imagetools";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // Bundled JPGs are served as compressed WebP capped at 1920px — keeps photos fast without touching imports.
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.size > 0 || !/\/src\/assets\/.+\.jpe?g$/i.test(url.pathname)) return new URLSearchParams();
        return new URLSearchParams({ format: "webp", quality: "70", w: "1920", withoutEnlargement: "" });
      },
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
