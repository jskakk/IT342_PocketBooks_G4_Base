import { EXCHANGE_RATES } from './constants.js'
import { db } from './database.js'

export const normalizeEmail = (email) => email.trim().toLowerCase()

export const normalizeCurrency = (currency) => {
  const normalized = currency?.trim()?.toUpperCase()
  return EXCHANGE_RATES[normalized] ? normalized : 'PHP'
}

export const parseToken = (token) => token?.replace('demo-token-', '')

export const decodeGoogleToken = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    return JSON.parse(Buffer.from(payload, 'base64').toString())
  } catch (error) {
    console.error('Failed to decode Google token:', error)
    return null
  }
}

export const getUserFromRequest = (req) => {
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

export const convertToPhp = (amount, currency) => {
  const safeAmount = Number(amount)
  const normalizedCurrency = normalizeCurrency(currency)

  if (Number.isNaN(safeAmount) || safeAmount <= 0) {
    return null
  }

  const phpAmount = safeAmount * EXCHANGE_RATES[normalizedCurrency]
  return Number(phpAmount.toFixed(2))
}

export const sanitizeExpense = (expense) => ({
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

export const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
})