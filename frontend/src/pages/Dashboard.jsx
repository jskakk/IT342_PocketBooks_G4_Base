import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PieChart from '../components/PieChart'

const fallbackCategories = [
  'Food',
  'Transportation',
  'School',
  'Bills',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
]

const fallbackCurrencies = {
  PHP: 1,
  USD: 56.12,
  EUR: 61.08,
  JPY: 0.38,
  GBP: 71.52,
}

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const initialExpenseForm = {
  title: '',
  category: fallbackCategories[0],
  amount: '',
  currency: 'PHP',
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: '',
  receiptFile: null,
}

function Dashboard() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  const token = useMemo(() => localStorage.getItem('authToken') || '', [])

  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState(fallbackCategories)
  const [currencies, setCurrencies] = useState(fallbackCurrencies)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState('PHP')
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [navigate, user])

  useEffect(() => {
    if (!user) {
      return
    }

    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError('')

        const [expensesResponse, metaResponse] = await Promise.all([
          fetch(`/api/expenses?userId=${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('/api/meta'),
        ])

        const expenseData = await expensesResponse.json()
        if (!expensesResponse.ok) {
          throw new Error(expenseData.message || 'Failed to load expenses.')
        }

        setExpenses(expenseData.expenses || [])

        if (metaResponse.ok) {
          const metaData = await metaResponse.json()
          const serverCurrencies = metaData.currencies || fallbackCurrencies
          const serverCategories = metaData.categories || fallbackCategories

          setCurrencies(serverCurrencies)
          setCategories(serverCategories)
          setExpenseForm((prev) => ({
            ...prev,
            category: serverCategories[0] || fallbackCategories[0],
            currency: metaData.defaultCurrency || 'PHP',
          }))
        }
      } catch (loadError) {
        setError(loadError.message || 'Could not load dashboard data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [token, user])

  if (!user) {
    return null
  }

  const totalBalance = expenses.reduce((sum, e) => sum + e.amountPhp, 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthSpent = expenses
    .filter((e) => e.expenseDate.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amountPhp, 0)
  const saved = totalBalance > monthSpent ? totalBalance - monthSpent : 0

  const receiptCount = expenses.filter((e) => e.receiptName).length

  const categorySpending = categories.map((cat) => ({
    category: cat,
    value: expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amountPhp, 0),
  }))

  const topSpending = categorySpending.filter((c) => c.value > 0)

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.expenseDate) - new Date(a.expenseDate),
  )

  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedExpenses = sortedExpenses.slice(startIdx, startIdx + itemsPerPage)

  const convertCurrency = (php, toCurrency) => {
    if (toCurrency === 'PHP') {
      return php
    }

    const rate = currencies[toCurrency]
    if (!rate) {
      return php
    }

    return php / rate
  }

  const formatCurrency = (amount, curr) => {
    if (curr === 'PHP') {
      return phpFormatter.format(amount)
    } else if (curr === 'USD') {
      return usdFormatter.format(amount)
    }
    return `${curr} ${amount.toFixed(2)}`
  }

  const getInitials = () => {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const validateExpense = () => {
    if (!expenseForm.title.trim()) {
      return 'Expense title is required.'
    }

    if (expenseForm.title.trim().length > 80) {
      return 'Expense title should be 80 characters or less.'
    }

    const parsedAmount = Number(expenseForm.amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Amount must be greater than zero.'
    }

    if (!categories.includes(expenseForm.category)) {
      return 'Please select a valid category.'
    }

    if (!currencies[expenseForm.currency]) {
      return 'Please select a valid currency.'
    }

    if (!expenseForm.expenseDate) {
      return 'Expense date is required.'
    }

    const parsedDate = new Date(expenseForm.expenseDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Expense date is invalid.'
    }

    if (expenseForm.notes.trim().length > 240) {
      return 'Notes must be 240 characters or less.'
    }

    if (expenseForm.receiptFile && expenseForm.receiptFile.size > 2 * 1024 * 1024) {
      return 'Receipt file must be 2 MB or less.'
    }

    return ''
  }

  const resetAddExpenseForm = () => {
    setExpenseForm({
      ...initialExpenseForm,
      category: categories[0] || fallbackCategories[0],
      currency: 'PHP',
      expenseDate: new Date().toISOString().slice(0, 10),
    })
    setFormError('')
  }

  const handleExpenseInputChange = (event) => {
    const { name, value } = event.target
    setExpenseForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0] || null
    setExpenseForm((prev) => ({
      ...prev,
      receiptFile: file,
    }))
  }

  const handleAddExpenseClick = () => {
    setError('')
    setSuccess('')
    resetAddExpenseForm()
    setIsAddExpenseOpen(true)
  }

  const handleExpenseSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setError('')
    setSuccess('')

    const validationMessage = validateExpense()
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        currency: expenseForm.currency,
        expenseDate: expenseForm.expenseDate,
        notes: expenseForm.notes.trim(),
        receiptName: expenseForm.receiptFile?.name || '',
        receiptSize: expenseForm.receiptFile?.size || 0,
      }

      const response = await fetch(`/api/expenses?userId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create expense.')
      }

      setExpenses((prev) => [data.expense, ...prev])
      setSuccess('Expense added successfully.')
      setIsAddExpenseOpen(false)
      resetAddExpenseForm()
      setCurrentPage(1)
    } catch (submitError) {
      setFormError(submitError.message || 'Could not create expense.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (expenseId) => {
    const confirmed = window.confirm('Delete this expense record?')
    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/expenses/${expenseId}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete expense.')
      }

      setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
      setSuccess('Expense deleted successfully.')
      if (paginatedExpenses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (delError) {
      setError(delError.message || 'Could not delete expense.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authUser')
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="dashboard" />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="header-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="header-actions">
            <button className="avatar-btn" onClick={handleLogout} title="Logout">
              {getInitials()}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="main-column">
            <section className="balance-card">
              <div className="balance-header">
                <span className="balance-label">💰 Current Balance</span>
                <div className="balance-controls">
                  <button className="btn btn-outline" onClick={handleAddExpenseClick}>
                    + Add Expense
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => setSuccess('Add funds feature is planned for the next phase.')}
                  >
                    + Add Funds
                  </button>
                </div>
              </div>

              <div className="balance-display">
                <h2 className="balance-amount">
                  {formatCurrency(convertCurrency(totalBalance, displayCurrency), displayCurrency)}
                </h2>
                <p className="balance-usd">
                  ≈ {formatCurrency(convertCurrency(totalBalance, 'USD'), 'USD')}
                </p>
              </div>

              <div className="balance-footer">
                <div className="currency-selector">
                  <label>{displayCurrency}</label>
                  <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
                    {Object.keys(currencies).map((currencyCode) => (
                      <option key={currencyCode} value={currencyCode}>
                        {currencyCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {isAddExpenseOpen && (
              <section className="add-expense-section">
                <h3>Add New Expense</h3>

                {formError && <div className="inline-message inline-message-error">{formError}</div>}

                <form className="add-expense-form" onSubmit={handleExpenseSubmit}>
                  <div className="form-grid">
                    <div className="form-field span-2">
                      <label htmlFor="title">Expense Title</label>
                      <input
                        id="title"
                        name="title"
                        placeholder="e.g. Lunch at canteen"
                        value={expenseForm.title}
                        onChange={handleExpenseInputChange}
                        maxLength={80}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={expenseForm.category}
                        onChange={handleExpenseInputChange}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="currency">Currency</label>
                      <select
                        id="currency"
                        name="currency"
                        value={expenseForm.currency}
                        onChange={handleExpenseInputChange}
                      >
                        {Object.keys(currencies).map((currencyCode) => (
                          <option key={currencyCode} value={currencyCode}>
                            {currencyCode}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="amount">Amount</label>
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={expenseForm.amount}
                        onChange={handleExpenseInputChange}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="expenseDate">Expense Date</label>
                      <input
                        id="expenseDate"
                        name="expenseDate"
                        type="date"
                        value={expenseForm.expenseDate}
                        onChange={handleExpenseInputChange}
                        required
                      />
                    </div>

                    <div className="form-field span-2">
                      <label htmlFor="notes">Notes (Optional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        placeholder="Any additional details..."
                        value={expenseForm.notes}
                        onChange={handleExpenseInputChange}
                        maxLength={240}
                      />
                    </div>

                    <div className="form-field span-2">
                      <label htmlFor="receiptFile">Receipt File (Optional, max 2MB)</label>
                      <input
                        id="receiptFile"
                        name="receiptFile"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptChange}
                      />
                    </div>
                  </div>

                  <div className="add-expense-actions">
                    <button className="btn btn-outline" type="button" onClick={() => setIsAddExpenseOpen(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-success" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Expense'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="recent-expenses-section">
              <h3>Recent Expenses</h3>

              {isLoading ? (
                <div className="loading-state">Loading expenses...</div>
              ) : expenses.length === 0 ? (
                <div className="empty-state">No expenses yet. Add one to get started!</div>
              ) : (
                <>
                  <table className="expenses-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Receipt</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedExpenses.map((expense) => (
                        <tr key={expense.id}>
                          <td>{expense.expenseDate}</td>
                          <td>
                            <span className="category-badge">{expense.category}</span>
                          </td>
                          <td className="description-cell">{expense.title}</td>
                          <td className="amount-cell">{formatCurrency(expense.amountPhp, 'PHP')}</td>
                          <td className="receipt-cell">
                            {expense.receiptName ? (
                              <button className="receipt-btn" title="View receipt">
                                👁 view
                              </button>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="delete-btn"
                              type="button"
                              onClick={() => handleDelete(expense.id)}
                              title="Delete"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="pagination">
                    <span className="pagination-info">
                      Showing {startIdx + 1} of {sortedExpenses.length} expenses
                    </span>

                    <div className="pagination-controls">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        ← Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={page === currentPage ? 'active' : ''}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="sidebar-column">
            <div className="stats-card">
              <div className="stat-item">
                <label>This Month</label>
                <strong className="stat-amount" style={{ color: '#d9534f' }}>
                  {formatCurrency(convertCurrency(monthSpent, displayCurrency), displayCurrency)}
                </strong>
              </div>

              <div className="stat-item">
                <label>Saved</label>
                <strong className="stat-amount" style={{ color: '#5cb85c' }}>
                  {formatCurrency(convertCurrency(saved, displayCurrency), displayCurrency)}
                </strong>
              </div>

              <div className="stat-item">
                <label>{receiptCount} files</label>
                <strong className="stat-label">Receipts</strong>
              </div>
            </div>

            <div className="chart-card">
              <h4>Spending by Category</h4>
              {topSpending.length > 0 ? (
                <>
                  <div className="chart-wrapper">
                    <PieChart data={topSpending} total={topSpending.reduce((s, c) => s + c.value, 0)} />
                  </div>
                  <div className="chart-total">
                    Total: <strong>{formatCurrency(topSpending.reduce((s, c) => s + c.value, 0), 'PHP')}</strong>
                  </div>
                </>
              ) : (
                <div className="empty-state">No spending data yet.</div>
              )}
            </div>
          </aside>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button type="button" onClick={() => setError('')}>
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="success-banner">
            {success}
            <button type="button" onClick={() => setSuccess('')}>
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  )

}

export default Dashboard
