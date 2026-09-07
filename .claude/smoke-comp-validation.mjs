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
if (!(await intelItem.isVisible().catch(() => false))) await page.click('.es-group-header:has-text("Intelligence")')
await intelItem.click()
await page.waitForSelector('.ps-top', { timeout: 15000 })

// Open Add modal (empty state button or header button)
const addBtn = page.locator('button:has-text("Add competitor")').first()
await addBtn.click()
await page.waitForSelector('.modal', { timeout: 5000 })

// 1. Submit empty → all four errors
await page.click('.modal button:has-text("Add competitor")')
await page.waitForTimeout(300)
const errs = await page.locator('.modal .ferr').allTextContents()
console.log(`EMPTY SUBMIT: ${errs.length} errors → ${JSON.stringify(errs)}`)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/comp-validation-empty.png' })

// 2. Bad URL keeps only URL error
const modal = page.locator('.modal')
await modal.locator('input[placeholder="e.g. Zoho CRM"]').fill('Valid Co')
await modal.locator('input[placeholder="e.g. CRM Software"]').fill('Testing')
await modal.locator('input[placeholder="https://..."]').fill('not-a-url')
await page.waitForTimeout(300)
console.log(`BAD URL: errors = ${JSON.stringify(await modal.locator('.ferr').allTextContents())}`)

// 3. Fix URL + select product → errors clear, submit works
await modal.locator('input[placeholder="https://..."]').fill('https://validco.example.com')
await modal.locator('select.finp').selectOption({ index: 1 })
await page.waitForTimeout(200)
console.log(`FIXED: errors = ${JSON.stringify(await modal.locator('.ferr').allTextContents())}`)
await page.click('.modal button:has-text("Add competitor")')
await page.waitForTimeout(800)
const created = await page.locator('text=Valid Co').first().isVisible()
console.log(`SUBMIT: modal closed=${await modal.isHidden().catch(() => true)}, detail view shows competitor=${created}`)

// cleanup: delete the created competitor
const TOKEN = (await page.evaluate(() => localStorage.getItem('ps_token')))
const list = await (await fetch('http://localhost:3001/api/competitors', { headers: { Authorization: `Bearer ${TOKEN}` } })).json()
for (const c of list.competitors.filter((c) => c.name === 'Valid Co')) {
  await fetch(`http://localhost:3001/api/competitors/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN}` } })
}
console.log('cleaned up')
await browser.close()