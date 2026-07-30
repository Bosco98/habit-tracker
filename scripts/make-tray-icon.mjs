/**
 * Generates the macOS/Windows menubar glyph — `src-tauri/icons/tray.png`.
 *
 * The tray used to reuse the app icon with `icon_as_template(true)`. A template
 * image keeps only the alpha channel, and the app icon is a fully opaque
 * rounded square, so every pixel survived: the menubar showed a black block.
 * A tray glyph has to be a *shape cut out of transparency*.
 *
 * Rasterised here rather than checked in as an opaque blob so the geometry is
 * reviewable. No dependencies: signed-distance field, 4× supersampled, encoded
 * as RGBA PNG by hand.
 *
 *   node scripts/make-tray-icon.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** tray-icon normalises to 18pt tall, so 36px is exactly 2× for retina. */
const SIZE = 36;
const SS = 4; // supersampling factor
const STROKE = 5.5;

/**
 * The check: down-stroke into the up-stroke, in 36×36 space. Sized to fill the
 * box — the menubar renders this 18pt tall, so a glyph floating in margin
 * reads as a speck.
 */
const POINTS = [
  [5, 19.5],
  [14, 28],
  [31, 8],
];

/** Distance from p to segment ab. */
function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Round caps and joins fall out of taking the min over segments. */
function coverage(px, py) {
  let best = Infinity;
  for (let i = 0; i < POINTS.length - 1; i++) {
    best = Math.min(best, distanceToSegment(px, py, POINTS[i], POINTS[i + 1]));
  }
  return best <= STROKE / 2;
}

function renderAlpha() {
  const alpha = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (coverage(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)) hits++;
        }
      }
      alpha[y * SIZE + x] = Math.round((hits / (SS * SS)) * 255);
    }
  }
  return alpha;
}

// ── PNG encoding ──────────────────────────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(alpha) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  // Black pixels throughout; macOS template rendering reads only the alpha,
  // and on Windows a black glyph is what a light taskbar wants.
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (SIZE * 4 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < SIZE; x++) {
      raw[rowStart + 1 + x * 4 + 3] = alpha[y * SIZE + x];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src-tauri", "icons", "tray.png");
writeFileSync(out, encodePng(renderAlpha()));
console.log(`wrote ${out} (${SIZE}×${SIZE})`);
