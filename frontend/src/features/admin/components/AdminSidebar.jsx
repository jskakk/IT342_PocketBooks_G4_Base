import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function AdminSidebar({ active = 'dashboard' }) {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null')
  const displayName = authUser?.name || authUser?.fullName || authUser?.email || 'Admin'
  const initials = (displayName || 'AD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogoutConfirmed = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('authProvider')
    setConfirmOpen(false)
    navigate('/login')
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">💚</div>
          <div className="sidebar-title">PocketBooks</div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{authUser?.role === 'ROLE_ADMIN' ? 'Admin' : 'Student'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={`sidebar-nav-item ${active === 'dashboard' ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </Link>
          <Link to="/admin/users" className={`sidebar-nav-item ${active === 'users' ? 'active' : ''}`}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">Users</span>
          </Link>
          <Link to="/admin/expenses" className={`sidebar-nav-item ${active === 'expenses' ? 'active' : ''}`}>
            <span className="nav-icon">💰</span>
            <span className="nav-label">Expenses</span>
          </Link>
          <Link to="/admin/categories" className={`sidebar-nav-item ${active === 'categories' ? 'active' : ''}`}>
            <span className="nav-icon">📁</span>
            <span className="nav-label">Categories</span>
          </Link>
          <Link to="/admin/settings" className={`sidebar-nav-item ${active === 'settings' ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/dashboard" className="sidebar-nav-item">
            <span className="nav-icon">←</span>
            <span className="nav-label">Back to User Dashboard</span>
          </Link>

          <button onClick={() => setConfirmOpen(true)} className="btn-primary" style={{ marginTop: 8 }}>
            Logout
          </button>
        </div>
      </aside>

      {confirmOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirm Sign Out</h3>
            <p>Are you sure you want to sign out from PocketBooks?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleLogoutConfirmed}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminSidebar
