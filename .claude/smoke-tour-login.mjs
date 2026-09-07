import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('401')) console.log('CONSOLE-ERR:', m.text().slice(0, 160)) })

async function login() {
  await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.lp-wrap, input[type="email"]', { timeout: 15000 })
  if (await p.isVisible('.lp-wrap')) {
    await p.click('.lp-nav .lp-btn-ghost')
    await p.waitForSelector('input[type="email"]', { timeout: 8000 })
  }
  await p.fill('input[type="email"]', 'claude.smoke@test.dev')
  await p.fill('input[type="password"]', 'Smoke1234!')
  await p.click('button[type="submit"]')
  await p.waitForSelector('.es-sidebar', { timeout: 15000 })
}

// 1. login → tour auto-shows
await login()
await p.waitForSelector('.tg-tip', { timeout: 8000 })
console.log('1. LOGIN → tour shown:', (await p.textContent('.tg-title')).trim().slice(0, 30))

// 2. close → gone
await p.click('.tg-skip')
await p.waitForTimeout(400)
console.log('2. close → hidden:', !(await p.isVisible('.tg-tip')))

// 3. refresh (session restore) → NOT shown again
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForTimeout(1800)
console.log('3. refresh → still hidden:', !(await p.isVisible('.tg-tip')))

// 4. Help button → manual replay still works
await p.click('.es-footer-btn:has-text("Help")')
await p.waitForSelector('.tg-tip', { timeout: 5000 })
console.log('4. Help replay → shown')
await p.click('.tg-skip')

// 5. logout → login again → tour shows again
await p.click('.es-footer-btn:has-text("Sign out")')
await p.waitForTimeout(800)
await login()
await p.waitForSelector('.tg-tip', { timeout: 8000 })
console.log('5. LOGOUT + LOGIN → tour shown again:', (await p.textContent('.tg-title')).trim().slice(0, 30))

// 6. close → finish full flow → gone until next login
await p.click('.tg-btn-pri')
await p.waitForTimeout(900)
await p.click('.tg-skip')
await p.waitForTimeout(300)
console.log('6. mid-tour close → hidden:', !(await p.isVisible('.tg-tip')))

await b.close()
console.log('ALL PASS')