import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

async function measure(label, cardSel) {
  const m = await page.evaluate((cardSel) => {
    const t = document.querySelector('.ps-title')
    const c = document.querySelector(cardSel)
    return {
      titleLeft: t ? Math.round(t.getBoundingClientRect().left) : null,
      cardLeft: c ? Math.round(c.getBoundingClientRect().left) : null,
    }
  }, cardSel)
  console.log(label, JSON.stringify(m))
}

// Call Studio build form
await page.click('.es-nav-item:has-text("Call Studio")')
await page.waitForTimeout(500)
await measure('studio-picker', '.ps-card')
const prod = page.locator('.ps-card:has-text("SmokeCRM")').first()
if (await prod.isVisible().catch(() => false)) { await prod.click(); await page.waitForTimeout(600) }
await measure('studio-build', '.sel-block')
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/pad2-studio-build.png' })

// CI reference
await page.click('.es-nav-item:has-text("Conversation Intelligence")')
await page.waitForTimeout(700)
await measure('ci', '.dt-stat-card, .ps-card')

// Cockpit: open saved script
await page.click('.es-nav-item:has-text("Call Studio")')
await page.waitForTimeout(500)
const openSaved = page.locator('button:has-text("Open saved script")')
if (await openSaved.isVisible().catch(() => false)) {
  await openSaved.click()
  await page.waitForTimeout(900)
  await measure('cockpit', '.lang-switcher, .ps-card')
  await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/pad2-cockpit.png' })
} else {
  console.log('cockpit: no saved script button — skipped')
}
await browser.close()
console.log('done')