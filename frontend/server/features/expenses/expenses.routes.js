import { randomUUID } from 'node:crypto'
import { db } from '../../lib/database.js'
import {
  convertToPhp,
  getUserFromRequest,
  normalizeCurrency,
  sanitizeExpense,
} from '../../lib/helpers.js'
import { EXPENSE_CATEGORIES } from '../../lib/constants.js'

export const registerExpenseRoutes = (app) => {
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

    // Update user balance (if present) then save expense
    const userRecord = db.data.users.find((u) => u.id === user.id)
    if (userRecord) {
      // initialize balance if missing
      if (typeof userRecord.balance !== 'number') {
        userRecord.balance = 0
      }
      userRecord.balance = Number((userRecord.balance - amountPhp).toFixed(2))
    }

    db.data.expenses.push(expense)
    await db.write()

    return res.status(201).json({
      message: 'Expense created successfully.',
      expense: sanitizeExpense(expense),
      balance: userRecord ? userRecord.balance : undefined,
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
}