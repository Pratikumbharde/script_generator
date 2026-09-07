import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

// landing (logged out)
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
const landing = await p.evaluate(() => {
  const cs = getComputedStyle(document.body)
  return { margin: cs.margin, bodyLeft: Math.round(document.querySelector('.lp-wrap').getBoundingClientRect().left) }
})
console.log('landing:', JSON.stringify(landing))

// logged in app
await p.click('.lp-nav .lp-btn-ghost')
await p.waitForSelector('input[type="email"]', { timeout: 10000 })
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
const app = await p.evaluate(() => {
  const cs = getComputedStyle(document.body)
  return { margin: cs.margin, sidebarLeft: Math.round(document.querySelector('.es-sidebar').getBoundingClientRect().left) }
})
console.log('app:', JSON.stringify(app))
await b.close()
console.log('DONE')