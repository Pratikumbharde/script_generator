// Repro: click every editable checkbox, log all /workspace/permissions network traffic
import { chromium } from 'playwright-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

page.on('request', (r) => {
  if (r.url().includes('/workspace/permissions')) console.log('>>', r.method(), r.url().replace('http://localhost:3001', ''), r.postData() || '')
})
page.on('response', async (r) => {
  if (r.url().includes('/workspace/permissions')) console.log('<<', r.status(), r.url().replace('http://localhost:3001', ''), (await r.text()).slice(0, 200))
})
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

// Fresh navigation (like the user doing it now, post-restart)
await page.click('.es-group-header:has-text("Team")')
await page.click('.es-nav-item:has-text("Permissions")')
await page.waitForSelector('.ps-table tbody tr', { timeout: 15000 })

for (const role of ['Admin', 'Editor', 'Viewer']) {
  const box = page.locator(`.ps-table tbody tr:has-text("${role}") input[type="checkbox"]`).first()
  const before = await box.isChecked()
  await box.click()
  await page.waitForTimeout(800)
  const after = await box.isChecked()
  console.log(`RESULT ${role}.generate-scripts: ${before} -> ${after} ${before !== after ? 'OK' : '*** STUCK ***'}`)
  await box.click() // toggle back
  await page.waitForTimeout(800)
  console.log(`RESULT ${role} restore: ${await box.isChecked()}`)
}
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/perm-toggle-repro.png', fullPage: true })
await browser.close()