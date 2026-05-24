import { useState, useEffect } from 'react'
import { apiUrl } from '../../../lib/api'
import AdminSidebar from '../components/AdminSidebar'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const authToken = localStorage.getItem('authToken')

  useEffect(() => {
    fetchUsers()
  }, [authToken])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl('/api/admin/users'), {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.statusText}`)
      }
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load users. Please try again.')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      setSuccess('')
      const response = await fetch(apiUrl(`/api/admin/users/${userId}/role`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ role: newRole })
      })
      if (!response.ok) {
        throw new Error('Failed to update role')
      }
      setSuccess(`User role updated to ${newRole === 'ROLE_ADMIN' ? 'Admin' : 'Student'}`)
      setTimeout(() => setSuccess(''), 3000)
      fetchUsers()
    } catch (err) {
      setError('Failed to update user role')
      console.error('Error updating role:', err)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <AdminSidebar active="users" />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>User Management</h1>
          </header>
          <div className="dashboard-content admin-full">
            <div className="loading-state">
              <p>⏳ Loading users...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="users" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>User Management</h1>
          <p>Manage all users and their roles</p>
        </header>

        <div className="dashboard-content admin-full">
          {error && <div className="error-message">❌ {error} <button onClick={fetchUsers} className="btn-link">Retry</button></div>}
          {success && <div className="success-message">✓ {success}</div>}

          {users.length === 0 ? (
            <div className="empty-state">
              <p>📭 No users found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Balance</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="cell-name">{user.fullName}</td>
                      <td className="cell-email">{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="ROLE_STUDENT">👤 Student</option>
                          <option value="ROLE_ADMIN">🔐 Admin</option>
                        </select>
                      </td>
                      <td className="cell-number">₱{user.balance?.toFixed(2) || '0.00'}</td>
                      <td className="cell-date">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-view">📋 View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminUsers
