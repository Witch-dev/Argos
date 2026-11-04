// A step-by-step browser for the ux-review task walk: one Chromium page stays open while a reviewer
// drives it one action at a time, seeing only what a reader would see.
//
//   node scripts/walk.mjs serve [--out <dir>] [--width 375] [--lang en] [--anon] [--user u --password p] [--theme paper]
//   node scripts/walk.mjs open /books        go to an address (only at the start of a task)
//   node scripts/walk.mjs click 7            click item [7] of the last listing, or: click "Add to shelf"
//   node scripts/walk.mjs type 3 "dune"      type into item [3] (replaces what is there)
//   node scripts/walk.mjs press Enter        press a key (Escape, Tab, Enter…)
//   node scripts/walk.mjs scroll [up]        scroll one screen down (or up)
//   node scripts/walk.mjs back               the browser's back button
//   node scripts/walk.mjs look               list the screen again without doing anything
//   node scripts/walk.mjs mark "task 3"      write a line in the log (start of a task, an outcome)
//   node scripts/walk.mjs stop               close the browser and the server
//
// After every action it prints the address, the headings in view, the controls in view (with their
// number, role, name, state and whether they are icon only) and the controls further down, and saves
// a viewport screenshot. Every action goes to <out>/walk-log.txt, which is the walk's record.
// The default is a phone (375 wide, touch, no hover), since most readers use one (PRODUCT.md).
// Needs the side-port servers (browser-check skill, section 1). The reader comes from --user/--password
// or <out>/reader.json; run `node scripts/shoot.mjs / --out <dir>` once to make one.

import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.SHOOT_API ?? 'http://localhost:5259/api'
const WEB = process.env.SHOOT_WEB ?? 'http://localhost:5174'
const PORT = Number(process.env.WALK_PORT ?? 5299)

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}

if (args[0] === 'serve') await serve()
else await send(args)

