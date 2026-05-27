import { useState, useEffect } from 'react'
import { apiUrl } from '../../../lib/api'
import AdminSidebar from '../components/AdminSidebar'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
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

  const handleViewUser = async (userId) => {
    setSelectedUserId(userId)
    setSelectedUser(null)
    setDetailsError('')
    setDetailsLoading(true)

    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      if (!response.ok) {
        throw new Error(`Failed to load user details: ${response.statusText}`)
      }

      const data = await response.json()
      setSelectedUser(data)
    } catch (err) {
      setDetailsError('Failed to load user details. Please try again.')
      console.error('Error fetching user details:', err)
    } finally {
      setDetailsLoading(false)
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
                          <button className="btn-view" onClick={() => handleViewUser(user.id)}>📋 View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

          {(detailsLoading || detailsError || selectedUser) && (
            <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="modal-card user-detail-modal" onClick={(event) => event.stopPropagation()}>
                <h3>User Details</h3>
                {detailsLoading ? (
                  <p>Loading user details...</p>
                ) : detailsError ? (
                  <>
                    <p>{detailsError}</p>
                    <div className="modal-actions">
                      <button className="btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
                      {selectedUserId != null && (
                        <button className="btn-primary" onClick={() => handleViewUser(selectedUserId)}>Retry</button>
                      )}
                    </div>
                  </>
                ) : selectedUser ? (
                  <div className="user-detail-grid">
                    <div>
                      <span className="detail-label">Full Name</span>
                      <div className="detail-value">{selectedUser.fullName}</div>
                    </div>
                    <div>
                      <span className="detail-label">Email</span>
                      <div className="detail-value">{selectedUser.email}</div>
                    </div>
                    <div>
                      <span className="detail-label">Role</span>
                      <div className="detail-value">{selectedUser.role === 'ROLE_ADMIN' ? 'Admin' : 'Student'}</div>
                    </div>
                    <div>
                      <span className="detail-label">Balance</span>
                      <div className="detail-value">₱{selectedUser.balance?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div>
                      <span className="detail-label">Joined</span>
                      <div className="detail-value">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="detail-label">User ID</span>
                      <div className="detail-value">{selectedUser.id}</div>
                    </div>
                  </div>
                ) : null}
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  )
}

export default AdminUsers
