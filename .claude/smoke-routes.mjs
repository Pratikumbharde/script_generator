import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const B = 'http://localhost:5173'
let pass = 0, fail = 0
const ok = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + ': ' + name); cond ? pass++ : fail++ }

const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => { if (m.type() === 'error' && !/401|404/.test(m.text())) console.log('CONSOLE ERR:', m.text().slice(0, 140)) })

const dismissTour = async () => {
  try { await p.waitForSelector('.tg-tip', { timeout: 3000 }) } catch {}
  while (await p.locator('.tg-tip').count()) {
    await p.click('.tg-btn-pri')
    await p.waitForTimeout(200)
  }
}

// ---------- 1. Logged-out: landing / login / register URLs ----------
await p.goto(B + '/', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
ok('landing at /', p.url().replace(/\/$/, '') === B)

await p.click('.lp-nav .lp-btn-ghost')
await p.waitForSelector('input[type="email"]', { timeout: 10000 })
ok('Sign in → /login', p.url() === B + '/login')

// toggle to register inside LoginView (URL should follow)
const regToggle = p.locator('button:has-text("Create one"), button:has-text("Sign up"), a:has-text("Create")').first()
if (await regToggle.count()) {
  await regToggle.click().catch(() => {})
  await p.waitForTimeout(400)
  ok('register toggle → /register', p.url() === B + '/register')
} else {
  console.log('NOTE: register toggle not found, skipping that check')
}

// direct deep links while logged out
await p.goto(B + '/login', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('input[type="email"]', { timeout: 10000 })
ok('direct /login shows login form', p.url() === B + '/login' && await p.locator('input[type="email"]').count() > 0)

await p.goto(B + '/register', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(800)
ok('direct /register shows register form', p.url() === B + '/register')

// unknown app path while logged out → normalized to /
await p.goto(B + '/analytics', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1200)
ok('logged-out app path → /', new URL(p.url()).pathname === '/')

// ---------- 2. Login → URL becomes /products ----------
await p.goto(B + '/login', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('input[type="email"]', { timeout: 10000 })
await p.fill('input[type="email"]', 'admin@pitchstudio.io')
await p.fill('input[type="password"]', 'CiTestTemp123!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForTimeout(300)
ok('after login → /products', new URL(p.url()).pathname === '/products')
await dismissTour() // note: tour's later steps navigate to /settings as they advance

// ---------- 3. Sidebar navigation updates URL ----------
const navTo = async (label, group, expected) => {
  if (!(await p.locator(`.es-nav-item:has-text("${label}")`).count())) {
    await p.click(`.es-group-header:has-text("${group}")`)
    await p.waitForTimeout(300)
  }
  await p.click(`.es-nav-item:has-text("${label}")`)
  await p.waitForTimeout(700)
  ok(`nav ${label} → ${expected}`, new URL(p.url()).pathname === expected)
}
await navTo('Scripts', 'Sell', '/scripts')
await navTo('Analytics', 'Intelligence', '/analytics')
await navTo('Team', 'Team', '/team')
await navTo('Automation', 'Admin', '/automation-rules')

// ---------- 4. Browser back / forward ----------
await p.goBack(); await p.waitForTimeout(600)
ok('back → /team', new URL(p.url()).pathname === '/team')
await p.goBack(); await p.waitForTimeout(600)
ok('back → /analytics', new URL(p.url()).pathname === '/analytics')
await p.goForward(); await p.waitForTimeout(600)
ok('forward → /team', new URL(p.url()).pathname === '/team')

// ---------- 5. Deep links ----------
await p.goto(B + '/conversation-intelligence', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForTimeout(1500)
ok('deep link /conversation-intelligence', new URL(p.url()).pathname === '/conversation-intelligence' && await p.locator('.es-sidebar').count() > 0)

await p.goto(B + '/products/new', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1200)
ok('deep link /products/new shows form', new URL(p.url()).pathname === '/products/new' && await p.locator('form, input, textarea').count() > 0)

await p.goto(B + '/product/11', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)
const prodVisible = await p.locator('text=PitchPro CRM').count()
ok('deep link /product/11 resolves detail', new URL(p.url()).pathname === '/product/11' && prodVisible > 0)

// back from detail → /products
await p.goBack(); await p.waitForTimeout(600)
ok('back from detail → previous page', new URL(p.url()).pathname === '/products/new' || new URL(p.url()).pathname === '/products')

// product click → /product/:id
await p.goto(B + '/products', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1500)
const card = p.locator('text=PitchPro CRM').first()
if (await card.count()) {
  await card.click(); await p.waitForTimeout(800)
  ok('product click → /product/11', new URL(p.url()).pathname === '/product/11')
} else {
  console.log('NOTE: product card not found on /products')
}

// refresh stays on the same route
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)
ok('refresh keeps /product/11', new URL(p.url()).pathname === '/product/11')

// call-analysis with script query param
await p.goto(B + '/call-analysis?script=24', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForTimeout(1500)
ok('deep link /call-analysis?script=24', new URL(p.url()) === B + '/call-analysis?script=24' || p.url().includes('/call-analysis?script=24'))

await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/routes-final.png', fullPage: false })
await b.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)