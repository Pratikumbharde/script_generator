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

// fast-forward to step 17
await p.click('.tg-btn-pri')
for (let i = 0; i < 25; i++) {
  await p.waitForTimeout(400)
  const c = await p.evaluate(() => document.querySelector('.tg-count')?.textContent || '')
  if (c.startsWith('17')) break
  await p.click('.tg-btn-pri')
}
await p.waitForTimeout(1000)

// install a recorder that logs every match of the tour selector for 4s
await p.evaluate(() => {
  window.__log = []
  const SEL = '.ps-top, .si-top, .ps-header'
  const snap = () => {
    const matches = Array.from(document.querySelectorAll(SEL)).map((el) => {
      const r = el.getBoundingClientRect()
      return `${el.className}@t${Math.round(r.top)},l${Math.round(r.left)},w${Math.round(r.width)},h${Math.round(r.height)}${r.width === 0 ? '(HIDDEN)' : ''}`
    })
    window.__log.push(`${matches.length ? matches.join(' | ') : 'no-match'}`)
  }
  const iv = setInterval(snap, 100)
  setTimeout(() => { clearInterval(iv); window.__done = true }, 4000)
})

// click next → Self-Improvement, then dump the recording
await p.click('.tg-btn-pri')
await p.waitForTimeout(4000)
const log = await p.evaluate(() => window.__log)
// condense: print only lines where the match set changed
let prev = ''
for (const line of log) {
  const body = line.split(': ')[1]
  if (body !== prev) { console.log(line); prev = body }
}
await b.close()