import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('401')) console.log('ERR:', m.text().slice(0, 140)) })

await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
await p.waitForSelector('.tg-tip', { timeout: 8000 })
await p.click('.tg-btn-pri') // start tour → step 1

// walk forward through every targeted step; after each, check spotlight alignment
for (let i = 1; i < 30; i++) {
  // wait up to 13s for the spotlight to align with the page header
  let check = null
  for (let w = 0; w < 26; w++) {
    await p.waitForTimeout(500)
    check = await p.evaluate(() => {
      const spot = document.querySelector('.tg-spot')
      const top = document.querySelector('.ps-top, .si-top, .ps-header')
      const tip = document.querySelector('.tg-tip')
      const title = document.querySelector('.tg-title')?.textContent || ''
      const count = document.querySelector('.tg-count')?.textContent || ''
      if (!tip) return { title, count, spot: false, top: !!top, aligned: null, gone: true }
      if (!top) return { title, count, spot: !!spot, top: false, aligned: null }
      const tr = top.getBoundingClientRect()
      if (!spot) return { title, count, spot: false, top: true, aligned: false, spotRect: null, topRect: { t: Math.round(tr.top), l: Math.round(tr.left) } }
      const sr = spot.getBoundingClientRect()
      const aligned = Math.abs(sr.left - (tr.left - 6)) < 3 && Math.abs(sr.top - (tr.top - 6)) < 3
      return {
        title: title.slice(0, 34), count, spot: true,
        aligned,
        spotPos: { t: Math.round(sr.top), l: Math.round(sr.left), w: Math.round(sr.width) },
        topPos: { t: Math.round(tr.top), l: Math.round(tr.left), w: Math.round(tr.width) },
      }
    })
    if (check.aligned === true || check.gone) break
  }
  if (check == null) break
  const flag = check.aligned === false ? '  <<<<< MISALIGNED' : (check.aligned === null && check.spot ? '' : '')
  const posInfo = check.spotPos && check.topPos
    ? ` dt:${check.spotPos.t - check.topPos.t},${check.spotPos.l - check.topPos.l} spot(t${check.spotPos.t} l${check.spotPos.l} w${check.spotPos.w}) top(t${check.topPos.t} l${check.topPos.l} w${check.topPos.w})`
    : ''
  console.log(`[${count2label(check.count)}] ${check.title} | spot:${check.spot} aligned:${check.aligned}${flag}${posInfo}`)
  if (!check.spot && !check.top) break
  const btn = await p.locator('.tg-btn-pri').textContent()
  if (btn === 'Finish') { console.log('FINISH reached'); break }
  await p.click('.tg-btn-pri')
}
await b.close()

function count2label(c) { return (c || '?').padStart(7) }