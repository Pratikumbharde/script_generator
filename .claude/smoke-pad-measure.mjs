import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

async function measure(label, titleSel, cardSel) {
  const m = await page.evaluate(({ titleSel, cardSel }) => {
    const t = document.querySelector(titleSel)
    const c = document.querySelector(cardSel)
    const body = document.querySelector('.ps-body')
    const cont = document.querySelector('.ps-container')
    const top = document.querySelector('.ps-top')
    const pad = (el) => el ? getComputedStyle(el).padding : null
    return {
      titleLeft: t ? Math.round(t.getBoundingClientRect().left) : null,
      cardLeft: c ? Math.round(c.getBoundingClientRect().left) : null,
      topPad: pad(top), bodyPad: pad(body), contPad: pad(cont),
      bodyDisplay: body ? 'HAS ps-body' : 'no ps-body', contDisplay: cont ? 'HAS ps-container' : 'no ps-container',
    }
  }, { titleSel, cardSel })
  console.log(label, JSON.stringify(m))
}

// Call Studio build form
await page.click('.es-nav-item:has-text("Call Studio")')
await page.waitForTimeout(500)
const prod = page.locator('.ps-card:has-text("SmokeCRM")').first()
if (await prod.isVisible().catch(() => false)) { await prod.click(); await page.waitForTimeout(600) }
await measure('studio', '.ps-title', '.sel-block')

// CI
await page.click('.es-nav-item:has-text("Conversation Intelligence")')
await page.waitForTimeout(700)
await measure('ci', '.ps-title', '.dt-stat-card, .ps-card, .pd-tabs')

// Analytics
await page.click('.es-nav-item:has-text("Analytics")')
await page.waitForTimeout(700)
await measure('analytics', '.ps-title', '.ps-card')
await browser.close()