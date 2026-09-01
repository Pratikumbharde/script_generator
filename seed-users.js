import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'database.sqlite'))

const USERS = [
  { email: 'admin@pitchstudio.io', password: 'Admin@123', name: 'Admin User', role: 'admin', company: 'Pitch Studio HQ' },
  { email: 'manager@pitchstudio.io', password: 'Manager@123', name: 'Manager User', role: 'manager', company: 'Pitch Studio HQ' },
  { email: 'member@pitchstudio.io', password: 'Member@123', name: 'Member User', role: 'member', company: 'Pitch Studio HQ' },
]

console.log('Seeding RBAC test users...\n')

for (const u of USERS) {
  // Check if user already exists
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(u.email)
  if (existing) {
    // Update role if needed
    if (existing.role !== u.role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(u.role, existing.id)
      console.log(`✓ Updated role for ${u.email} → ${u.role}`)
    } else {
      console.log(`→ ${u.email} already exists with role "${u.role}", skipping`)
    }
    continue
  }

  const password_hash = bcrypt.hashSync(u.password, 10)

  const userResult = db.prepare(
    'INSERT INTO users (email, password_hash, company_name, name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(u.email, password_hash, u.company, u.name, u.role)

  const userId = userResult.lastInsertRowid

  // Create personal workspace
  const wsResult = db.prepare(
    'INSERT INTO workspaces (name, owner_user_id) VALUES (?, ?)'
  ).run(u.company, userId)

  db.prepare(
    'INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
  ).run(wsResult.lastInsertRowid, userId, u.role === 'admin' ? 'owner' : u.role === 'manager' ? 'admin' : 'member')

  console.log(`✓ Created ${u.role}: ${u.email} / ${u.password}`)
}

db.close()
console.log('\nDone! You can now log in with any of the accounts above.')