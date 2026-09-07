import { chromium } from 'playwright-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404') && !m.text().includes('401')) console.log('ERR:', m.text().slice(0, 120)) })
const results = []
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`) }

await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('.lp-wrap', { timeout: 15000 })
await p.click('.lp-nav .lp-btn-ghost')
await p.fill('input[type="email"]', 'claude.smoke@test.dev')
await p.fill('input[type="password"]', 'Smoke1234!')
await p.click('button[type="submit"]')
await p.waitForSelector('.es-sidebar', { timeout: 15000 })
// dismiss tour if it opened (auto-start fires ~900ms after login)
try { await p.waitForSelector('.tg-tip', { timeout: 3000 }) } catch { /* no tour this run */ }
while (await p.locator('.tg-tip').count()) {
  await p.click('.tg-btn-pri')
  await p.waitForTimeout(250)
}

if (!(await p.locator('.es-nav-item:has-text("Automation")').count())) {
  await p.click('.es-group-header:has-text("Admin")')
  await p.waitForTimeout(300)
}
await p.click('.es-nav-item:has-text("Automation")')
await p.waitForTimeout(1500)
await p.click('.ps-top .ps-btn.pri') // + Add rule
await p.waitForSelector('.modal', { timeout: 5000 })

const targetInput = p.locator('.modal .finp')
const payloadArea = p.locator('.modal .ftext')

// ── 1. keyboard blocking: spaces and invalid chars never enter webhook field ──
await targetInput.click()
await targetInput.pressSequentially('ht<>tp bad{}')
const blockedVal = await targetInput.inputValue()
check('keyblock: spaces + <>{} stripped while typing', blockedVal === 'httpbad', `got "${blockedVal}"`)

// ── 2. valid chars type normally ──
await targetInput.fill('')
await targetInput.pressSequentially('https://hooks.zapier.com/x')
check('keyblock: valid URL chars type normally', (await targetInput.inputValue()) === 'https://hooks.zapier.com/x')

// ── 3. webhook validator on blur (missing protocol) ──
await targetInput.fill('hooks.zapier.com/x')
await payloadArea.click() // blur target
let err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('webhook: rejects URL without http(s)://', err.includes('http'), `"${err}"`)

// ── 4. paste sanitizer: pasting messy text cleans it ──
await targetInput.fill('')
await p.evaluate(() => navigator.clipboard.writeText('  https://a b<c>.com '))
await targetInput.click()
await p.keyboard.press('Control+v')
await p.waitForTimeout(200)
const pasted = await targetInput.inputValue()
check('paste sanitizer strips spaces/angle brackets', pasted === 'https://ab<c>.com' || pasted === 'https://ab>.com', `got "${pasted}"`)

// ── 5. valid webhook passes ──
await targetInput.fill('https://hooks.zapier.com/hooks/catch/123/abc')
await payloadArea.click()
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('webhook: accepts valid URL', !err, `"${err}"`)

// ── 6. switch to email → format re-validated ──
await p.selectOption('.modal .fsel >> nth=1', 'email')
await p.waitForTimeout(150)
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('action switch: URL re-checked as email → error', err.includes('valid email'), `"${err}"`)

// ── 7. email keyboard: blocks spaces, second @, invalid chars ──
await targetInput.fill('')
await targetInput.pressSequentially('a b@@c d')
const emailVal = await targetInput.inputValue()
check('email keyblock: spaces + double-@ blocked', emailVal === 'ab@cd', `got "${emailVal}"`)

await targetInput.fill('alerts@company')
await payloadArea.click()
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('email: rejects missing domain', err.includes('valid email'), `"${err}"`)
await targetInput.fill('alerts@company.com')
await payloadArea.click()
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('email: accepts valid address', !err, `"${err}"`)

// ── 8. slack: must start with #, restricted charset ──
await p.selectOption('.modal .fsel >> nth=1', 'slack')
await targetInput.fill('sales alerts!')
const slackVal = await targetInput.inputValue()
check('slack keyblock: space/! stripped', slackVal === 'salesalerts', `got "${slackVal}"`)
await payloadArea.click()
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('slack: rejects missing #', err.includes('#'), `"${err}"`)
await targetInput.fill('#sales-alerts')
await payloadArea.click()
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('slack: accepts valid channel', !err, `"${err}"`)

// ── 9. payload JSON validation ──
await payloadArea.fill('{"event": broken')
await targetInput.click()
err = await p.locator('.modal .ferr').last().textContent().catch(() => '')
check('payload: rejects invalid JSON', err.includes('Invalid JSON'), `"${err}"`)
// live re-validation clears as it's fixed
await payloadArea.fill('{"event": "{{trigger}}"}')
await p.waitForTimeout(150)
const errCount = await p.locator('.modal .ferr').count()
check('payload: error clears once JSON is fixed', errCount === 0, `${errCount} errors left`)

// ── 10. save with everything valid → rule appears, modal closes ──
await p.click('.modal .ps-btn.pri')
await p.waitForTimeout(1200)
const modalGone = !(await p.locator('.modal').count())
const rowShown = await p.locator('.lib-row:has-text("#sales-alerts")').count()
check('save: valid rule created, modal closed', modalGone && rowShown > 0, `modalGone:${modalGone} rows:${rowShown}`)

// ── 11. empty target shows error on save click ──
await p.click('.ps-top .ps-btn.pri')
await p.waitForSelector('.modal', { timeout: 5000 })
await p.click('.modal .ps-btn.pri') // Create rule with empty target
await p.waitForTimeout(300)
err = await p.locator('.modal .ferr').first().textContent().catch(() => '')
check('save: empty target blocked with message', (await p.locator('.modal').count()) > 0 && err.length > 0, `"${err}"`)

// ── 12. reopen resets form + errors ──
const urlAfter = await p.locator('.modal .finp').inputValue()
await p.click('.modal .ps-btn.ghost') // Cancel
await p.click('.ps-top .ps-btn.pri')
await p.waitForSelector('.modal', { timeout: 5000 })
const urlFresh = await p.locator('.modal .finp').inputValue()
const errsFresh = await p.locator('.modal .ferr').count()
check('reopen: form + errors reset', urlAfter === urlFresh && errsFresh === 0, `errs:${errsFresh}`)

await p.screenshot({ path: 'D:/office/script_generator/.claude/shots/automation-validation.png' })
await b.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)