import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
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

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function Analytics() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  const token = useMemo(() => localStorage.getItem('authToken') || '', [])

  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [navigate, user])

  useEffect(() => {
    if (!user) {
      return
    }

    const loadAnalyticsData = async () => {
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
        setError(loadError.message || 'Could not load analytics data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyticsData()
  }, [token, user])

  if (!user) {
    return null
  }

  const getInitials = () => {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthExpenses = expenses.filter((e) => e.expenseDate.startsWith(thisMonth))
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amountPhp, 0)

  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7)
  const lastMonthExpenses = expenses.filter((e) => e.expenseDate.startsWith(lastMonth))
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amountPhp, 0)

  const monthChange = lastMonthTotal !== 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  const categorySpending = fallbackCategories.map((cat) => ({
    category: cat,
    value: expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amountPhp, 0),
    count: expenses.filter((e) => e.category === cat).length,
  }))

  const topCategories = categorySpending.filter((c) => c.value > 0).sort((a, b) => b.value - a.value)

  const allTimeTotal = expenses.reduce((sum, e) => sum + e.amountPhp, 0)

  const categoryPercentages = topCategories.map((cat) => ({
    ...cat,
    percentage: allTimeTotal > 0 ? ((cat.value / allTimeTotal) * 100).toFixed(1) : 0,
  }))

  const getDailySpending = () => {
    const dailyMap = {}
    monthExpenses.forEach((e) => {
      if (!dailyMap[e.expenseDate]) {
        dailyMap[e.expenseDate] = 0
      }
      dailyMap[e.expenseDate] += e.amountPhp
    })
    return Object.entries(dailyMap)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const dailySpending = getDailySpending()
  const avgDailySpend = monthExpenses.length > 0 ? monthTotal / monthExpenses.length : 0

  const handleLogout = () => {
    localStorage.removeItem('authUser')
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="analytics" />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Analytics</h1>
            <p className="header-date">Track your spending patterns and insights</p>
          </div>

          <div className="header-actions">
            <button className="avatar-btn" onClick={handleLogout} title="Logout">
              {getInitials()}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="main-column">
            <section className="analytics-summary-cards">
              <div className="summary-card">
                <p className="card-label">This Month</p>
                <h2 className="card-amount">{phpFormatter.format(monthTotal)}</h2>
                <p className={`card-change ${monthChange >= 0 ? 'positive' : 'negative'}`}>
                  {monthChange >= 0 ? '↑' : '↓'} {Math.abs(monthChange).toFixed(1)}% vs last month
                </p>
              </div>

              <div className="summary-card">
                <p className="card-label">Daily Average</p>
                <h2 className="card-amount">{phpFormatter.format(avgDailySpend)}</h2>
                <p className="card-subtext">{monthExpenses.length} transactions</p>
              </div>

              <div className="summary-card">
                <p className="card-label">Total All Time</p>
                <h2 className="card-amount">{phpFormatter.format(allTimeTotal)}</h2>
                <p className="card-subtext">{expenses.length} transactions</p>
              </div>

              <div className="summary-card">
                <p className="card-label">Last Month</p>
                <h2 className="card-amount">{phpFormatter.format(lastMonthTotal)}</h2>
                <p className="card-subtext">Previous period</p>
              </div>
            </section>

            <section className="recent-expenses-section">
              <div className="section-heading">
                <h2>Spending by Category</h2>
              </div>

              {isLoading ? (
                <div className="loading-state">Loading analytics...</div>
              ) : topCategories.length === 0 ? (
                <div className="empty-state">No spending data yet. Add expenses to see analytics.</div>
              ) : (
                <div className="category-list">
                  {categoryPercentages.map((cat) => (
                    <div key={cat.category} className="category-row">
                      <div className="category-info">
                        <span className="category-name">{cat.category}</span>
                        <span className="category-count">{cat.count} transactions</span>
                      </div>
                      <div className="category-bar-container">
                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{
                              width: `${cat.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="category-stats">
                        <span className="category-amount">{phpFormatter.format(cat.value)}</span>
                        <span className="category-percentage">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {dailySpending.length > 0 && (
              <section className="recent-expenses-section">
                <div className="section-heading">
                  <h2>Daily Spending Trend</h2>
                </div>

                <div className="spending-trend">
                  {dailySpending.map((item) => (
                    <div key={item.date} className="trend-item">
                      <span className="trend-date">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <div className="trend-bar-container">
                        <div
                          className="trend-bar"
                          style={{
                            width: dailySpending.length > 0 ? `${(item.amount / Math.max(...dailySpending.map((d) => d.amount))) * 100}%` : 0,
                          }}
                        />
                      </div>
                      <span className="trend-amount">{phpFormatter.format(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="sidebar-column">
            <div className="stats-card">
              <div className="section-heading">
                <h2>Period Filter</h2>
              </div>

              <div className="filter-options">
                <button
                  className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
                  onClick={() => setDateRange('week')}
                >
                  This Week
                </button>
                <button
                  className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
                  onClick={() => setDateRange('month')}
                >
                  This Month
                </button>
                <button
                  className={`filter-btn ${dateRange === 'quarter' ? 'active' : ''}`}
                  onClick={() => setDateRange('quarter')}
                >
                  This Quarter
                </button>
                <button
                  className={`filter-btn ${dateRange === 'year' ? 'active' : ''}`}
                  onClick={() => setDateRange('year')}
                >
                  This Year
                </button>
              </div>
            </div>

            <div className="stats-card">
              <div className="section-heading">
                <h2>Top Categories</h2>
              </div>

              {topCategories.slice(0, 5).length === 0 ? (
                <p className="empty-state" style={{ marginTop: '10px' }}>
                  No spending yet
                </p>
              ) : (
                <div className="top-categories-list">
                  {topCategories.slice(0, 5).map((cat, idx) => (
                    <div key={cat.category} className="top-cat-item">
                      <span className="top-cat-rank">#{idx + 1}</span>
                      <div className="top-cat-info">
                        <p className="top-cat-name">{cat.category}</p>
                        <p className="top-cat-amount">{phpFormatter.format(cat.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

export default Analytics
