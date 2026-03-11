import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

const initialForm = {
  title: '',
  category: 'Food',
  amount: '',
  currency: 'PHP',
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: '',
  receiptName: '',
  receiptSize: 0,
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

const compactNumberFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatReceiptSize = (size) => {
  if (!size) {
    return 'No file attached'
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`
}

const formatDisplayAmount = (amount, currency) => {
  if (!amount) {
    return '—'
  }

  return `${currency} ${compactNumberFormatter.format(Number(amount))}`
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
  const [formData, setFormData] = useState(initialForm)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

        const [metaResponse, expensesResponse] = await Promise.all([
          fetch('/api/meta'),
          fetch(`/api/expenses?userId=${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        const metaData = metaResponse.ok ? await metaResponse.json() : null
        const expenseData = await expensesResponse.json()

        if (!expensesResponse.ok) {
          throw new Error(expenseData.message || 'Failed to load your expenses.')
        }

        setExpenses(expenseData.expenses || [])
        if (metaData?.categories?.length) {
          setCategories(metaData.categories)
          setFormData((prev) => ({
            ...prev,
            category: metaData.categories[0],
          }))
        }
        if (metaData?.currencies) {
          setCurrencies(metaData.currencies)
        }
      } catch (loadError) {
        setError(loadError.message || 'Could not load dashboard data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [token, navigate, user])

  if (!user) {
    return null
  }

  const availableMonths = [...new Set(expenses.map((expense) => expense.expenseDate.slice(0, 7)))].sort(
    (left, right) => right.localeCompare(left),
  )

  const filteredExpenses = expenses.filter((expense) => {
    const matchesMonth = selectedMonth === 'all' || expense.expenseDate.startsWith(selectedMonth)
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory
    const keyword = searchTerm.trim().toLowerCase()
    const matchesKeyword =
      !keyword ||
      expense.title.toLowerCase().includes(keyword) ||
      expense.notes.toLowerCase().includes(keyword)

    return matchesMonth && matchesCategory && matchesKeyword
  })

  const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amountPhp, 0)
  const monthlyTotal = filteredExpenses
    .filter((expense) => expense.expenseDate.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, expense) => sum + expense.amountPhp, 0)

  const topCategory =
    Object.entries(
      filteredExpenses.reduce((accumulator, expense) => {
        accumulator[expense.category] = (accumulator[expense.category] || 0) + expense.amountPhp
        return accumulator
      }, {}),
    ).sort((left, right) => right[1] - left[1])[0]?.[0] || 'No data yet'

  const recentReceiptCount = filteredExpenses.filter((expense) => expense.receiptName).length

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0]

    setFormData((prev) => ({
      ...prev,
      receiptName: file?.name || '',
      receiptSize: file?.size || 0,
    }))
  }

  const resetForm = () => {
    setFormData({
      ...initialForm,
      category: categories[0] || 'Food',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim()) {
      setError('Expense title is required.')
      return
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be greater than zero.')
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          amount: Number(formData.amount),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save expense.')
      }

      setExpenses((prev) => [data.expense, ...prev])
      setSuccess('Expense added successfully.')
      resetForm()
    } catch (submitError) {
      setError(submitError.message || 'Could not save expense.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (expenseId) => {
    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/expenses/${expenseId}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete expense.')
      }

      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId))
      setSuccess('Expense deleted successfully.')
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete expense.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authUser')
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">PocketBooks dashboard</p>
          <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="dashboard-intro">
            Track daily spending, review your uploaded receipts, and compare values across currencies.
          </p>
        </div>

        <div className="topbar-actions">
          <div className="user-chip">
            <span>{user.email}</span>
          </div>
          <button type="button" className="ghost-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {(error || success) && (
        <div className="status-stack">
          {error && <p className="form-message form-error">{error}</p>}
          {success && <p className="form-message form-success">{success}</p>}
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total spent</span>
          <strong>{currencyFormatter.format(totalSpent)}</strong>
          <small>Filtered results in PHP</small>
        </article>
        <article className="stat-card">
          <span>This month</span>
          <strong>{currencyFormatter.format(monthlyTotal)}</strong>
          <small>Current month spending</small>
        </article>
        <article className="stat-card">
          <span>Top category</span>
          <strong>{topCategory}</strong>
          <small>Highest spending bucket</small>
        </article>
        <article className="stat-card">
          <span>Receipts attached</span>
          <strong>{recentReceiptCount}</strong>
          <small>Expenses with proof uploaded</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="panel-card form-card">
          <div className="section-heading">
            <div>
              <h2>Add expense</h2>
              <p>Save a new expense entry with optional receipt metadata.</p>
            </div>
          </div>

          <form className="expense-form" onSubmit={handleSubmit}>
            <div className="field-group field-span-2">
              <label htmlFor="title">Expense title</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. School supplies"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="expenseDate">Date</label>
              <input
                id="expenseDate"
                name="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" value={formData.currency} onChange={handleChange}>
                {Object.keys(currencies).map((currencyCode) => (
                  <option key={currencyCode} value={currencyCode}>
                    {currencyCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group field-span-2">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                placeholder="Add details like merchant, purpose, or class requirement."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="field-group field-span-2">
              <label htmlFor="receipt">Receipt upload</label>
              <input id="receipt" name="receipt" type="file" accept="image/*,.pdf" onChange={handleReceiptChange} />
              <small className="field-help">
                Attached file: {formData.receiptName || 'None'} • {formatReceiptSize(formData.receiptSize)}
              </small>
            </div>

            <div className="field-span-2 form-actions">
              <button type="submit" className="primary-btn" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save expense'}
              </button>
              <button type="button" className="ghost-btn" onClick={resetForm}>
                Reset form
              </button>
            </div>
          </form>
        </div>

        <div className="panel-card insights-card">
          <div className="section-heading">
            <div>
              <h2>Currency quick view</h2>
              <p>Reference values based on the mock exchange table used by the app.</p>
            </div>
          </div>

          <div className="rate-list">
            {Object.entries(currencies).map(([currencyCode, rate]) => (
              <div className="rate-item" key={currencyCode}>
                <strong>{currencyCode}</strong>
                <span>1 {currencyCode} ≈ ₱{compactNumberFormatter.format(rate)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card table-card">
        <div className="section-heading section-heading-wrap">
          <div>
            <h2>Expense history</h2>
            <p>Review spending history, filter records, and remove entries you no longer need.</p>
          </div>

          <div className="filters-row">
            <input
              type="search"
              placeholder="Search title or notes"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              <option value="all">All months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>

            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading your expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">No expenses found yet. Add your first record above.</div>
        ) : (
          <div className="expense-list">
            {filteredExpenses.map((expense) => (
              <article className="expense-item" key={expense.id}>
                <div className="expense-main">
                  <div className="expense-title-row">
                    <h3>{expense.title}</h3>
                    <span className="expense-badge">{expense.category}</span>
                  </div>

                  <p className="expense-meta">
                    {expense.expenseDate} • {formatDisplayAmount(expense.amount, expense.currency)} •{' '}
                    <strong>{currencyFormatter.format(expense.amountPhp)}</strong>
                  </p>

                  <p className="expense-notes">{expense.notes || 'No notes added.'}</p>

                  <p className="receipt-meta">
                    Receipt: {expense.receiptName || 'Not attached'}
                    {expense.receiptName ? ` • ${formatReceiptSize(expense.receiptSize)}` : ''}
                  </p>
                </div>

                <button type="button" className="danger-btn" onClick={() => handleDelete(expense.id)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Dashboard
