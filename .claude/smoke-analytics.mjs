import { chromium } from 'playwright-core'
import jwt from 'jsonwebtoken'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const token = jwt.sign({ userId: 4, email: 'admin@pitchstudio.io' }, 'dev-secret', { expiresIn: '1h' })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const failures = []
page.on('response', (r) => { if (r.url().includes('/api/analytics') && r.status() !== 200) failures.push(`${r.status()} ${r.url()}`) })
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0, 150)) })
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.evaluate((t) => { localStorage.setItem('ps_token', t); localStorage.setItem('ps_view', 'analytics') }, token)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.es-sidebar', { timeout: 15000 })
const intelItem = page.locator('.es-nav-item:has-text("Analytics")')
if (!(await intelItem.isVisible().catch(() => false))) await page.click('.es-group-header:has-text("Intelligence")')
await intelItem.click()
await page.waitForSelector('.ci-kpi-bar', { timeout: 15000 })
await page.waitForTimeout(1200)

const kpis = await page.locator('.ci-kpi-value').allTextContents()
const subs = await page.locator('.ci-kpi-sublabel').allTextContents()
console.log('KPIs:', JSON.stringify(kpis))
console.log('Subs:', JSON.stringify(subs))
console.log('Failed analytics calls:', failures.length ? failures.join(' | ') : 'none')
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/analytics-user4.png', fullPage: true })
await browser.close()