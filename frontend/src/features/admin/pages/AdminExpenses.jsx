import { useState, useEffect } from 'react'
import { apiUrl } from '../../../lib/api'
import AdminSidebar from '../components/AdminSidebar'

function AdminExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const authToken = localStorage.getItem('authToken')

  useEffect(() => {
    fetchExpenses()
  }, [authToken])

  const fetchExpenses = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl('/api/admin/expenses'), {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) {
        throw new Error('Failed to load expenses')
      }
      const data = await response.json()
      setExpenses(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load expenses. Please try again.')
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? This action cannot be undone.')) return
    try {
      const response = await fetch(apiUrl(`/api/admin/expenses/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to delete')
      fetchExpenses()
    } catch (err) {
      setError('Failed to delete expense')
      console.error('Error deleting expense:', err)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <AdminSidebar active="expenses" />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>Expense Management</h1>
          </header>
          <div className="dashboard-content admin-full">
            <div className="loading-state">
              <p>⏳ Loading expenses...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="expenses" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Expense Management</h1>
          <p>View and manage all system expenses</p>
        </header>

        <div className="dashboard-content admin-full">
          {error && <div className="error-message">❌ {error} <button onClick={fetchExpenses} className="btn-link">Retry</button></div>}

          {expenses && expenses.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="cell-name">{exp.userName || '—'}</td>
                      <td>{exp.description}</td>
                      <td>{exp.category}</td>
                      <td className="cell-number">₱{exp.amount?.toFixed(2)}</td>
                      <td className="cell-date">{new Date(exp.date).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-view">📋 View</button>
                        <button
                          className="btn-view"
                          style={{color: '#e74c3c'}}
                          onClick={() => handleDelete(exp.id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>📭 No expenses found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminExpenses
