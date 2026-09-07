// Smoke test: login → sidebar Team group → Permissions → verify real data + toggle
import { chromium } from 'playwright-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const shots = 'D:/office/script_generator/.claude/shots/'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

// 1. Login
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })
console.log('STEP login: OK — sidebar visible')

// 2. Expand the Team group (collapsed by default)
await page.click('.es-group-header:has-text("Team")')
const permBtn = page.locator('.es-nav-item:has-text("Permissions")')
await permBtn.waitFor({ timeout: 5000 })
await permBtn.click()
console.log('STEP nav: clicked sidebar Team → Permissions')

// 3. Verify real data rendered
await page.waitForSelector('text=Workspace Permissions', { timeout: 15000 })
await page.waitForSelector('.ps-table tbody tr', { timeout: 15000 })
const rows = await page.locator('.ps-table tbody tr').count()
const chips = await page.locator('.exp-included-grid .exp-item').count()
const roleTag = await page.locator('.ps-tag-accent').first().textContent()
console.log(`STEP data: role tag="${roleTag}", permission chips=${chips}, matrix rows=${rows}`)
await page.screenshot({ path: shots + 'permissions-page.png', fullPage: true })

// 4. Toggle editor.can_generate_scripts off, verify checkbox unchecks
const editorRow = page.locator('.ps-table tbody tr:has-text("Editor")')
const firstBox = editorRow.locator('input[type="checkbox"]').first()
const before = await firstBox.isChecked()
await firstBox.click()
await page.waitForTimeout(600) // PUT + reload
const after = await firstBox.isChecked()
console.log(`STEP toggle: editor.generate-scripts ${before ? 'checked' : 'unchecked'} → ${after ? 'checked' : 'unchecked'} (${before !== after ? 'CHANGED ✓' : 'NO CHANGE ✗'})`)
await page.screenshot({ path: shots + 'permissions-toggled.png', fullPage: true })

// 5. Toggle back on
await firstBox.click()
await page.waitForTimeout(600)
const restored = await firstBox.isChecked()
console.log(`STEP restore: back to ${restored ? 'checked ✓' : 'unchecked ✗'}`)

// 6. Reload page — verify persisted state renders
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.ps-table tbody tr', { timeout: 15000 })
const persisted = await page.locator('.ps-table tbody tr:has-text("Editor") input[type="checkbox"]').first().isChecked()
console.log(`STEP persist: after reload editor.generate-scripts is ${persisted ? 'checked ✓' : 'unchecked ✗'}`)

console.log(errors.length ? 'JS ERRORS:\n' + errors.join('\n') : 'JS ERRORS: none')
await browser.close()