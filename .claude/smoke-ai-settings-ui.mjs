import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

// open Settings (footer button)
await page.click('.es-footer-btn:has-text("Settings")', { timeout: 10000 })
await page.waitForSelector('.ai-section', { timeout: 15000 })
await page.waitForTimeout(600)

// scroll to AI section
await page.locator('.ai-section-h:has-text("AI Model Accounts")').scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
const banner = await page.locator('text=Active provider:').first().isVisible().catch(() => false)
console.log('Active provider banner visible:', banner)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ai-settings-list.png', fullPage: false })

// open Add Account modal, check providers
await page.click('button:has-text("Add Account")')
await page.waitForTimeout(400)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ai-settings-modal.png', fullPage: false })
const options = await page.locator('select.fsel option').allTextContents()
console.log('Provider options:', JSON.stringify(options))
// select deepseek and check hint
await page.selectOption('select.fsel', 'deepseek')
await page.waitForTimeout(200)
const hint = await page.locator('.fhint').last().textContent().catch(() => '')
console.log('DeepSeek hint:', hint)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ai-settings-deepseek.png', fullPage: false })
await page.click('button:has-text("Cancel")')
await browser.close()
console.log('done')