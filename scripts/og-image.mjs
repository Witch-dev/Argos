// Draws the link-preview images (specs/language-share-links.md): the logo over the landing headline,
// one 1200×630 PNG per language that has its own share link.
//
//   node scripts/og-image.mjs
//
// Writes Apollon/web/public/og-image.png (English) and og-image-es.png (Spanish). The headline comes
// from each language's `landing.json`, so after the headline changes, run this again. The logo is
// scripts/og/logo.png, cut once out of the old og-image.png (the original 1610×977 drawing is gone).
// Then each image is reduced to 256 colours (a third of the size, no visible change), like the other
// images in public/. Needs the one-time `npm install` in this folder, a connection for Google Fonts
// and Python with Pillow.

import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APOLLON = process.env.APOLLON_DIR ?? 'C:/Users/jramo/Apollon'
const PUBLIC = path.join(APOLLON, 'web/public')
const LOGO = path.join(HERE, 'og/logo.png')

// The language's code in locales/ and the file it is written to.
const IMAGES = [
  { lang: 'en', file: 'og-image.png' },
  { lang: 'es', file: 'og-image-es.png' },
]

// Paper's --bg, --text and --text-muted (web/src/index.css).
const PAGE = '#f7f3e8'
const INK = '#1f1d1a'
const MUTED = '#6b665e'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })

if (!fs.existsSync(LOGO)) {
  // The logo sits on the plain page colour in the top part of the old image: crop to the pixels
  // that aren't page colour, with a few pixels of margin.
  const old = fs.readFileSync(path.join(PUBLIC, 'og-image.png')).toString('base64')
  await page.setContent(`<img src="data:image/png;base64,${old}">`)
  const box = await page.evaluate(() => {
    const img = document.querySelector('img')
    const canvas = Object.assign(document.createElement('canvas'), { width: 1200, height: 630 })
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const { data } = ctx.getImageData(0, 0, 1200, 380)
    const [r0, g0, b0] = data
    let x1 = 1200, y1 = 380, x2 = 0, y2 = 0
    for (let y = 0; y < 380; y++)
      for (let x = 0; x < 1200; x++) {
        const i = (y * 1200 + x) * 4
        if (Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0) > 24) {
          x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y)
        }
      }
    return { x: x1 - 4, y: y1 - 4, width: x2 - x1 + 9, height: y2 - y1 + 9 }
  })
  fs.mkdirSync(path.dirname(LOGO), { recursive: true })
  await page.screenshot({ path: LOGO, clip: box })
  console.log(`logo cut out: ${box.width}×${box.height}`)
}

const logo = fs.readFileSync(LOGO).toString('base64')

for (const { lang, file } of IMAGES) {
  const landing = JSON.parse(fs.readFileSync(path.join(APOLLON, `web/src/locales/${lang}/landing.json`), 'utf8'))
  // One line per sentence, so a line never breaks in the middle of one.
  const headline = landing.headline.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/([.!?]) /g, '$1<br>')
  await page.setContent(`<!doctype html>
<html lang="${lang}"><head>
<link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,700&family=Public+Sans:wght@500&display=block" rel="stylesheet">
<style>
  * { margin: 0 }
  body { width: 1200px; height: 630px; background: ${PAGE}; display: flex; flex-direction: column;
         align-items: center; justify-content: center; gap: 28px; }
  img { height: 290px }
  h1 { font: 700 50px/1.18 Literata, serif; color: ${INK}; text-align: center; max-width: 1120px;
       letter-spacing: -0.01em }
  p { font: 500 24px 'Public Sans', sans-serif; color: ${MUTED} }
</style></head>
<body><img src="data:image/png;base64,${logo}" alt=""><h1>${headline}</h1><p>wingedwords.app</p></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  const out = path.join(PUBLIC, file)
  await page.screenshot({ path: out })
  execFileSync('python', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").quantize(256).save(sys.argv[1], optimize=True)', out])
  console.log(`${file} (${Math.round(fs.statSync(out).size / 1024)} KB): ${landing.headline}`)
}

await browser.close()
