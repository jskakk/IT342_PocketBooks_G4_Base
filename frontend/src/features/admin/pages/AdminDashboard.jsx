import { useState, useEffect } from 'react'
import { apiUrl } from '../../../lib/api'
import AdminSidebar from '../components/AdminSidebar'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const authToken = localStorage.getItem('authToken')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(apiUrl('/api/admin/stats'), {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [authToken])

  if (loading) return <div className="dashboard-layout"><AdminSidebar active="dashboard" /><main className="dashboard-main"><p>Loading...</p></main></div>

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="dashboard" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Admin Overview</h1>
          <p>System-wide analytics and management</p>
        </header>
        <div className="dashboard-content admin-full">
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stat-value">{stats?.totalUsers || 0}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stats-card">
              <div className="stat-value">{stats?.totalExpenses || 0}</div>
              <div className="stat-label">Total Expenses</div>
            </div>
            <div className="stats-card">
              <div className="stat-value">₱{stats?.totalFunded?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">Total Funded</div>
            </div>
            <div className="stats-card">
              <div className="stat-value">{stats?.activeTransactions || 0}</div>
              <div className="stat-label">Active Transactions</div>
            </div>
          </div>

          <div className="admin-sections">
            <section className="section">
              <h2 className="section-heading">Top Spenders This Month</h2>
              {stats?.topSpenders && stats.topSpenders.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSpenders.map((spender, idx) => (
                      <tr key={idx}>
                        <td>{spender.fullName}</td>
                        <td>{spender.email}</td>
                        <td>₱{spender.totalSpent?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No spenders yet</p>
              )}
            </section>

            <section className="section">
              <h2 className="section-heading">Recent Sign-ups</h2>
              {stats?.recentSignups && stats.recentSignups.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSignups.map((signup, idx) => (
                      <tr key={idx}>
                        <td>{signup.fullName}</td>
                        <td>{signup.email}</td>
                        <td>{new Date(signup.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No signups yet</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
