// Gera os ícones PWA do MerendaCheck usando sharp
// Rode com: node scripts/generate-icons.mjs

import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const OUT = 'public/icons'
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// SVG base do ícone — garfo/talheres sobre fundo azul
function makeSVG(size) {
  const pad = size * 0.18
  const inner = size - pad * 2
  const r = size * 0.22  // border-radius proporcional

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Fundo azul arredondado -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#0E2E60"/>

  <!-- Garfo (esquerda) -->
  <g transform="translate(${size * 0.28}, ${size * 0.18}) scale(${inner / 80})">
    <!-- garfo: 3 dentes -->
    <line x1="8"  y1="0" x2="8"  y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="16" y1="0" x2="16" y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="24" y1="0" x2="24" y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <!-- arco dos dentes -->
    <path d="M8 18 Q16 26 24 18" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <!-- cabo -->
    <line x1="16" y1="26" x2="16" y2="62" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Faca (direita) -->
  <g transform="translate(${size * 0.52}, ${size * 0.18}) scale(${inner / 80})">
    <!-- lâmina -->
    <path d="M8 0 C8 0 22 8 22 24 L8 28 Z" fill="white"/>
    <!-- cabo -->
    <line x1="8" y1="28" x2="8" y2="62" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Ponto verde no canto — identidade visual -->
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.07}" fill="#00963A"/>
</svg>`
}

console.log('Gerando ícones PWA...')

for (const size of SIZES) {
  const svg = makeSVG(size)
  const outPath = `${OUT}/icon-${size}.png`
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outPath)
  console.log(`  ✓ icon-${size}.png`)
}

// Shortcut icon (inspeção)
const shortcutSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#1A4A9E"/>
  <path d="M24 28 L24 72 L72 72 L72 28 Z" fill="none" stroke="white" stroke-width="4" stroke-linejoin="round"/>
  <line x1="34" y1="44" x2="62" y2="44" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="34" y1="54" x2="62" y2="54" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="34" y1="64" x2="50" y2="64" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <circle cx="68" cy="30" r="12" fill="#00963A"/>
  <path d="M62 30 L66 34 L74 26" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

await sharp(Buffer.from(shortcutSvg)).png().toFile(`${OUT}/shortcut-inspecao.png`)
console.log('  ✓ shortcut-inspecao.png')

// apple-touch-icon (180x180, sem arredondamento — iOS faz o clip)
const appleSvg = makeSVG(180).replace(/rx="[^"]*"/, 'rx="0"')
await sharp(Buffer.from(appleSvg)).png().toFile(`${OUT}/apple-touch-icon.png`)
console.log('  ✓ apple-touch-icon.png')

console.log('\nConcluído! Todos os ícones gerados em public/icons/')
