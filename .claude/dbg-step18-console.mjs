import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => { if (m.text().includes('TOUR-DBG')) console.log('CONSOLE:', m.text()) })
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForSelector('.tg-tip', { timeout: 8000 })
await p.click('.tg-btn-pri')
for (let i = 0; i < 25; i++) {
  await p.waitForTimeout(400)
  const c = await p.evaluate(() => document.querySelector('.tg-count')?.textContent || '')
  if (c.startsWith('17')) break
  await p.click('.tg-btn-pri')
}
await p.waitForTimeout(1200)
console.log('--- clicking next to Self-Improvement ---')
await p.click('.tg-btn-pri')
await p.waitForTimeout(5000)
await b.close()