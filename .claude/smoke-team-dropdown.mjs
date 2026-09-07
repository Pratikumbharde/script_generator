import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
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
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/team-members.png' })

const rows = p.locator('div:has(> .avatar)').filter({ has: p.locator('button.ps-btn') })
// count role dropdown buttons (chips with chevron)
const ddButtons = p.locator('button.ps-btn.ghost.sm:has(.chip)')
console.log('dropdown buttons:', await ddButtons.count())

const openMenus = async () => p.locator('.dt-dropdown-item').count()

// open first member's dropdown
await ddButtons.nth(0).click()
await p.waitForTimeout(400)
console.log('menus open after clicking member 1:', await openMenus())
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/team-dd-1.png' })

// open second member's dropdown (click its button directly)
await ddButtons.nth(1).click()
await p.waitForTimeout(400)
console.log('menus open after clicking member 2:', await openMenus())
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/team-dd-2.png' })

// toggle second closed
await ddButtons.nth(1).click()
await p.waitForTimeout(400)
console.log('menus open after closing member 2:', await openMenus())
await b.close()