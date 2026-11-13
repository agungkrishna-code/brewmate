/**
 * Generates Brewmate's PNG assets without any image dependency.
 *
 * The mark: a V60 cone in cream with a muted-gold rim and a gold saucer line,
 * centred on espresso brown. Rendered with 3x3 supersampling for clean edges.
 *
 * Usage: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ESPRESSO = [0x35, 0x25, 0x1e];
const CREAM = [0xf5, 0xf0, 0xe8];
const GOLD = [0xc7, 0xa6, 0x75];

/* ------------------------------------------------------------------ */
/* PNG encoder                                                         */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

/** Source geometry is authored in a 1024 x 1024 space. */
const DESIGN = 1024;
const CX = 512;
const CONE_TOP = 352;
const CONE_BOTTOM = 656;
const CONE_HALF_TOP = 226;
const CONE_HALF_BOTTOM = 56;
const RIM_HALF = 248;
const RIM_TOP = CONE_TOP - 26;
const RIM_BOTTOM = CONE_TOP + 20;
const SAUCER_Y = 706;
const SAUCER_HALF = 96;
const SAUCER_HALF_HEIGHT = 11;

function coneHalfWidth(y) {
  const t = (y - CONE_TOP) / (CONE_BOTTOM - CONE_TOP);
  return CONE_HALF_TOP + (CONE_HALF_BOTTOM - CONE_HALF_TOP) * t;
}

function insideCone(x, y) {
  if (y < CONE_TOP || y > CONE_BOTTOM) return false;
  return Math.abs(x - CX) <= coneHalfWidth(y);
}

function insideRoundedBar(x, y, left, right, top, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const innerLeft = left + radius;
  const innerRight = right - radius;
  if (x >= innerLeft && x <= innerRight) return true;
  const centerX = x < innerLeft ? innerLeft : innerRight;
  const centerY = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  if (y > top + radius && y < bottom - radius) return true;
  return (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2;
}

/**
 * @param {number} size
 * @param {{transparent?: boolean, background?: number[] | null}} options
 */
function render(size, options = {}) {
  const scale = size / DESIGN;
  const pixels = Buffer.alloc(size * size * 4);
  const samples = 3;
  const background = options.transparent ? null : (options.background ?? ESPRESSO);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = (x + (sx + 0.5) / samples) / scale;
          const py = (y + (sy + 0.5) / samples) / scale;

          let colour = background;
          let alpha = background ? 1 : 0;

          if (insideRoundedBar(px, py, CX - SAUCER_HALF, CX + SAUCER_HALF, SAUCER_Y - SAUCER_HALF_HEIGHT, SAUCER_Y + SAUCER_HALF_HEIGHT, SAUCER_HALF_HEIGHT)) {
            colour = GOLD;
            alpha = 1;
          }
          if (insideCone(px, py)) {
            colour = CREAM;
            alpha = 1;
          }
          if (insideRoundedBar(px, py, CX - RIM_HALF, CX + RIM_HALF, RIM_TOP, RIM_BOTTOM, (RIM_BOTTOM - RIM_TOP) / 2)) {
            colour = GOLD;
            alpha = 1;
          }

          if (colour && alpha > 0) {
            r += colour[0] * alpha;
            g += colour[1] * alpha;
            b += colour[2] * alpha;
            a += alpha;
          }
        }
      }

      const total = samples * samples;
      const outAlpha = a / total;
      const index = (y * size + x) * 4;
      if (outAlpha > 0) {
        pixels[index] = Math.round(r / a);
        pixels[index + 1] = Math.round(g / a);
        pixels[index + 2] = Math.round(b / a);
        pixels[index + 3] = Math.round(outAlpha * 255);
      } else {
        pixels[index] = 0;
        pixels[index + 1] = 0;
        pixels[index + 2] = 0;
        pixels[index + 3] = 0;
      }
    }
  }

  return encodePng(size, size, pixels);
}

function write(name, size, options) {
  const target = path.join(__dirname, '..', 'assets', 'images', name);
  fs.writeFileSync(target, render(size, options));
  console.log(`wrote assets/images/${name} (${size}x${size})`);
}

write('icon.png', 1024, { background: ESPRESSO });
write('android-icon-foreground.png', 1024, { transparent: true });
write('android-icon-background.png', 1024, { background: ESPRESSO });
write('android-icon-monochrome.png', 1024, { transparent: true, background: [255, 255, 255] });
write('splash-icon.png', 512, { transparent: true });
write('favicon.png', 64, { background: ESPRESSO });
