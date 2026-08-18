const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const logoIconPath = path.join(publicDir, 'images', 'logo', 'logo-icon.png');

const iconBase64 = fs.readFileSync(logoIconPath).toString('base64');
const dataUri = `data:image/png;base64,${iconBase64}`;

const createSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <image href="${dataUri}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSvg(64));
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), createSvg(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), createSvg(512));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.svg'), createSvg(192));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.svg'), createSvg(512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), createSvg(180));
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), createSvg(72));

console.log('Successfully updated all SVG icons with new logo!');
