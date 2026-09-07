import { chromium } from 'playwright-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.fill('input[type="email"]', 'claude.smoke@test.dev')
await page.fill('input[type="password"]', 'Smoke1234!')
await page.click('button[type="submit"]')
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

// Scripts page -> open a saved script (lands in cockpit)
await page.click('.es-nav-item:has-text("Scripts")')
await page.waitForSelector('tbody tr', { timeout: 10000 })
await page.click('tbody tr >> nth=0')
await page.waitForTimeout(1200)

// cockpit lives inside ScriptCockpit view — measure title + a content block
const m = await page.evaluate(() => {
  const t = document.querySelector('.ps-title')
  const lang = document.querySelector('.lang-switcher, .cs-toolbar, .ck-lang, .ps-card, .sel-block, .pcard')
  const container = document.querySelector('.ps-container')
  return {
    titleLeft: t ? Math.round(t.getBoundingClientRect().left) : null,
    contentLeft: lang ? Math.round(lang.getBoundingClientRect().left) : null,
    hasPsContainer: !!container,
    bodyText: document.body.innerText.slice(0, 120).replace(/\n/g, ' | '),
  }
})
console.log('cockpit', JSON.stringify(m))
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/pad2-cockpit-fixed.png' })
await browser.close()
console.log('done')