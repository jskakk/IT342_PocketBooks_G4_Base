import { Link } from 'react-router-dom'

function Sidebar({ active }) {
  const navItems = [
    { icon: '📊', label: 'Dashboard', id: 'dashboard', to: '/dashboard' },
    { icon: '💰', label: 'Expenses', id: 'expenses', to: '/expenses/new' },
    { icon: '👛', label: 'Wallet', id: 'wallet', to: '/wallet' },
    { icon: '📈', label: 'Analytics', id: 'analytics', to: '/dashboard' },
    { icon: '⚙️', label: 'Settings', id: 'settings', to: '/dashboard' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">💚</span>
        <span className="sidebar-title">PocketBooks</span>
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
      </nav>
    </aside>
  )
}

export default Sidebar
