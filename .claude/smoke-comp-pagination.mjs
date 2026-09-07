import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })
const intelItem = page.locator('.es-nav-item:has-text("Competitors")')
if (!(await intelItem.isVisible().catch(() => false))) {
  await page.click('.es-group-header:has-text("Intelligence")')
}
await intelItem.click()
await page.waitForSelector('.epc-grid', { timeout: 15000 })

const prevBtn = page.locator('.ds-btn-ico').nth(0)
const nextBtn = page.locator('.ds-btn-ico').nth(1)
const pagesLabel = page.locator('.ds-pagination-pages')

// Card view (default) — 10 cards + pagination
console.log(`CARDS p1: ${await page.locator('.epc-card').count()} cards | "${await page.locator('.ds-pagination-info').textContent()}" | ${await pagesLabel.textContent()} | prev disabled=${await prevBtn.isDisabled()}`)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/comp-cards-p1.png', fullPage: true })

// Next → page 2
await nextBtn.click()
await page.waitForTimeout(300)
console.log(`CARDS p2: ${await page.locator('.epc-card').count()} cards | ${await pagesLabel.textContent()} | next disabled=${await nextBtn.isDisabled()}`)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/comp-cards-p2.png', fullPage: true })

// First card on page 2 should be "Smoke Comp 2" (sorted newest first)
const firstCardName = await page.locator('.epc-name').first().textContent()
console.log(`CARDS p2 first card: "${firstCardName}"`)

// Back to page 1
await prevBtn.click()
await page.waitForTimeout(300)
console.log(`CARDS back: ${await pagesLabel.textContent()} | first card "${await page.locator('.epc-name').first().textContent()}"`)

// List view pagination
await page.click('.dt-view-toggle button:has-text("List")')
await page.waitForSelector('.dt-table tbody tr', { timeout: 10000 })
console.log(`LIST p1: ${await page.locator('.dt-table tbody tr').count()} rows | "${await page.locator('.ds-pagination-info').textContent()}"`)
await nextBtn.click()
await page.waitForTimeout(300)
console.log(`LIST p2: ${await page.locator('.dt-table tbody tr').count()} rows | ${await pagesLabel.textContent()}`)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/comp-list-p2.png', fullPage: true })

// Search filter resets page and pagination adapts
await page.fill('.dt-search input', 'Smoke Comp 12')
await page.waitForTimeout(400)
console.log(`SEARCH: 1 result expected → pagination visible=${await page.locator('.ds-pagination').isVisible().catch(() => false)}`)

console.log('done')