import { chromium } from 'playwright-core'
import jwt from 'jsonwebtoken'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const token = jwt.sign({ userId: 4, email: 'admin@pitchstudio.io' }, 'dev-secret', { expiresIn: '1h' })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
page.on('response', (r) => { if (r.url().includes('/deal-scores/analyze') && r.status() !== 200) console.log('ANALYZE HTTP', r.status()) })

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await page.evaluate((t) => { localStorage.setItem('ps_token', t); localStorage.setItem('ps_view', 'dealscores') }, token)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.es-sidebar', { timeout: 15000 })

// Open Deal Scores page
const dsItem = page.locator('.es-nav-item:has-text("Deal Score")')
if (!(await dsItem.isVisible().catch(() => false))) await page.click('.es-group-header:has-text("Intelligence")')
await dsItem.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ds-landing.png' })

// Click "Score This Deal" CTA
const scoreBtn = page.locator('button:has-text("Analyze a deal")').first()
await scoreBtn.click()
await page.waitForTimeout(600)

// Source should default to "previous" — click the first call card
const callCard = page.locator('div:has-text("Outcome:")').filter({ hasText: 'Outcome:' }).last()
await callCard.waitFor({ timeout: 5000 })
await callCard.click()
await page.waitForTimeout(300)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ds-form.png' })

// Analyze
const analyzeBtn = page.locator('button:has-text("Score this deal")').first()
await analyzeBtn.click()
console.log('clicked Analyze, waiting…')

// Wait for scoring to finish — either an error banner or the result view
const start = Date.now()
let outcome = 'timeout'
while (Date.now() - start < 120000) {
  const errTxt = await page.evaluate(() => {
    const t = document.body.innerText
    if (t.includes('Selected call has no transcript')) return 'TRANSCRIPT ERROR STILL FIRES'
    if (t.includes('Please paste a transcript')) return 'PASTE ERROR FIRES'
    if (t.includes('Failed to') || /HTTP \d+/.test(t)) return 'OTHER ERROR: ' + (t.match(/.{0,60}(Failed to|HTTP \d+).{0,60}/) || [''])[0]
    return null
  })
  if (errTxt) { outcome = errTxt; break }
  const busy = await page.locator('text=Scoring with AI').isVisible().catch(() => false)
  if (!busy) {
    const done = await page.evaluate(() => {
      const t = document.body.innerText
      return /Score Results|Deal Score|Risk Factors|Next Action|Recommended|close probability/i.test(t)
    })
    outcome = done ? 'ANALYSIS RESULT SHOWN' : 'scoring ended, unknown state'
    break
  }
  await page.waitForTimeout(1500)
}
console.log('OUTCOME:', outcome, `(${Math.round((Date.now() - start) / 1000)}s)`)
await page.screenshot({ path: 'D:/office/script_generator/.claude/shots/ds-result.png', fullPage: true })
await browser.close()