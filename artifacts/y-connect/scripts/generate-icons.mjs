// Generates simple, hand-specified PWA icon PNGs (no AI, no external image tools):
// a solid teal square with a white "Y" mark, built from raw pixels + zlib deflate.
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const TEAL = [0x20, 0x4d, 0x58];
const WHITE = [0xff, 0xff, 0xff];

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
  const cx = ax + t * abx, cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function renderIcon(size, { scale = 1, safe = false } = {}) {
  const n = size;
  const cx = n / 2;
  const yTop = n * 0.5 - (n * 0.35 * scale);
  const yMid = n * 0.5;
  const yBottom = n * 0.5 + (n * 0.35 * scale);
  const spread = n * 0.24 * scale;
  const thickness = n * 0.1 * scale;
  const segments = [
    [cx - spread, yTop, cx, yMid],
    [cx + spread, yTop, cx, yMid],
    [cx, yMid, cx, yBottom],
  ];
  const pixels = Buffer.alloc(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let onMark = false;
      for (const [ax, ay, bx, by] of segments) {
        if (distanceToSegment(x, y, ax, ay, bx, by) <= thickness / 2) { onMark = true; break; }
      }
      const color = onMark ? WHITE : TEAL;
      const i = (y * n + x) * 4;
      pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255;
    }
  }
  return pixels;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function writeIcon(name, size, options) {
  const png = encodePng(size, renderIcon(size, options));
  writeFileSync(join(outDir, name), png);
  console.log('wrote', name, `${png.length} bytes`);
}

writeIcon('icon-192.png', 192, {});
writeIcon('icon-512.png', 512, {});
writeIcon('maskable-512.png', 512, { scale: 0.62 });
writeIcon('apple-touch-icon.png', 180, {});
