import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.click('.es-nav-item:has-text("Self-Improvement")')
await p.waitForTimeout(4000)
const els = await p.evaluate(() => Array.from(document.querySelectorAll('.ps-top, .si-top, .ps-header')).map((el) => {
  const r = el.getBoundingClientRect()
  return { cls: el.className, t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }
}))
console.log(JSON.stringify(els, null, 1))
await b.close()