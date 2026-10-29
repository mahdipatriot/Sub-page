import path from "path"
import { createHash } from "crypto"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile";

// The single-file build inlines the app as <script type="module">…</script>,
// which the page's CSP (script-src 'self') would block. This adds a SHA-256
// hash of that exact script to script-src, so the browser runs only this
// bundle and still refuses any other inline script. Runs after viteSingleFile.
function cspHashInlineScripts(): Plugin {
  return {
    name: "csp-hash-inline-scripts",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".html")) continue;
        let html = String(file.source);
        const hashes: string[] = [];
        // The browser executes everything up to the first </script>, so hash exactly that.
        for (const m of html.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)) {
          hashes.push(`'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
        }
        if (hashes.length === 0) continue;
        const before = html;
        html = html.replace(
          /(<meta http-equiv="Content-Security-Policy" content="[^"]*?script-src 'self')/,
          `$1 ${hashes.join(" ")}`
        );
        if (html === before) {
          this.warn("CSP meta tag not found; inline script hash was not added");
          continue;
        }
        // The panel renders this file with Jinja. The bundle contains "{{"
        // (i18n placeholders), so pass the script through Jinja untouched.
        // The raw markers sit outside <script>, so the hash still matches.
        html = html.replace(
          /<script type="module"[^>]*>[\s\S]*?<\/script>/g,
          (tag) => `{% raw %}${tag}{% endraw %}`
        );
        file.source = html;
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    cspHashInlineScripts()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging in production
    sourcemap: false,
    // Use default minification (esbuild) instead of terser
    minify: true
    // Note: manualChunks is incompatible with viteSingleFile plugin
    // which uses inlineDynamicImports, so we remove it
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-i18next',
      'i18next',
      'swr',
      'date-fns',
      'recharts'
    ]
  },
  // C7 fix: Removed server.fs.allow: ['..'] which allowed the Vite dev server
  // to serve files from outside the project root (path traversal). The default
  // fs.allow restricts access to the project root only.
  server: {
    fs: {
      // Restrict to the project root only — no access to parent directories.
      strict: true,
    },
  },
})
