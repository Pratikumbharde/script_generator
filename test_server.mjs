import express from 'express'
const app = express()
app.get('/test', (req, res) => res.json({ ok: true }))
app.get('/competitors', (req, res) => res.json({ competitors: [] }))
const server = app.listen(3002, () => {
  console.log('Server on 3002')
  fetch('http://localhost:3002/test').then(r => r.json()).then(data => {
    console.log('/test response:', data)
    return fetch('http://localhost:3002/competitors')
  }).then(r => r.json()).then(data => {
    console.log('/competitors response:', data)
    server.close()
    process.exit(0)
  }).catch(err => {
    console.error('Error:', err)
    server.close()
    process.exit(1)
  })
})
