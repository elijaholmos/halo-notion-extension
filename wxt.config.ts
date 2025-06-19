import { defineConfig } from 'wxt'

export default defineConfig({
  manifestVersion: 3,
  srcDir: "src",
  outDir: "dist",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
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
    }
  },
})
