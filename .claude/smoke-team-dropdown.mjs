import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

// Count open role-menu CONTAINERS (divs that hold .dt-dropdown-item buttons),
// not the items themselves — one open menu holds 3 role options.
const openMenus = async () => p.evaluate(() => {
  const items = document.querySelectorAll('.dt-dropdown-item')
  const menus = new Set()
  for (const it of items) if (it.parentElement) menus.add(it.parentElement)
  return menus.size
})

await p.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('input[type="email"]', { timeout: 10000 })
await p.fill('input[type="email"]', 'admin@pitchstudio.io')
await p.fill('input[type="password"]', 'CiTestTemp123!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
try { await p.waitForSelector('.tg-tip', { timeout: 3000 }) } catch {}
while (await p.locator('.tg-tip').count()) { await p.click('.tg-btn-pri'); await p.waitForTimeout(200) }
await p.goto('http://localhost:5173/team', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2000)

const ddButtons = p.locator('button.ps-btn.ghost.sm:has(.chip)')
const nDd = await ddButtons.count()
const chips = await p.evaluate(() =>
  [...document.querySelectorAll('button.ps-btn.ghost.sm .chip')].map(c => c.textContent.trim())
)
console.log('dropdown buttons:', nDd, '| chips:', chips.join(', '))
console.log('menus open initially:', await openMenus())

// open member 1
await ddButtons.nth(0).click()
await p.waitForTimeout(400)
const after1 = await openMenus()
console.log('menus open after clicking member 1:', after1)
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/team-dd-1.png' })

// close member 1 (toggle) — the open menu overlays the next button
await ddButtons.nth(0).click()
await p.waitForTimeout(400)
console.log('menus open after closing member 1:', await openMenus())

// open member 2
await ddButtons.nth(1).click()
await p.waitForTimeout(400)
const after2 = await openMenus()
console.log('menus open after clicking member 2:', after2)
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/team-dd-2.png' })

// member 1's menu must NOT have opened alongside
const pass = after1 === 1 && after2 === 1
console.log(pass ? 'PASS: exactly one dropdown opens at a time' : 'FAIL')
await b.close()
process.exit(pass ? 0 : 1)