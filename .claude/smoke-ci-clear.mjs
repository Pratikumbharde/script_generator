import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

// Nav to Conversation Intelligence
const item = page.locator('.es-nav-item:has-text("Conversation Intelligence")')
if (await item.isVisible().catch(() => false)) await item.click()
else {
  await page.click('.es-group-header:has-text("Intelligence")', { timeout: 5000 }).catch(() => {})
  await page.click('.es-nav-item:has-text("Conversation Intelligence")', { timeout: 5000 })
}
await page.waitForTimeout(800)

// â”€â”€ Phrases tab â”€â”€
await page.click('.pd-tab:has-text("Phrases")')
await page.waitForTimeout(600)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ci-phrases-initial.png', fullPage: true })
const bodyText = await page.evaluate(() => document.querySelector('.ps-container')?.innerText?.slice(0, 400))
console.log('Phrases tab content head:', JSON.stringify(bodyText))
await page.fill('.dt-search input', 'budget')
await page.waitForTimeout(300)
// open filters, move confidence slider off default, pick a pattern filter
const filterBtn = page.locator('.dt-filter-btn').first()
if (await filterBtn.isVisible()) await filterBtn.click()
await page.waitForTimeout(300)
let cleared = false
const clearBtn = page.locator('button:has-text("Clear all")').first()
const visibleBefore = await clearBtn.isVisible().catch(() => false)
console.log('Phrases: Clear all visible after filters applied =', visibleBefore)
if (visibleBefore) { await clearBtn.click(); await page.waitForTimeout(300); cleared = true }
const searchVal = await page.locator('.dt-search input').first().inputValue()
console.log('Phrases: search after clear = "' + searchVal + '"', searchVal === '' ? 'OK' : '*** BAD ***')
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ci-phrases-clear.png', fullPage: true })

// â”€â”€ Calls tab â”€â”€
await page.click('.pd-tab:has-text("Calls")')
await page.waitForTimeout(600)
await page.fill('.dt-search input', 'test')
const outcomeBtn = page.locator('.dt-filter-group button:has-text("Won")').first()
if (await outcomeBtn.isVisible().catch(() => false)) await outcomeBtn.click()
await page.waitForTimeout(300)
const clearBtn2 = page.locator('button:has-text("Clear all")').first()
const visibleCalls = await clearBtn2.isVisible().catch(() => false)
console.log('Calls: Clear all visible after search+outcome filter =', visibleCalls)
if (visibleCalls) {
  await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ci-calls-filtered.png', fullPage: true })
  await clearBtn2.click()
  await page.waitForTimeout(300)
  const s2 = await page.locator('.dt-search input').first().inputValue()
  console.log('Calls: search after clear = "' + s2 + '"', s2 === '' ? 'OK' : '*** BAD ***')
} else {
  console.log('Calls: NO Clear all button *** BAD ***')
  await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ci-calls-missing.png', fullPage: true })
}
await browser.close()
console.log('done')
