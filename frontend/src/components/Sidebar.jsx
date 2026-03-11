function Sidebar({ active }) {
  const navItems = [
    { icon: '📊', label: 'Dashboard', id: 'dashboard' },
    { icon: '💰', label: 'Expenses', id: 'expenses' },
    { icon: '👛', label: 'Wallet', id: 'wallet' },
    { icon: '📈', label: 'Analytics', id: 'analytics' },
    { icon: '⚙️', label: 'Settings', id: 'settings' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">💚</span>
        <span className="sidebar-title">PocketBooks</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
            onClick={(e) => e.preventDefault()}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
