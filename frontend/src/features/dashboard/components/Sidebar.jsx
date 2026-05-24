
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Sidebar({ active }) {
  const navigate = useNavigate()
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null')
  const isAdmin = authUser?.role === 'ROLE_ADMIN'
  const displayName = authUser?.name || authUser?.fullName || authUser?.email || 'User'
  const initials = (displayName || 'US')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const navItems = [
    { icon: '📊', label: 'Dashboard', id: 'dashboard', to: '/dashboard' },
    { icon: '💰', label: 'Expenses', id: 'expenses', to: '/expenses/new' },
    { icon: '👛', label: 'Wallet', id: 'wallet', to: '/wallet' },
    { icon: '📈', label: 'Analytics', id: 'analytics', to: '/analytics' },
    { icon: '⚙️', label: 'Settings', id: 'settings', to: '/settings' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('authProvider')
    setConfirmOpen(false)
    navigate('/login')
  }

  useEffect(() => {
    const onOpen = () => setConfirmOpen(true)
    window.addEventListener('openLogoutModal', onOpen)
    return () => window.removeEventListener('openLogoutModal', onOpen)
  }, [])

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">💚</span>
        <span className="sidebar-title">PocketBooks</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{displayName}</div>
          <div className="user-role">{isAdmin ? 'Administrator' : 'Student'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="sidebar-divider" />
            <Link
              to="/admin/dashboard"
              className={`sidebar-nav-item ${active === 'admin' ? 'active' : ''}`}
              style={{ color: '#d4a574', fontWeight: 'bold' }}
            >
              <span className="nav-icon">🔐</span>
              <span className="nav-label">Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={() => setConfirmOpen(true)} className="btn-primary" style={{ marginTop: 8 }}>
          Logout
        </button>
      </div>

      {confirmOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirm Sign Out</h3>
            <p>Are you sure you want to sign out from PocketBooks?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
