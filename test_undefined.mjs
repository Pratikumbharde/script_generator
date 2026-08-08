import express from 'express'
const app = express()
app.get('/test-undefined', undefined, (req, res) => res.json({ ok: true }))
const server = app.listen(3003, () => {
  fetch('http://localhost:3003/test-undefined').then(r => {
    console.log('Status:', r.status)
    return r.text()
  }).then(text => {
    console.log('Body:', text.slice(0, 200))
    server.close()
  })
})
