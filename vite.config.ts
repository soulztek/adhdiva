import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Served from https://soulztek.github.io/adhdiva/
export default defineConfig({ plugins: [react()], base: "/adhdiva/", build: { outDir: "dist", sourcemap: false } });
