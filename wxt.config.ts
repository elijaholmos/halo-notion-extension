import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

export default defineConfig({
  manifestVersion: 3,
  srcDir: "src",
  outDir: "dist",
  modules: ["@wxt-dev/module-svelte"],
  webExt: {
    chromiumProfile: "/Users/williampieh/Library/Application Support/Google/Chrome/Default",
  },
  vite: () => ({
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib")
      },
    },
    plugins: [tailwindcss() as any],
  }),
  manifest: {
    oauth2: {
      client_id: "c4caddd8-0c2c-459c-8b86-26dba209bca",
      scopes: [""]
    },
    name: "Import Halo Assignments",
    host_permissions: ["https://halo.gcu.edu/*"],
    permissions: ["cookies", "identity", "storage"],
    minimum_chrome_version: "120",
    action: {
      default_icon: {
        "16": "/static/icon-16.png",
        "32": "/static/icon-32.png",
        "48": "/static/icon-48.png",
        "128": "/static/icon-128.png"
      },
      default_popup: "popup.html"
    },
    background: {
      service_worker: "background.js"
    },
    icons: {
      "16": "/static/icon-16.png",
      "32": "/static/icon-32.png",
      "48": "/static/icon-48.png",
      "128": "/static/icon-128.png"
    },
    author: {
      email: "elijah@elijaholmos.com",
    },
    description: "Import assignments from Halo to Notion",
    version: "1.1.0",
  },
});
