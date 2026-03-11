import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import jwt from 'jsonwebtoken'

const app = express()
const PORT = 4000
const JWT_SECRET = 'pocketbooks_jwt_secret_key_2026'

const DEFAULT_CURRENCY = 'PHP'
const EXCHANGE_RATES = {
  PHP: 1,
  USD: 56.12,
  EUR: 61.08,
  JPY: 0.38,
  GBP: 71.52,
}

const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'School',
  'Bills',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
]

app.use(cors())
app.use(express.json())

const adapter = new JSONFile('server/db.json')
const db = new Low(adapter, { users: [], expenses: [] })

const normalizeEmail = (email) => email.trim().toLowerCase()
const normalizeCurrency = (currency) => {
  const normalized = currency?.trim()?.toUpperCase()
  return EXCHANGE_RATES[normalized] ? normalized : DEFAULT_CURRENCY
}

const parseToken = (token) => token?.replace('demo-token-', '')

const decodeGoogleToken = (token) => {
  try {
    // Google token format: [header].[payload].[signature]
    // For this demo, we'll decode the payload without verification
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    return decoded
  } catch (error) {
    console.error('Failed to decode Google token:', error)
    return null
  }
}

const getUserFromRequest = (req) => {
  const authorizationHeader = req.headers.authorization || ''
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null

  const userIdFromToken = parseToken(token)
  const userIdFromQuery = req.query.userId?.trim()
  const userIdFromBody = req.body?.userId?.trim()
  const userId = userIdFromToken || userIdFromQuery || userIdFromBody

  if (!userId) {
    return null
  }

  return db.data.users.find((user) => user.id === userId) || null
}

const convertToPhp = (amount, currency) => {
  const safeAmount = Number(amount)
  const normalizedCurrency = normalizeCurrency(currency)

  if (Number.isNaN(safeAmount) || safeAmount <= 0) {
    return null
  }

  const phpAmount = safeAmount * EXCHANGE_RATES[normalizedCurrency]
  return Number(phpAmount.toFixed(2))
}

const sanitizeExpense = (expense) => ({
  id: expense.id,
  userId: expense.userId,
  title: expense.title,
  category: expense.category,
  amount: expense.amount,
  currency: expense.currency,
  amountPhp: expense.amountPhp,
  expenseDate: expense.expenseDate,
  notes: expense.notes,
  receiptName: expense.receiptName,
  receiptSize: expense.receiptSize,
  createdAt: expense.createdAt,
})

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
})

const initializeDb = async () => {
  await db.read()
  db.data ||= { users: [], expenses: [] }
  db.data.users ||= []
  db.data.expenses ||= []
  await db.write()
}

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    currencies: EXCHANGE_RATES,
    categories: EXPENSE_CATEGORIES,
  })
})

app.get('/api/meta', (_, res) => {
  res.json({
    currencies: EXCHANGE_RATES,
    categories: EXPENSE_CATEGORIES,
    defaultCurrency: DEFAULT_CURRENCY,
  })
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

app.post('/api/google-login', async (req, res) => {
  const { token } = req.body

  if (!token?.trim()) {
    return res.status(400).json({
      message: 'Google token is required.',
    })
  }

  try {
    const googleUser = decodeGoogleToken(token)

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        message: 'Invalid Google token.',
      })
    }

    const normalizedEmail = normalizeEmail(googleUser.email)
    let user = db.data.users.find((item) => item.email === normalizedEmail)

    if (!user) {
      // Auto-register user from Google profile
      user = {
        id: randomUUID(),
        name: googleUser.name || googleUser.email.split('@')[0],
        email: normalizedEmail,
        googleId: googleUser.sub,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      }

      db.data.users.push(user)
      await db.write()
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleUser.sub
      user.authProvider = 'google'
      await db.write()
    }

    return res.status(200).json({
      message: 'Google login successful.',
      user: sanitizeUser(user),
      token: `demo-token-${user.id}`,
      provider: 'google',
    })
  } catch (error) {
    console.error('Google login error:', error)
    return res.status(500).json({
      message: 'Failed to process Google login.',
    })
  }
})

app.get('/api/expenses', (req, res) => {
  const user = getUserFromRequest(req)

  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized request.',
    })
  }

  const expenses = db.data.expenses
    .filter((expense) => expense.userId === user.id)
    .sort((left, right) => new Date(right.expenseDate) - new Date(left.expenseDate))
    .map(sanitizeExpense)

  return res.status(200).json({ expenses })
})

app.post('/api/expenses', async (req, res) => {
  const user = getUserFromRequest(req)

  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized request.',
    })
  }

  const {
    title,
    category,
    amount,
    currency,
    expenseDate,
    notes,
    receiptName,
    receiptSize,
  } = req.body

  if (!title?.trim()) {
    return res.status(400).json({
      message: 'Expense title is required.',
    })
  }

  const normalizedCategory = EXPENSE_CATEGORIES.includes(category) ? category : 'Other'
  const normalizedCurrency = normalizeCurrency(currency)
  const amountPhp = convertToPhp(amount, normalizedCurrency)

  if (amountPhp === null) {
    return res.status(400).json({
      message: 'Amount must be greater than zero.',
    })
  }

  const normalizedDate = expenseDate || new Date().toISOString().slice(0, 10)
  const expense = {
    id: randomUUID(),
    userId: user.id,
    title: title.trim(),
    category: normalizedCategory,
    amount: Number(Number(amount).toFixed(2)),
    currency: normalizedCurrency,
    amountPhp,
    expenseDate: normalizedDate,
    notes: notes?.trim() || '',
    receiptName: receiptName?.trim() || '',
    receiptSize: Number(receiptSize) || 0,
    createdAt: new Date().toISOString(),
  }

  db.data.expenses.push(expense)
  await db.write()

  return res.status(201).json({
    message: 'Expense created successfully.',
    expense: sanitizeExpense(expense),
  })
})

app.delete('/api/expenses/:expenseId', async (req, res) => {
  const user = getUserFromRequest(req)

  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized request.',
    })
  }

  const expenseIndex = db.data.expenses.findIndex(
    (expense) => expense.id === req.params.expenseId && expense.userId === user.id,
  )

  if (expenseIndex === -1) {
    return res.status(404).json({
      message: 'Expense not found.',
    })
  }

  db.data.expenses.splice(expenseIndex, 1)
  await db.write()

  return res.status(200).json({
    message: 'Expense deleted successfully.',
  })
})

initializeDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PocketBooks API running on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
