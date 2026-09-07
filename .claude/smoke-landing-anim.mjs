import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 200)) })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.lp-wrap', { timeout: 15000 })
await page.waitForTimeout(400)

// 1. above-fold reveals fired
const heroIn = await page.evaluate(() => document.querySelectorAll('.lp-reveal.lp-in').length)
const heroTotal = await page.evaluate(() => document.querySelectorAll('.lp-reveal').length)
console.log(`reveals in-view: ${heroIn}/${heroTotal}`)

// 2. scroll to bottom → all revealed
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
await page.waitForTimeout(1000)
const allIn = await page.evaluate(() => document.querySelectorAll('.lp-reveal.lp-in').length)
console.log(`reveals after full scroll: ${allIn}/${heroTotal}`)

// 3. transitionDelay cleared after reveal (hover stays snappy)
const delay = await page.evaluate(() => {
  const el = document.querySelector('.lp-feat.lp-in')
  return el ? el.style.transitionDelay : 'not found'
})
console.log('feat card transitionDelay after reveal:', delay)

// 4. dark mode toggle
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await page.waitForTimeout(400)
await page.click('.lp-theme')
await page.waitForTimeout(500)
const dark = await page.evaluate(() => ({
  attr: document.querySelector('.ps-root')?.getAttribute('data-theme'),
  stored: localStorage.getItem('ps_theme'),
  bg: getComputedStyle(document.querySelector('.lp-wrap')).backgroundColor,
}))
console.log('dark mode:', JSON.stringify(dark))
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-dark-hero.png' })
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
await page.waitForTimeout(600)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/land-dark-full.png', fullPage: true })

// 5. toggle back to light
await page.click('.lp-theme')
await page.waitForTimeout(400)
const light = await page.evaluate(() => document.querySelector('.ps-root')?.getAttribute('data-theme'))
console.log('back to:', light)

// 6. dark persists across reload
await page.click('.lp-theme') // dark again
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.lp-wrap', { timeout: 10000 })
await page.waitForTimeout(300)
const persisted = await page.evaluate(() => document.querySelector('.ps-root')?.getAttribute('data-theme'))
console.log('after reload theme:', persisted)

await browser.close()
console.log('ALL PASS')