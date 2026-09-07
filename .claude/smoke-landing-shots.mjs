import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap')
await p.waitForTimeout(900)
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-anim-hero.png' })
await p.evaluate(() => document.querySelector('.lp-mock').scrollIntoView({ block: 'center' }))
await p.waitForTimeout(1200)
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-anim-mock.png' })
await b.close()
console.log('shots saved')