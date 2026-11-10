// Genera los íconos de la app instalable a partir de un SVG con las letras PK dibujadas
// como trazos, para no depender de fuentes del sistema. Uso: node scripts/generate-icons.mjs
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "icons");
const ORANGE = "#f97316";

const letters = `
  <g fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <path d="M160 168V344M160 168H210a46 46 0 0 1 0 92H160"/>
    <path d="M280 168V344M280 258L346 168M296 232L350 344"/>
  </g>`;

function svg({ rounded }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" ${rounded ? 'rx="112"' : ""} fill="${ORANGE}"/>
    ${letters}
  </svg>`;
}

async function png(file, size, options) {
  await sharp(Buffer.from(svg(options)), { density: 384 }).resize(size, size).png().toFile(path.join(OUT, file));
  console.log("ok", file, size);
}

await mkdir(OUT, { recursive: true });
await png("icon-192.png", 192, { rounded: true });
await png("icon-512.png", 512, { rounded: true });
await png("icon-maskable-512.png", 512, { rounded: false });
await png("apple-touch-icon.png", 180, { rounded: false });
