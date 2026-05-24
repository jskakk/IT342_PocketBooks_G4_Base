import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'

function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    smsAlerts: true,
  })
  const [saved, setSaved] = useState(false)

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="settings" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Admin Settings</h1>
          <p>Configure global system settings for PocketBooks</p>
        </header>

        <div className="dashboard-content admin-full">
          {saved && <div className="success-message">✓ Settings saved successfully</div>}

          <section className="settings-card">
            <h2>System Configuration</h2>
            <p className="section-description">Configure global system settings for PocketBooks.</p>
          </section>

          <section className="settings-card">
            <h3>🔧 Maintenance Mode</h3>
            <div className="setting-item">
              <div className="setting-control">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={() => handleToggle('maintenanceMode')}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-info">
                <p className="setting-title">Enable maintenance mode</p>
                <p className="setting-description">Disable user access during maintenance</p>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <h3>🔔 Notifications</h3>
            <div className="setting-item">
              <div className="setting-control">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-info">
                <p className="setting-title">Enable email notifications</p>
                <p className="setting-description">Send alerts to admins via email</p>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-control">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.smsAlerts}
                    onChange={() => handleToggle('smsAlerts')}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-info">
                <p className="setting-title">Enable SMS alerts</p>
                <p className="setting-description">Receive critical alerts via SMS</p>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <h3>🔐 API Settings</h3>
            <div className="setting-item">
              <div className="api-key-group">
                <input
                  type="password"
                  value="••••••••••••••••••••••••"
                  disabled
                  className="api-key-input"
                />
                <button className="btn-secondary">Regenerate API Key</button>
              </div>
              <p className="setting-description">Use this key for API integrations</p>
            </div>
          </section>

          <div className="settings-actions">
            <button className="btn-primary" onClick={handleSave}>💾 Save Settings</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminSettings
