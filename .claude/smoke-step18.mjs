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
await p.waitForSelector('.tg-tip', { timeout: 8000 })

// fast-forward until count reads "17 / 28" (AI Optimization, last before Self-Improvement)
await p.click('.tg-btn-pri') // start
for (let i = 0; i < 25; i++) {
  await p.waitForTimeout(400)
  const c = await p.evaluate(() => document.querySelector('.tg-count')?.textContent || '')
  if (c.startsWith('17')) break
  await p.click('.tg-btn-pri')
}
console.log('arrived at:', await p.evaluate(() => document.querySelector('.tg-count')?.textContent))
await p.waitForTimeout(1200)
await p.click('.tg-btn-pri')
console.log('now at:', await p.evaluate(() => document.querySelector('.tg-count')?.textContent))

// sample what the selector matches + spotlight rect over time
for (let t = 0; t < 8; t++) {
  await p.waitForTimeout(600)
  const s = await p.evaluate(() => {
    const el = document.querySelector('.ps-top, .si-top, .ps-header')
    const spot = document.querySelector('.tg-spot')
    const sr = spot?.getBoundingClientRect()
    const er = el?.getBoundingClientRect()
    return {
      matched: el ? `${el.className} t${Math.round(er.top)} l${Math.round(er.left)} w${Math.round(er.width)} h${Math.round(er.height)}` : 'none',
      spot: sr ? `t${Math.round(sr.top)} l${Math.round(sr.left)} w${Math.round(sr.width)} h${Math.round(sr.height)}` : 'none',
    }
  })
  console.log(`t=${(t + 1) * 600}ms`, JSON.stringify(s))
  if (s.spot !== 'none' && s.spot.includes('h1') === false && parseInt(s.spot.split('w')[1]) > 500) break
}
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/tour-step18.png' })
await b.close()