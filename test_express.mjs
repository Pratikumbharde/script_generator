import express from 'express'
const app = express()
console.log('express version:', express.version || 'unknown')
console.log('app._router before:', typeof app._router)
app.get('/test', (req, res) => res.json({ ok: true }))
console.log('app._router after:', typeof app._router)
console.log('app._router.stack length:', app._router?.stack?.length)
