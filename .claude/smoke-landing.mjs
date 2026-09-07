import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 200)) })

// 1. fresh visit → landing
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.lp-wrap', { timeout: 15000 })
const hero = await page.textContent('.lp-h1')
console.log('LANDING ok — h1:', hero.trim().slice(0, 70))
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-hero.png', fullPage: false })
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-full.png', fullPage: true })

// 2. Register button → register form
await page.click('.lp-nav .lp-btn-pri')
await page.waitForSelector('button:has-text("Create account")', { timeout: 5000 })
console.log('REGISTER form ok')
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-register.png' })

// 3. Back → landing
await page.click('button:has-text("Back")')
await page.waitForSelector('.lp-wrap', { timeout: 5000 })
console.log('BACK to landing ok')

// 4. Sign in button → login form
await page.click('.lp-nav .lp-btn-ghost')
await page.waitForSelector('button:has-text("Sign in")', { timeout: 5000 })
console.log('LOGIN form ok')

// 5. login works → app shell
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })
console.log('LOGIN → app ok')

// 6. signed-out again (localStorage cleared) → landing
await page.evaluate(() => localStorage.clear())
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.lp-wrap', { timeout: 10000 })
console.log('SIGNED-OUT → landing ok')

await browser.close()
console.log('ALL PASS')