async function send([cmd, ...rest]) {
  if (!cmd) {
    console.error('Usage: node scripts/walk.mjs serve | open <route> | click <n|name> | type <n|name> <text> | press <key> | scroll [up] | back | look | mark <text> | stop')
    process.exit(1)
  }
  // Git Bash turns "/books" into "C:/Program Files/Git/books"; undo that.
  const fixed = rest.map((a) => a.replace(/\\/g, '/').replace(/^[A-Za-z]:\/.*?\/Git\//, '/'))
  try {
    const res = await fetch(`http://localhost:${PORT}/`, { method: 'POST', body: JSON.stringify({ cmd, args: fixed }) })
    console.log(await res.text())
  } catch {
    console.error(`No walk server on ${PORT}. Start it with: node scripts/walk.mjs serve --out <dir>`)
    process.exit(1)
  }
}

async function serve() {
  const out = path.resolve(flag('out', path.join(process.env.TEMP ?? '.', 'argos-walk')))
  fs.mkdirSync(out, { recursive: true })
  const width = Number(flag('width', '375'))
  const phone = width < 641
  const lang = flag('lang', 'en')
  const theme = flag('theme', 'paper')
  const log = path.join(out, 'walk-log.txt')
  const write = (line) => fs.appendFileSync(log, `${line}\n`)

  let login = null
  if (!args.includes('--anon')) {
    const saved = path.join(out, 'reader.json')
    login = flag('user') && flag('password')
      ? { username: flag('user'), password: flag('password') }
      : fs.existsSync(saved) ? JSON.parse(fs.readFileSync(saved, 'utf8')) : null
    if (!login) {
      console.error(`No reader: pass --user/--password, or run node scripts/shoot.mjs / --out ${out} once to make one.`)
      process.exit(1)
    }
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    locale: lang === 'en' ? 'en-US' : lang,
    viewport: { width, height: phone ? 700 : 800 },
    isMobile: phone,
    hasTouch: phone,
  })
  await context.route('**/config.js', (r) =>
    r.fulfill({ contentType: 'text/javascript', body: `window.__ARGOS_CONFIG__ = { apiBaseUrl: '${API}' }` }),
  )
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('argos_theme', t.theme)
      localStorage.setItem('argos_language', t.lang)
    } catch {
      /* private mode */
    }
  }, { theme, lang })
  const page = await context.newPage()
  if (login) {
    // The account's saved language beats localStorage after login, so save it on the account too.
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: login.username, password: login.password }),
    })
    if (res.ok) {
      const { token } = await res.json()
      await fetch(`${API}/users/me/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferredLanguage: lang }),
      })
    }
    await page.goto(`${WEB}/login`)
    await page.fill('#emailOrUsername', login.username)
    await page.fill('#password', login.password)
    await page.click('form button[type=submit]')
    await page.waitForURL((u) => !u.pathname.includes('login'))
  }
  write(`# walk ${new Date().toISOString()} · ${width}px${phone ? ' phone' : ''} · ${lang} · ${theme} · ${login ? login.username : 'signed out'}`)

  let step = 0
  const settle = async () => {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(500)
  }
  // A number from the last listing, or a name: the exact name first, then any control containing it.
  const target = (ref) =>
    /^\d+$/.test(ref)
      ? page.locator(`[data-walk="${ref}"]`).first()
      : page.locator(`[data-walk-name="${ref.replace(/"/g, '\\"')}"]`).or(page.locator('[data-walk]').filter({ hasText: ref })).first()

  async function run(cmd, a) {
    switch (cmd) {
      case 'open':
        await page.goto(WEB + (a[0]?.startsWith('/') ? a[0] : `/${a[0] ?? ''}`))
        return `open ${a[0]}`
      case 'click': {
        const el = target(a.join(' '))
        if ((await el.count()) === 0) throw new Error(`nothing numbered or named "${a.join(' ')}" in the last listing`)
        const label = await el.getAttribute('data-walk-name')
        await el.click({ timeout: 5000 })
        return `click [${a.join(' ')}] "${label}"`
      }
      case 'type': {
        const el = target(a[0])
        await el.fill(a.slice(1).join(' '), { timeout: 5000 })
        // Suggestions come from Open Library after a pause in typing, slower than a page load.
        await page.waitForTimeout(1500)
        return `type into [${a[0]}] "${a.slice(1).join(' ')}"`
      }
      case 'press':
        await page.keyboard.press(a[0])
        return `press ${a[0]}`
      case 'scroll':
        await page.evaluate((up) => window.scrollBy(0, (up ? -0.8 : 0.8) * window.innerHeight), a[0] === 'up')
        return `scroll ${a[0] === 'up' ? 'up' : 'down'}`
      case 'back':
        await page.goBack()
        return 'back'
      case 'look':
        return null
      default:
        throw new Error(`unknown command ${cmd}`)
    }
  }

  const server = http.createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const { cmd, args: a } = JSON.parse(body)
    if (cmd === 'mark') {
      write(`\n## ${a.join(' ')}`)
      res.end('ok')
      return
    }
    if (cmd === 'stop') {
      write('# stopped')
      res.end('stopped')
      server.close()
      await browser.close()
      return
    }
    let text
    try {
      const done = await run(cmd, a)
      await settle()
      if (done) write(`${++step}. ${done} → ${new URL(page.url()).pathname}`)
      text = await describe(page, path.join(out, `step-${String(step).padStart(3, '0')}.png`), done)
    } catch (e) {
      write(`   failed: ${cmd} ${a.join(' ')}: ${e.message.split('\n')[0]}`)
      text = `Failed: ${e.message.split('\n')[0]}\n\n${await describe(page, null, null)}`
    }
    res.end(text)
  })
  server.listen(PORT, () => console.log(`walk server on ${PORT}, log ${log}`))
}

