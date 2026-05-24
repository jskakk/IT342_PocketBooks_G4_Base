import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PieChart from '../components/PieChart'
import { apiUrl } from '../../../lib/api'

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

function Dashboard() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  const token = useMemo(() => localStorage.getItem('authToken') || '', [])

  const [expenses, setExpenses] = useState([])
  const categories = fallbackCategories
  const currencies = fallbackCurrencies
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [displayCurrency, setDisplayCurrency] = useState('PHP')

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

        const expensesResponse = await fetch(apiUrl(`/api/expenses?userId=${user.id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const expenseData = await expensesResponse.json()
        if (!expensesResponse.ok) {
          throw new Error(expenseData.message || 'Failed to load expenses.')
        }

        setExpenses(expenseData.expenses || [])
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
    if (toCurrency === 'PHP') return php
    return php / currencies[toCurrency]
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

  const handleDelete = async (expenseId) => {
    try {
      const response = await fetch(apiUrl(`/api/expenses/${expenseId}?userId=${user.id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense.')
      }

      setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
      if (paginatedExpenses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (delError) {
      setError(delError.message || 'Could not delete expense.')
    }
  }

  const handleLogout = () => {
    // Open the shared logout confirmation modal in Sidebar
    window.dispatchEvent(new Event('openLogoutModal'))
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
                  <button className="btn btn-outline" onClick={() => navigate('/expenses/new')}>
                    + Add Expense
                  </button>
                  <button className="btn btn-success" onClick={() => navigate('/wallet')}>
                    + Add Funds
                  </button>
                </div>
              </div>

              <div className="balance-display">
                <h2 className="balance-amount">₱ {totalBalance.toFixed(2)}</h2>
                <p className="balance-usd">
                  ≈ {formatCurrency(convertCurrency(totalBalance, 'USD'), 'USD')}
                </p>
              </div>

              <div className="balance-footer">
                <div className="currency-selector">
                  <label>PHP</label>
                  <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </section>

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
                  {formatCurrency(monthSpent, 'PHP')}
                </strong>
              </div>

              <div className="stat-item">
                <label>Saved</label>
                <strong className="stat-amount" style={{ color: '#5cb85c' }}>
                  {formatCurrency(saved, 'PHP')}
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
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}
      </main>
    </div>
  )

}

export default Dashboard
