import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.lp-wrap', { timeout: 15000 })

// gradual scroll through the page
const total = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < total; y += 700) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
  await page.waitForTimeout(180)
}
await page.waitForTimeout(1600)

const stats = await page.evaluate(() => ({
  revealed: document.querySelectorAll('.lp-reveal.lp-in').length,
  total: document.querySelectorAll('.lp-reveal').length,
  delaysLeft: Array.from(document.querySelectorAll('.lp-reveal.lp-in'))
    .filter((el) => (parseFloat(el.style.transitionDelay) || 0) > 0).length,
}))
console.log(JSON.stringify(stats))

// hover a feature card → transform should be immediate (no delay)
await page.hover('.lp-feat >> nth=0')
await page.waitForTimeout(350)
const hoverT = await page.evaluate(() => {
  const el = document.querySelector('.lp-feat')
  return getComputedStyle(el).transform
})
console.log('hover transform:', hoverT !== 'none' ? 'applied' : 'none')

await browser.close()
console.log('DONE')