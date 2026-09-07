import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE-ERR:', msg.text().slice(0, 300)) })
page.on('response', (r) => { if (r.status() >= 400) console.log('API', r.status(), r.url()) })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })
await page.click('.es-nav-item:has-text("Scripts")')
await page.waitForTimeout(4000)
const info = await page.evaluate(() => ({
  pcards: document.querySelectorAll('.pcard').length,
  skeletons: document.querySelectorAll('[class*="sk"]').length,
  text: document.body.innerText.slice(0, 400).replace(/\n/g, ' | '),
}))
console.log(JSON.stringify(info, null, 1))
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/dbg-scripts.png' })
await browser.close()