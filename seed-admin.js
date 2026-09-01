import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'database.sqlite'))

const email = 'admin@pitchstudio.io'
const password = 'Admin@123'
const name = 'Admin'
const company = 'Pitch Studio HQ'

// Check if user exists
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)

if (existing) {
  // Reset password for existing admin
  const hash = bcrypt.hashSync(password, 10)
  db.prepare('UPDATE users SET password_hash = ?, role = ?, name = ? WHERE email = ?').run(hash, 'admin', name, email)
  console.log(`✓ Reset password for existing admin: ${email}`)
} else {
  // Create new admin
  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, company_name, name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(email, hash, company, name, 'admin')

  const userId = result.lastInsertRowid

  const wsResult = db.prepare('INSERT INTO workspaces (name, owner_user_id) VALUES (?, ?)').run(company, userId)
  db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(wsResult.lastInsertRowid, userId, 'owner')

  console.log(`✓ Created admin: ${email}`)
}

db.close()

console.log(`\nAdmin credentials:`)
console.log(`  Email:    ${email}`)
console.log(`  Password:  ${password}`)
console.log(`  Role:      admin`)