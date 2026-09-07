import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })

await p.click('.es-nav-item:has-text("Script Refinement")')
await p.waitForTimeout(1500)

// open a script to reach the baseline view with the performance ring
const card = p.locator('.ds-script-card').first()
if (await card.isVisible().catch(() => false)) {
  await card.click()
  await p.waitForTimeout(1200)
  const m = await p.evaluate(() => {
    const ring = document.querySelector('.ds-score-ring')
    if (!ring) return { ring: false }
    const r = ring.getBoundingClientRect()
    const label = ring.querySelector('.label')
    const value = ring.querySelector('.value')
    const l = label ? label.getBoundingClientRect() : null
    const v = value ? value.getBoundingClientRect() : null
    const labelCenter = l ? Math.round(l.left + l.width / 2) : null
    const valueCenter = v ? Math.round(v.left + v.width / 2) : null
    const ringCenter = Math.round(r.left + r.width / 2)
    return {
      ring: true,
      ringCenter,
      valueCenter,
      labelCenter,
      labelCentered: labelCenter != null && Math.abs(labelCenter - ringCenter) <= 2,
      valueCentered: valueCenter != null && Math.abs(valueCenter - ringCenter) <= 2,
    }
  })
  console.log(JSON.stringify(m))
  await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/refine-ring-center.png' })
} else {
  console.log('no script cards found')
}
await b.close()
console.log('DONE')