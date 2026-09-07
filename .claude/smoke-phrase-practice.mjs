import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => { if (m.type() === 'error' && !/401|404/.test(m.text())) console.log('ERR:', m.text().slice(0, 140)) })

await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'admin@pitchstudio.io')
await p.fill('input[type="password"]', 'CiTestTemp123!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })

// dismiss tour if it opened
try { await p.waitForSelector('.tg-tip', { timeout: 3000 }) } catch {}
while (await p.locator('.tg-tip').count()) {
  await p.click('.tg-btn-pri')
  await p.waitForTimeout(200)
}

// expand Intelligence group and open Conversation Intelligence
if (!(await p.locator('.es-nav-item:has-text("Conversation Intelligence")').count())) {
  await p.click('.es-group-header:has-text("Intelligence")')
  await p.waitForTimeout(300)
}
await p.click('.es-nav-item:has-text("Conversation Intelligence")')
await p.waitForTimeout(3000)

// open the Phrases tab and click the first phrase table row
await p.click('button:has-text("Phrases")')
let cn = 0
for (let i = 0; i < 15; i++) {
  await p.waitForTimeout(1000)
  cn = await p.locator('tbody tr').count()
  if (cn) break
}
console.log('phrase rows:', cn)
if (cn) {
  await p.locator('tbody tr').first().click()
  await p.waitForTimeout(600)
}
const modal = p.locator('.ps-modal')
console.log('modal open:', await modal.count())
if (await modal.count()) {
  console.log('modal phrase:', (await modal.locator('h3').textContent() || '').slice(0, 60))
  await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/phrase-modal.png' })
  await modal.locator('button:has-text("Practice this")').click()
  await p.waitForTimeout(800)
  console.log('still on CI view:', await p.locator('.ci-kpi-bar').count())
  console.log('practice back button:', await p.locator('button:has-text("Back to scripts")').count())
  // wait for the drill scenario to appear (AI generation may take a while)
  try {
    await p.waitForSelector('.practice-buyer', { timeout: 90000 })
    console.log('DRILL STARTED:', (await p.locator('.practice-buyer').textContent()).slice(0, 90))
    console.log('source note:', await p.locator('text=Phrase drill from Conversation Intelligence').count())
  } catch {
    console.log('DRILL NOT STARTED — checking error box')
    console.log('err:', await p.locator('.err').textContent().catch(() => 'none'))
  }
  await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/phrase-practice.png' })
} else {
  console.log('NO PHRASE MODAL OPENED')
  await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/phrase-practice-fail.png' })
}
await b.close()