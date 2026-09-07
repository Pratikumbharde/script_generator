import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const warnings = []
p.on('console', (m) => {
  if (/cannot be given refs|forwardRef/.test(m.text())) warnings.push(m.text().slice(0, 80))
})
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
try { await p.waitForSelector('.tg-tip', { timeout: 3000 }) } catch {}
while (await p.locator('.tg-tip').count()) { await p.click('.tg-btn-pri'); await p.waitForTimeout(200) }

// expand Prepare, open Practice
if (!(await p.locator('.es-nav-item:has-text("Practice")').count())) {
  await p.click('.es-group-header:has-text("Prepare")'); await p.waitForTimeout(300)
}
await p.click('.es-nav-item:has-text("Practice")')
await p.waitForTimeout(2500)

// start a session: click first script card
const card = p.locator('.ps-card [style*="cursor"], .epc-card, .pcard').first()
await card.click().catch(async () => { await p.locator('.ps-card button:has-text("Practice")').first().click() })
await p.waitForTimeout(4000)

// mic language picker present?
const sel = p.locator('label:has-text("Mic language") select')
console.log('mic language picker:', await sel.count())
if (await sel.count()) {
  console.log('default value:', await sel.inputValue(), '(empty = auto/script language)')
  await sel.selectOption('ta-IN')
  await p.waitForTimeout(500)
  console.log('after pick Tamil → stored:', await p.evaluate(() => localStorage.getItem('ps_sr_lang')))
  console.log('selected value:', await sel.inputValue())
  await p.selectOption('label:has-text("Mic language") select', '')
}
console.log('ref warnings:', warnings.length === 0 ? 'NONE ✓' : warnings)
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/mic-lang.png' })
await b.close()