async function describe(page, shot, done) {
  const view = await page.evaluate(LIST)
  if (shot) await page.screenshot({ path: shot })
  const fmt = (i) =>
    `[${i.n}] ${i.role} "${i.name}"${i.iconOnly ? ' (icon only)' : ''}${i.state.length ? ` (${i.state.join(', ')})` : ''}`
  const inView = view.items.filter((i) => i.where === 'view')
  const below = view.items.filter((i) => i.where === 'below')
  return [
    done ? `Did: ${done}` : null,
    `Address: ${view.path} · ${view.title}`,
    view.dialog ? `A dialog or menu is open: "${view.dialog}"` : null,
    view.headings.length ? `Headings in view: ${view.headings.join(' · ')}` : null,
    view.messages.length ? `Messages: ${view.messages.join(' · ')}` : null,
    `In view (${inView.length}):`,
    ...inView.slice(0, 50).map((i) => `  ${fmt(i)}`),
    below.length ? `Further down, needs scrolling (${below.length}): ${below.slice(0, 40).map(fmt).join(' · ')}` : null,
    shot ? `Screenshot: ${shot}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

// Runs in the page: numbers every visible control (data-walk) and says where it is.
function LIST() {
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=menuitemradio],[role=menuitemcheckbox],[role=option],[role=switch],[role=checkbox],[role=radio],[role=combobox]'
  document.querySelectorAll('[data-walk]').forEach((e) => e.removeAttribute('data-walk'))
  const shown = (el) => {
    const r = el.getBoundingClientRect()
    const st = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && Number(st.opacity) > 0 && !el.closest('[aria-hidden="true"],[inert]')
  }
  const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim()
  const items = []
  let n = 0
  for (const el of document.querySelectorAll(sel)) {
    if (!shown(el)) continue
    const tag = el.tagName
    const role = el.getAttribute('role')
      ?? { A: 'link', BUTTON: 'button', SELECT: 'combobox', TEXTAREA: 'textbox', SUMMARY: 'button' }[tag]
      ?? (tag === 'INPUT' ? { checkbox: 'checkbox', radio: 'radio', search: 'searchbox', range: 'slider', submit: 'button' }[el.type] ?? 'textbox' : 'control')
    const text = clean(el.innerText)
    let name = clean(el.getAttribute('aria-label'))
      || clean((el.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id)?.innerText ?? '').join(' '))
      || (el.labels?.length ? clean(el.labels[0].innerText) : '')
      || text || clean(el.title) || clean(el.placeholder) || clean(el.querySelector('img[alt]')?.alt)
    name = name.slice(0, 80)
    const state = []
    if (el.getAttribute('aria-current') && el.getAttribute('aria-current') !== 'false') state.push('current')
    if (el.getAttribute('aria-selected') === 'true') state.push('selected')
    if (el.getAttribute('aria-pressed') === 'true' || el.checked) state.push('on')
    if (el.getAttribute('aria-expanded') === 'true') state.push('open')
    if (el.getAttribute('aria-expanded') === 'false') state.push('closed')
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') state.push('disabled')
    if (el.value && ['INPUT', 'TEXTAREA'].includes(tag) && !['checkbox', 'radio', 'submit'].includes(el.type)) state.push(`value "${clean(el.value).slice(0, 30)}"`)
    const r = el.getBoundingClientRect()
    const where = r.bottom <= 0 ? 'above' : r.top >= window.innerHeight ? 'below' : 'view'
    el.setAttribute('data-walk', String(++n))
    el.setAttribute('data-walk-name', name)
    items.push({ n, role, name: name || '(no name)', state, where, iconOnly: !text && !el.labels?.length })
  }
  const inView = (el) => {
    const r = el.getBoundingClientRect()
    return shown(el) && r.bottom > 0 && r.top < window.innerHeight
  }
  const dialog = [...document.querySelectorAll('[role=dialog],[role=menu],[role=listbox],dialog[open]')].find(shown)
  return {
    path: location.pathname + location.search,
    title: document.title,
    dialog: dialog ? clean(dialog.getAttribute('aria-label') ?? dialog.innerText).slice(0, 60) : null,
    headings: [...document.querySelectorAll('h1,h2,h3')].filter(inView).map((h) => `${h.tagName.toLowerCase()} ${clean(h.innerText).slice(0, 60)}`),
    messages: [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].filter(inView).map((m) => clean(m.innerText)).filter(Boolean).slice(0, 5),
    items,
  }
}
