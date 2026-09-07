const BASE = 'http://localhost:3001/api'
const email = 'claude.smoke@test.dev'
const password = 'Smoke1234!'

async function main() {
  // login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const { token } = await loginRes.json()
  if (!token) throw new Error('login failed: ' + JSON.stringify(loginRes))
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // 1. active config (env fallback expected)
  let r = await fetch(`${BASE}/ai-config`, { headers: auth })
  const cfg = await r.json()
  console.log('1. ai-config (no accounts):', JSON.stringify(cfg))

  // 2. chat through env fallback
  r = await fetch(`${BASE}/chat`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ messages: [{ role: 'user', content: "Say 'Connection OK' and nothing else." }] }),
  })
  const chat = await r.json()
  console.log('2. chat status', r.status, '→', JSON.stringify(chat).slice(0, 200))

  // 3. add a DeepSeek account with fake key and make it primary
  r = await fetch(`${BASE}/ai-accounts`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ name: 'DeepSeek Test', provider: 'deepseek', model: 'deepseek-chat', api_key: 'sk-fake-key-123' }),
  })
  const created = await r.json()
  console.log('3. created account:', created.account?.id, created.account?.provider)
  const accId = created.account?.id

  r = await fetch(`${BASE}/ai-config`, { headers: auth })
  console.log('4. ai-config (deepseek primary):', JSON.stringify(await r.json()))

  // 5. chat should now hit deepseek endpoint and fail with auth error (proves routing)
  r = await fetch(`${BASE}/chat`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  })
  const chat2 = await r.json()
  console.log('5. chat via deepseek status', r.status, '→', JSON.stringify(chat2).slice(0, 160))

  // 6. cleanup: delete account, confirm fallback restored
  await fetch(`${BASE}/ai-accounts/${accId}`, { method: 'DELETE', headers: auth })
  r = await fetch(`${BASE}/ai-config`, { headers: auth })
  console.log('6. ai-config after cleanup:', JSON.stringify(await r.json()))
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })