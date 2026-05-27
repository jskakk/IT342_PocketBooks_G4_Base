import { useState, useEffect, useMemo } from 'react'
import { apiUrl } from '../../../lib/api'
import AdminSidebar from '../components/AdminSidebar'

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterText, setFilterText] = useState('')
  const authToken = localStorage.getItem('authToken')

  const totalCategories = categories.length
  const usedCategories = categories.filter((category) => Number(category.usedInExpenses || 0) > 0).length
  const totalExpensesTracked = categories.reduce((sum, category) => sum + Number(category.usedInExpenses || 0), 0)
  const filteredCategories = useMemo(() => {
    const query = filterText.trim().toLowerCase()
    if (!query) {
      return categories
    }

    return categories.filter((category) => {
      const name = String(category.name || '').toLowerCase()
      const icon = String(category.icon || '').toLowerCase()
      return name.includes(query) || icon.includes(query)
    })
  }, [categories, filterText])

  useEffect(() => {
    fetchCategories()
  }, [authToken])

  const fetchCategories = async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/expenses'), {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      const expenses = Array.isArray(data) ? data : []

      const categoryMap = new Map()

      expenses.forEach((expense) => {
        const rawName = (expense.category || '').trim()
        if (!rawName) {
          return
        }

        const key = rawName.toLowerCase()
        const amount = Number(expense.amountPhp ?? expense.amount ?? 0)
        const createdAt = expense.createdAt || expense.date || ''

        const existing = categoryMap.get(key)
        if (!existing) {
          categoryMap.set(key, {
            id: key,
            name: rawName,
            icon: iconForCategory(rawName),
            createdAt,
            usedInExpenses: 1,
            totalSpent: amount,
          })
          return
        }

        existing.usedInExpenses += 1
        existing.totalSpent += amount
        if (!existing.createdAt || (createdAt && new Date(createdAt) < new Date(existing.createdAt))) {
          existing.createdAt = createdAt
        }
      })

      setCategories(Array.from(categoryMap.values()).sort((left, right) => {
        if (right.usedInExpenses !== left.usedInExpenses) {
          return right.usedInExpenses - left.usedInExpenses
        }
        return left.name.localeCompare(right.name)
      }))
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const iconForCategory = (categoryName) => {
    const normalized = categoryName.trim().toLowerCase()
    switch (normalized) {
      case 'food':
        return '🍔'
      case 'transportation':
        return '🚌'
      case 'school':
        return '🎓'
      case 'bills':
        return '🧾'
      case 'shopping':
        return '🛍️'
      case 'health':
        return '🏥'
      case 'entertainment':
        return '🎬'
      default:
        return '📁'
    }
  }

  if (loading) return <div className="dashboard-layout"><AdminSidebar active="categories" /><main><p>Loading...</p></main></div>

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="categories" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Category Management</h1>
        </header>

        <div className="dashboard-content admin-full">
          <div className="category-stats-grid">
            <div className="category-stat-card">
              <span className="category-stat-label">Total Categories</span>
              <strong>{totalCategories}</strong>
            </div>
            <div className="category-stat-card">
              <span className="category-stat-label">Categories In Use</span>
              <strong>{usedCategories}</strong>
            </div>
            <div className="category-stat-card">
              <span className="category-stat-label">Tracked Expense Entries</span>
              <strong>{totalExpensesTracked}</strong>
            </div>
          </div>

          <p className="category-helper-text">
            These categories are pulled automatically from expense entries. When users choose a category while adding an expense, it appears here with live usage totals.
          </p>

          <div className="category-filter-row">
            <input
              type="text"
              className="category-filter-input"
              placeholder="Filter categories by name or icon"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <table className="data-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Used In</th>
                <th>Total Spent</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-cell">
                    {categories.length === 0
                      ? 'No categories have been recorded yet. Add expenses and the categories will appear here automatically.'
                      : 'No categories match your filter.'}
                  </td>
                </tr>
              ) : filteredCategories.map((cat) => (
                <tr key={cat.id || cat.name}>
                  <td>{cat.icon || '-'}</td>
                  <td>{cat.name}</td>
                  <td>
                    <span className={`usage-pill ${Number(cat.usedInExpenses || 0) > 0 ? 'usage-pill-active' : ''}`}>
                      {cat.usedInExpenses || 0} expenses
                    </span>
                  </td>
                  <td>{phpFormatter.format(Number(cat.totalSpent || 0))}</td>
                  <td>{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default AdminCategories
