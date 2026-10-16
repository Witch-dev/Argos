// Screenshots of the current Apollon code for design work (web-design, ux-review, browser-check).
//
//   node scripts/shoot.mjs /authors/OL26320A /u/someone [--themes paper,dark] [--widths 1280,375]
//                          [--out <dir>] [--user <name> --password <pw>] [--scroll 0,700] [--full]
//
// Needs the side-port servers from the browser-check skill (API on 5259, Vite on 5174) and a one-time
// `npm install` in this folder. Without --user it registers a fresh reader (shot_<time>), confirms its
// email in the local database and saves the login to <out>/reader.json, so the next run can reuse it
// with --user/--password. Prints one line per shot, flagging sideways scroll.

import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.SHOOT_API ?? 'http://localhost:5259/api'
const WEB = process.env.SHOOT_WEB ?? 'http://localhost:5174'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
// Every word that isn't a flag or a flag's value is a route. Git Bash turns "/authors/x" into
// "C:/Program Files/Git/authors/x", so that prefix is undone; "authors/x" without a slash works too.
const VALUE_FLAGS = ['--themes', '--widths', '--out', '--user', '--password', '--scroll']
const routes = args
  .filter((a, i) => !a.startsWith('--') && !(i > 0 && VALUE_FLAGS.includes(args[i - 1])))
  .map((a) => a.replace(/\\/g, '/').replace(/^[A-Za-z]:\/.*?\/Git\//, '/'))
  .map((a) => (a.startsWith('/') ? a : `/${a}`))
if (routes.length === 0) {
  console.error('Usage: node scripts/shoot.mjs <route> [<route>…] [--themes paper,dark] [--widths 1280,375] [--out dir] [--user u --password p] [--scroll 0,700] [--full]')
  process.exit(1)
}
const themes = flag('themes', 'paper,dark').split(',')
const widths = flag('widths', '1280,375').split(',').map(Number)
const scrolls = flag('scroll', '0').split(',').map(Number)
const full = args.includes('--full')
const out = path.resolve(flag('out', path.join(process.env.TEMP ?? '.', 'argos-shots')))
fs.mkdirSync(out, { recursive: true })

async function ensureServers() {
  for (const [name, url] of [['API (5259)', `${API}/authors/OL26320A`], ['Vite (5174)', WEB]]) {
    try {
      await fetch(url)
    } catch {
      console.error(`${name} is not running. Start the side-port servers first (browser-check skill, section 1).`)
      process.exit(1)
    }
  }
}

async function reader() {
  const user = flag('user')
  const password = flag('password')
  if (user && password) return { username: user, password }
  const saved = path.join(out, 'reader.json')
  if (fs.existsSync(saved)) return JSON.parse(fs.readFileSync(saved, 'utf8'))

  const username = `shot_${Date.now().toString(36)}`
  const pw = `Sh0t!${Math.random().toString(36).slice(2)}-Kq`
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email: `${username}@example.com`, password: pw }),
  })
  if (!res.ok) throw new Error(`Registering a reader failed: ${res.status} ${await res.text()}`)
  const sql = path.join(out, 'confirm.sql')
  fs.writeFileSync(sql, `UPDATE "AspNetUsers" SET "EmailConfirmed" = true WHERE "UserName" = '${username}';`)
  execFileSync('docker', ['cp', sql, 'apollon-postgres-1:/tmp/shoot-confirm.sql'])
  execFileSync('docker', ['exec', 'apollon-postgres-1', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d argos -q -f /tmp/shoot-confirm.sql'])
  const login = { username, password: pw }
  fs.writeFileSync(saved, JSON.stringify(login))
  return login
}

const slug = (route) => route.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '') || 'home'

await ensureServers()
const login = await reader()
const browser = await chromium.launch()
try {
  for (const theme of themes) {
    for (const width of widths) {
      const context = await browser.newContext({ locale: 'en-US', viewport: { width, height: width < 641 ? 760 : 800 } })
      await context.route('**/config.js', (r) =>
        r.fulfill({ contentType: 'text/javascript', body: `window.__ARGOS_CONFIG__ = { apiBaseUrl: '${API}' }` }),
      )
      await context.addInitScript((t) => {
        try {
          localStorage.setItem('argos_theme', t)
        } catch {
          /* private mode */
        }
      }, theme)
      const page = await context.newPage()
      await page.goto(`${WEB}/login`)
      await page.fill('#emailOrUsername', login.username)
      await page.fill('#password', login.password)
      await page.click('form button[type=submit]')
      await page.waitForURL((u) => !u.pathname.includes('login'))

      for (const route of routes) {
        await page.goto(WEB + route)
        await page.waitForLoadState('networkidle').catch(() => {})
        await page.waitForTimeout(600)
        const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
        for (const y of scrolls) {
          await page.evaluate((v) => window.scrollTo(0, v), y)
          await page.waitForTimeout(250)
          const file = path.join(out, `${slug(route)}-${theme}-${width}${y ? `-y${y}` : ''}.png`)
          await page.screenshot({ path: file, fullPage: full })
          console.log(`${file}${sideways ? '   ⚠ scrolls sideways' : ''}`)
        }
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
}
