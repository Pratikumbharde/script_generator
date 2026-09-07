import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => { if (m.type() === 'error' && !/401|404/.test(m.text())) console.log('ERR:', m.text().slice(0, 120)) })
p.on('response', async (r) => {
  if (r.url().includes('/api/auto-optimizations/generate')) {
    try { const j = await r.json(); console.log('GENERATE RESP: duplicate=', j.duplicate, 'uplift=', JSON.stringify(j.optimization?.measured_uplift), 'conf=', j.optimization?.confidence_score, 'why=', (j.optimization?.why || '').slice(0, 200)) } catch {}
  }
})

await p.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('input[type="email"]', { timeout: 10000 })
await p.fill('input[type="email"]', 'admin@pitchstudio.io')
await p.fill('input[type="password"]', 'CiTestTemp123!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
try { await p.waitForSelector('.tg-tip', { timeout: 3000 }) } catch {}
while (await p.locator('.tg-tip').count()) { await p.click('.tg-btn-pri'); await p.waitForTimeout(200) }

await p.goto('http://localhost:5173/ai-optimization', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2000)
// select the first script in the dropdown
const sel = p.locator('select.fsel').first()
const opts = await sel.locator('option').count()
console.log('script options:', opts)
await sel.selectOption({ index: 1 })
await p.click('button:has-text("Run Analysis")')
console.log('analysis requested, waiting for AI...')
try {
  await p.waitForSelector('.zapi, text=AI Recommendations', { timeout: 120000 })
} catch {}
// wait for new recommendation card or spinner to end
for (let i = 0; i < 60; i++) {
  if (!(await p.locator('button:has-text("Analyzing…")').count())) break
  await p.waitForTimeout(2000)
}
await p.waitForTimeout(1000)
// open first pending recommendation to inspect
const rec = p.locator('div:has(> div):has-text("AI Recommendations")').first()
const badge = await p.locator('span:has-text("%")').count()
console.log('badges containing %:', badge)
// expand first recommendation
const firstRec = p.locator('div[style*="border: 1.5px solid"]').first()
if (await firstRec.count()) {
  await firstRec.click()
  await p.waitForTimeout(500)
  const txt = await firstRec.textContent()
  console.log('REC TEXT:', txt.slice(0, 600).replace(/\s+/g, ' '))
}
await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/autoopt-after.png' })
await b.close()