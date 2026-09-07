const BASE = 'http://localhost:3001/api'
async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'claude.smoke@test.dev', password: 'Smoke1234!' }),
  })
  const { token } = await loginRes.json()
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const r = await fetch(`${BASE}/ai-accounts`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ name: 'DeepSeek Test', provider: 'deepseek', model: 'deepseek-chat', api_key: 'sk-fake-key-123' }),
  })
  console.log('status', r.status)
  console.log(await r.text())
}
main()