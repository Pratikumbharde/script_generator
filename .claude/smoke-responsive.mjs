import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })

const sizes = [
  ['phone', { width: 390, height: 844 }],
  ['tablet', { width: 768, height: 1024 }],
]
const pages = [
  ['permissions', async (page) => {
    await openDrawer(page)
    await page.click('.es-group-header:has-text("Team")', { timeout: 5000 })
    await page.click('.es-nav-item:has-text("Permissions")', { timeout: 5000 })
    await page.waitForSelector('.ps-table tbody tr', { timeout: 15000 })
  }],
  ['export', async (page) => {
    await openDrawer(page)
    await page.click('.es-group-header:has-text("Admin")', { timeout: 5000 })
    await page.click('.es-nav-item:has-text("Export")', { timeout: 5000 })
    await page.waitForSelector('.exp-included-grid', { timeout: 15000 })
  }],
]

// On phone/tablet the sidebar is off-canvas; open it via the mobile toggle or "More" tab
async function openDrawer(page) {
  const visible = await page.evaluate(() => {
    const sb = document.querySelector('.es-sidebar')
    if (!sb) return false
    const r = sb.getBoundingClientRect()
    return r.left > -10 && r.left < window.innerWidth
  })
  if (!visible) {
    const toggle = page.locator('.es-mobile-toggle')
    if (await toggle.isVisible().catch(() => false)) await toggle.click()
    else await page.click('.bt-item:has-text("More")')
    await page.waitForTimeout(400)
  }
}

for (const [sizeName, viewport] of sizes) {
  const ctx = await browser.newContext({ viewport, isMobile: sizeName === 'phone', hasTouch: sizeName === 'phone' })
  const page = await ctx.newPage()
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', 'claude.smoke@test.dev')
  await page.fill('input[type="password"]', 'Smoke1234!')
  await page.click('button[type="submit"]')
  await page.waitForSelector('.es-sidebar', { timeout: 15000 })
  for (const [pageName, nav] of pages) {
    await nav(page)
    await page.waitForTimeout(400)
    await page.screenshot({ path: `D:/office/script_generator/.claude/shots/r-${pageName}-${sizeName}.png`, fullPage: true })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    console.log(`${pageName} @${sizeName}: horizontal overflow = ${overflow}px ${overflow > 0 ? '*** BAD ***' : 'OK'}`)
  }
  await ctx.close()
}
await browser.close()
console.log('done')