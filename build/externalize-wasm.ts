import { existsSync } from "node:fs";
import type { Plugin } from "vite";

const BASE64_MODULE = "/public/cojson_core_wasm.wasm.js";

/**
 * cojson ships its crypto core twice: a real `.wasm` binary and a JS module
 * holding the same bytes as a base64 `data:` URL. Bundlers pick the base64
 * one, which lands ~570 KB of barely-compressible string in the main chunk —
 * a third of the whole bundle — and blocks parsing while it's decoded.
 *
 * The loader only does `fetch(data)`, so a real asset URL is a drop-in
 * replacement: smaller, fetched in parallel, cached separately, and streamed
 * straight to the WASM compiler.
 *
 * The binary sits next to the base64 module, so it's derived from the module
 * id rather than resolved — the package's `exports` map doesn't expose it.
 */
export function externalizeCojsonWasm(): Plugin {
  let replaced = false;

  return {
    name: "externalize-cojson-wasm",
    enforce: "pre",

    load(id) {
      const file = id.replace(/\\/g, "/").split("?")[0];
      if (!file.endsWith(BASE64_MODULE)) return null;

      const binary = file.slice(0, -".js".length);
      if (!existsSync(binary)) {
        this.warn(`${binary} not found — keeping the inlined base64 copy (larger bundle).`);
        return null;
      }

      replaced = true;
      return `import url from ${JSON.stringify(`${binary}?url`)};\nexport const data = url;\n`;
    },

    buildEnd() {
      if (!replaced) {
        this.warn(
          "cojson wasm was never externalized — the base64 copy is still in the bundle.",
        );
      }
    },
  };
}
