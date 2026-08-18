const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Generate SVG Brand Icons
const createSvgIcon = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.15 : size * 0.05;
  const innerSize = size - padding * 2;
  const radius = isMaskable ? 0 : size * 0.22;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size * 0.03}" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bgGrad)"/>
  
  <!-- Subtle Border Accent -->
  <rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${radius}" stroke="#10b981" stroke-opacity="0.25" stroke-width="2"/>

  <!-- Glow effect -->
  <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.32}" fill="#10b981" fill-opacity="0.18" filter="url(#glow)"/>

  <!-- Logo Graphics Group -->
  <g transform="translate(${size * 0.5}, ${size * 0.5}) scale(${size / 100})">
    <!-- Shopping Cart Base & Wheels -->
    <path d="M-22 -14 L-14 -14 L-6 10 L16 10 L22 -4 L-10 -4" fill="none" stroke="url(#primaryGrad)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    
    <!-- Cart Basket Interior Stripes -->
    <line x1="-3" y1="-4" x2="-1" y2="4" stroke="url(#primaryGrad)" stroke-width="3" stroke-linecap="round"/>
    <line x1="6" y1="-4" x2="8" y2="4" stroke="url(#primaryGrad)" stroke-width="3" stroke-linecap="round"/>
    
    <!-- Left Wheel -->
    <circle cx="-5" cy="18" r="3.5" fill="#34d399"/>
    <circle cx="-5" cy="18" r="1.5" fill="#09090b"/>
    
    <!-- Right Wheel -->
    <circle cx="15" cy="18" r="3.5" fill="#34d399"/>
    <circle cx="15" cy="18" r="1.5" fill="#09090b"/>

    <!-- Graduation Cap / Sparkle Badge on top of Cart -->
    <!-- Cap Diamond -->
    <path d="M4 -14 L14 -19 L24 -14 L14 -9 Z" fill="url(#accentGrad)"/>
    <!-- Cap Base -->
    <path d="M8 -12 L8 -7 C8 -5 20 -5 20 -7 L20 -12" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
    <!-- Tassel -->
    <path d="M22 -13 L25 -8 L24 -5" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Sparkle / Lightning Icon -->
    <path d="M-10 -19 L-6 -19 L-9 -13 L-4 -13 L-11 -4 L-8 -11 L-12 -11 Z" fill="#fbbf24"/>
  </g>
</svg>`;
};

// Pure Node.js PNG encoder for uncompressed/indexed or RGBA PNGs
function createSolidPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression method (deflate)
  ihdrData.writeUInt8(0, 11); // filter method (standard)
  ihdrData.writeUInt8(0, 12); // interlace method (no)

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw Image Data (with filter byte 0 at start of each scanline)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for subtle gradient/icon styling
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rect bounds
      const cornerRadius = 0.22;
      const isCorner = Math.abs(dx) > (1 - cornerRadius) && Math.abs(dy) > (1 - cornerRadius);
      let inBounds = true;
      if (isCorner) {
        const cdx = Math.abs(dx) - (1 - cornerRadius);
        const cdy = Math.abs(dy) - (1 - cornerRadius);
        if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerRadius) {
          inBounds = false;
        }
      }

      if (!inBounds) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Base background gradient: #0f172a -> #09090b -> #022c22
      let pr = 9;
      let pg = 9;
      let pb = 11;

      // Glow circle in center
      if (dist < 0.6) {
        const glow = (1 - dist / 0.6);
        pr = Math.floor(pr + 16 * glow);
        pg = Math.floor(pg + 185 * glow * 0.4);
        pb = Math.floor(pb + 129 * glow * 0.2);
      }

      // Draw stylized "C" & cart badge in center
      const inIconX = x >= width * 0.25 && x <= width * 0.75;
      const inIconY = y >= height * 0.25 && y <= height * 0.75;
      
      if (inIconX && inIconY) {
        const ix = (x - width * 0.25) / (width * 0.5);
        const iy = (y - height * 0.25) / (height * 0.5);

        // Emerald cart bar
        if (iy >= 0.45 && iy <= 0.55 && ix >= 0.2 && ix <= 0.8) {
          pr = 16; pg = 185; pb = 129; // #10b981
        }
        // Cart left bar
        if (ix >= 0.2 && ix <= 0.32 && iy >= 0.25 && iy <= 0.7) {
          pr = 52; pg = 211; pb = 153; // #34d399
        }
        // Cart right slant / basket
        if (ix >= 0.68 && ix <= 0.8 && iy >= 0.35 && iy <= 0.7) {
          pr = 52; pg = 211; pb = 153;
        }
        // Bottom bar
        if (iy >= 0.65 && iy <= 0.75 && ix >= 0.25 && ix <= 0.75) {
          pr = 16; pg = 185; pb = 129;
        }
        // Wheels
        const w1Dist = Math.sqrt(Math.pow(ix - 0.35, 2) + Math.pow(iy - 0.88, 2));
        const w2Dist = Math.sqrt(Math.pow(ix - 0.68, 2) + Math.pow(iy - 0.88, 2));
        if (w1Dist < 0.08 || w2Dist < 0.08) {
          pr = 52; pg = 211; pb = 153;
        }
        // Accent cap / star on top right
        const capDist = Math.sqrt(Math.pow(ix - 0.65, 2) + Math.pow(iy - 0.22, 2));
        if (capDist < 0.12) {
          pr = 96; pg = 165; pb = 250; // #60a5fa
        }
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

// CRC-32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) | 0;
}

// Write SVGs
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), createSvgIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), createSvgIcon(512));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.svg'), createSvgIcon(192, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.svg'), createSvgIcon(512, true));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), createSvgIcon(180));
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), createSvgIcon(72));
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSvgIcon(64));

// Write PNGs
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createSolidPng(192, 192, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createSolidPng(512, 512, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.png'), createSolidPng(192, 192, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), createSolidPng(512, 512, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createSolidPng(180, 180, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.png'), createSolidPng(72, 72, 16, 185, 129));

console.log('✅ All PWA Icons generated successfully!');
