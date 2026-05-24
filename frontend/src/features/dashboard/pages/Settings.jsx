import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { apiUrl } from '../../../lib/api'

function Settings() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  const token = useMemo(() => localStorage.getItem('authToken') || '', [])

  const [activeSection, setActiveSection] = useState('profile')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    monthlyBudget: '',
    institution: '',
  })

  const [notifications, setNotifications] = useState({
    emailReceipts: true,
    expenseAlerts: true,
    weeklySummary: false,
    loginAlerts: true,
  })

  const [displayCurrency, setDisplayCurrency] = useState('PHP')
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user || !token) {
      return
    }

    const loadSettings = async () => {
      try {
        setIsLoading(true)

        const [profileRes, notificationsRes] = await Promise.all([
          fetch(apiUrl('/api/user/profile'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(apiUrl('/api/user/notifications'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (profileRes.ok) {
          const profile = await profileRes.json()
          setFormData({
            fullName: profile.fullName || '',
            email: profile.email || '',
            monthlyBudget: profile.monthlyBudget || '',
            institution: profile.institution || '',
          })
          setDisplayCurrency(profile.displayCurrency || 'PHP')
        }

        if (notificationsRes.ok) {
          const notifs = await notificationsRes.json()
          setNotifications({
            emailReceipts: notifs.emailReceipts ?? true,
            expenseAlerts: notifs.expenseAlerts ?? true,
            weeklySummary: notifs.weeklySummary ?? false,
            loginAlerts: notifs.loginAlerts ?? true,
          })
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        setErrorMessage('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user, token])

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNotificationToggle = async (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    }
    setNotifications(newNotifications)

    try {
      const response = await fetch(apiUrl('/api/user/notifications'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNotifications),
      })

      if (!response.ok) {
        setErrorMessage('Failed to update notifications')
        setNotifications(notifications)
      }
    } catch (err) {
      console.error('Error updating notifications:', err)
      setErrorMessage('Error updating notifications')
      setNotifications(notifications)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setErrorMessage('')
      const response = await fetch(apiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : null,
          institution: formData.institution,
        }),
      })

      if (response.ok) {
        setSaveMessage('✓ Profile updated successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to save profile')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setErrorMessage('Error saving profile')
    }
  }

  const handleCurrencyChange = async (currency) => {
    setDisplayCurrency(currency)

    try {
      const response = await fetch(apiUrl(`/api/user/currency/${currency}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setErrorMessage('Failed to update currency')
        setDisplayCurrency(displayCurrency)
      }
    } catch (err) {
      console.error('Error updating currency:', err)
      setErrorMessage('Error updating currency')
    }
  }

  const handleLogout = () => {
    window.dispatchEvent(new Event('openLogoutModal'))
  }

  const handleExportData = () => {
    alert('Export data feature coming soon. This will download all your expenses as CSV.')
  }

  const handleDeleteExpenses = () => {
    if (window.confirm('Are you sure? This will permanently remove all expenses.')) {
      alert('Delete expenses feature coming soon.')
    }
  }

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure? This action cannot be undone. All your data will be permanently deleted.',
      )
    ) {
      try {
        const response = await fetch(apiUrl('/api/user/account'), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          localStorage.removeItem('authUser')
          localStorage.removeItem('authToken')
          navigate('/login')
        } else {
          setErrorMessage('Failed to delete account')
        }
      } catch (err) {
        console.error('Error deleting account:', err)
        setErrorMessage('Error deleting account')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <Sidebar active="settings" />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>Settings</h1>
          </header>
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="settings" />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Settings</h1>
            <p className="header-date">Manage your account and preferences</p>
          </div>

          <div className="header-actions">
            <button className="avatar-btn" onClick={handleLogout} title="Logout">
              {getInitials()}
            </button>
          </div>
        </header>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            <nav className="settings-nav">
              <button
                className={`settings-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                Profile
              </button>
              <button
                className={`settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                Notifications
              </button>
              <button
                className={`settings-nav-item ${activeSection === 'currency' ? 'active' : ''}`}
                onClick={() => setActiveSection('currency')}
              >
                Currency
              </button>
              <button
                className={`settings-nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                Security
              </button>
              <button
                className={`settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
                onClick={() => setActiveSection('account')}
              >
                Account
              </button>
            </nav>
          </aside>

          <main className="settings-content">
            {errorMessage && (
              <div style={{
                padding: '12px',
                background: '#fef3f2',
                border: '1px solid #fecdca',
                color: '#b42318',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                {errorMessage}
              </div>
            )}

            {activeSection === 'profile' && (
              <>
                <section className="settings-section">
                  <h2>Profile Information</h2>

                  <div className="profile-avatar">
                    <div className="avatar-circle">{getInitials()}</div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Full name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Email address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Monthly budget (₱)</label>
                      <input
                        type="number"
                        name="monthlyBudget"
                        value={formData.monthlyBudget}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-field">
                      <label>School / Institution</label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {saveMessage && <p className="success-message">{saveMessage}</p>}

                  <button className="primary-btn" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </section>
              </>
            )}

            {activeSection === 'notifications' && (
              <section className="settings-section">
                <h2>Notification Preferences</h2>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Email receipts</h3>
                    <p>Get an email after every wallet top-up</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailReceipts}
                      onChange={() => handleNotificationToggle('emailReceipts')}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Expense alerts</h3>
                    <p>Notify when monthly budget reaches 80%</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.expenseAlerts}
                      onChange={() => handleNotificationToggle('expenseAlerts')}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Weekly summary</h3>
                    <p>Receive a weekly spending digest</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.weeklySummary}
                      onChange={() => handleNotificationToggle('weeklySummary')}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Login alerts</h3>
                    <p>Email me when a new device logs in</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.loginAlerts}
                      onChange={() => handleNotificationToggle('loginAlerts')}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </section>
            )}

            {activeSection === 'currency' && (
              <section className="settings-section">
                <h2>Display Currency</h2>
                <p className="section-description">Your balance will be shown in these currencies alongside PHP.</p>

                <div className="currency-grid">
                  {[
                    { code: 'PHP', name: 'Philippine Peso' },
                    { code: 'USD', name: 'US Dollar' },
                    { code: 'EUR', name: 'Euro' },
                    { code: 'JPY', name: 'Japanese Yen' },
                    { code: 'GBP', name: 'British Pound' },
                    { code: 'KRW', name: 'Korean Won' },
                  ].map((curr) => (
                    <button
                      key={curr.code}
                      className={`currency-option ${displayCurrency === curr.code ? 'selected' : ''}`}
                      onClick={() => handleCurrencyChange(curr.code)}
                    >
                      <span className="currency-code">{curr.code}</span>
                      <span className="currency-name">{curr.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'security' && (
              <section className="settings-section">
                <h2>Security Settings</h2>

                <div className="security-item">
                  <h3>Password</h3>
                  <p>Change your password to keep your account secure</p>
                  <button className="ghost-btn">Change Password</button>
                </div>

                <div className="security-item">
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                  <button className="ghost-btn">Enable 2FA</button>
                </div>

                <div className="security-item">
                  <h3>Active Sessions</h3>
                  <p>View and manage devices that have access to your account</p>
                  <button className="ghost-btn">View Sessions</button>
                </div>
              </section>
            )}

            {activeSection === 'account' && (
              <section className="settings-section">
                <h2>Account Management</h2>

                <div className="danger-section">
                  <h3>Danger Zone</h3>

                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Export my data</h4>
                      <p>Download all expenses as CSV</p>
                    </div>
                    <button className="danger-btn" onClick={handleExportData}>
                      Export Data
                    </button>
                  </div>

                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete all expenses</h4>
                      <p>Permanently remove all records</p>
                    </div>
                    <button className="danger-btn" onClick={handleDeleteExpenses}>
                      Delete Expenses
                    </button>
                  </div>

                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete account</h4>
                      <p>This action cannot be undone</p>
                    </div>
                    <button className="danger-btn" onClick={handleDeleteAccount}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </main>
    </div>
  )
}

export default Settings

