import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

const adapter = new JSONFile('server/db.json')
const db = new Low(adapter, { users: [] })

const normalizeEmail = (email) => email.trim().toLowerCase()

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
})

const initializeDb = async () => {
  await db.read()
  db.data ||= { users: [] }
  await db.write()
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({
      message: 'Name, email, and password are required.',
    })
  }

  const normalizedEmail = normalizeEmail(email)
  const existingUser = db.data.users.find((user) => user.email === normalizedEmail)

  if (existingUser) {
    return res.status(409).json({
      message: 'This email is already registered.',
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  db.data.users.push(user)
  await db.write()

  return res.status(201).json({
    message: 'Registration successful.',
    user: sanitizeUser(user),
  })
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      message: 'Email and password are required.',
    })
  }

  const normalizedEmail = normalizeEmail(email)
  const user = db.data.users.find((item) => item.email === normalizedEmail)

  if (!user) {
    return res.status(401).json({
      message: 'Invalid email or password.',
    })
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    return res.status(401).json({
      message: 'Invalid email or password.',
    })
  }

  return res.status(200).json({
    message: 'Login successful.',
    user: sanitizeUser(user),
    token: `demo-token-${user.id}`,
  })
})

initializeDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth server running on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
