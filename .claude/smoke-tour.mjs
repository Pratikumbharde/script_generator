import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser_newContext(b)
const p = await ctx.newPage()
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 160)) })
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 10000 })

// login
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })

// 1. auto-start welcome
await p.waitForSelector('.tg-tip', { timeout: 8000 })
console.log('AUTO-START ok — welcome:', (await p.textContent('.tg-title')).trim())
console.log('welcome count:', await p.textContent('.tg-count'))
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/tour-welcome.png' })

// 2. start → step 1 lands on Products with spotlight
await p.click('.tg-btn-pri')
await p.waitForTimeout(1200)
console.log('step1:', (await p.textContent('.tg-title')).trim(), '|', await p.textContent('.tg-count'),
  '| view:', await p.evaluate(() => document.querySelector('.ps-title')?.textContent?.trim()))
console.log('spotlight visible:', await p.isVisible('.tg-spot'))
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/tour-products.png' })

// 3. next → Call Studio
await p.click('.tg-btn-pri')
await p.waitForTimeout(1200)
console.log('step2 view:', await p.evaluate(() => document.querySelector('.ps-eyebrow')?.textContent?.trim()))

// 4. next → Scripts
await p.click('.tg-btn-pri')
await p.waitForTimeout(1200)
console.log('step3 view:', await p.evaluate(() => document.querySelector('.ps-eyebrow')?.textContent?.trim()))

// 5. jump to the end (finish) → flag set
while (await p.locator('.tg-btn-pri').textContent() !== 'Finish') {
  await p.click('.tg-btn-pri')
  await p.waitForTimeout(700)
}
await p.click('.tg-btn-pri')
await p.waitForTimeout(600)
console.log('tour finished; flag:', await p.evaluate(() => localStorage.getItem('ps_tour_done_v1')))
console.log('final view:', await p.evaluate(() => document.querySelector('.ps-eyebrow')?.textContent?.trim()))

// 6. reload → no auto tour
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForTimeout(1600)
console.log('after reload tour visible:', await p.isVisible('.tg-tip'))

// 7. Help button replays
await p.click('.es-footer-btn:has-text("Help")')
await p.waitForSelector('.tg-tip', { timeout: 5000 })
console.log('HELP replay ok —', (await p.textContent('.tg-title')).trim())

// 8. skip (X) → flag set
await p.click('.tg-skip')
await p.waitForTimeout(400)
console.log('skip works, tour gone:', !(await p.isVisible('.tg-tip')))

// 9. back button works (replay → next → back)
await p.click('.es-footer-btn:has-text("Help")')
await p.waitForSelector('.tg-tip', { timeout: 5000 })
await p.click('.tg-btn-pri') // step 1
await p.waitForTimeout(900)
await p.click('.tg-btn:has-text("Back")')
await p.waitForTimeout(600)
console.log('back returns to:', (await p.textContent('.tg-title')).trim().slice(0, 30))
await p.click('.tg-skip')

await b.close()
console.log('ALL PASS')

async function browser_newContext(b) { return b.newContext({ viewport: { width: 1440, height: 900 } }) }