import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/places-proxy": {
        target: "https://maps.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => {
          // Extract the URL from the query string
          const url = new URL(path, "http://localhost");
          const targetUrl = url.searchParams.get("url");
          if (targetUrl) {
            // Parse the target URL to extract the path and query
            const parsedUrl = new URL(targetUrl);
            return parsedUrl.pathname + parsedUrl.search;
          }
          return path;
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
