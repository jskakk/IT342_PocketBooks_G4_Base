import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../../../lib/api'
import { CURRENCIES, convertFromPhp } from '../../../lib/exchangeRates'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../dashboard/components/Sidebar'

const quickAmounts = [100, 250, 500, 1000]
const formatCurrency = (value, currency) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(value)

const getSymbol = (currency) =>
  ({ PHP: '₱', USD: '$', EUR: '€', JPY: '¥', GBP: '£' }[currency] || '₱')

function Wallet() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  const token = useMemo(() => localStorage.getItem('authToken') || '', [])
  const historyKey = user ? `pocketbooksWalletHistory:${user.email || user.id}` : 'pocketbooksWalletHistory'
  const [balance, setBalance] = useState(null)
  const [selectedAmount, setSelectedAmount] = useState(500)
  const [customAmount, setCustomAmount] = useState('')
  const [currency, setCurrency] = useState('PHP')
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(historyKey) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [navigate, user])

  useEffect(() => {
    // persist wallet top-up history locally (balance persisted on server)
    localStorage.setItem(historyKey, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
      setHistory(Array.isArray(savedHistory) ? savedHistory : [])
    } catch {
      setHistory([])
    }
  }, [historyKey])

  useEffect(() => {
    if (!user) return
    // fetch server-backed wallet balance
    const fetchBalance = async () => {
      try {
        const resp = await fetch(apiUrl('/api/wallet'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!resp.ok) return
        const data = await resp.json()
        setBalance(Number(data.balance) || 0)
      } catch {
        // leave balance as null on error
      }
    }

    fetchBalance()
  }, [user, token])

  useEffect(() => {
    const handler = (ev) => {
      const b = ev?.detail?.balance
      if (typeof b === 'number') setBalance(Number(b))
    }

    window.addEventListener('wallet:updated', handler)
    return () => window.removeEventListener('wallet:updated', handler)
  }, [])

  if (!user) {
    return null
  }

  const addFunds = (amount) => {
    if (!amount || amount <= 0) {
      return
    }

    const orderId = `PP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    const now = new Date()
    const record = {
      id: orderId,
      amount,
      currency,
      status: 'SUCCESS',
      timestamp: now.toISOString(),
    }

    // call top-up API then update local history and balance from server
    const topUp = async () => {
      try {
        const resp = await fetch(apiUrl('/api/wallet/topup'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        })

        if (!resp.ok) {
          setHistory((prev) => [record, ...prev].slice(0, 6))
          return
        }

        const data = await resp.json()
        setBalance(Number(data.balance) || 0)
        setHistory((prev) => [record, ...prev].slice(0, 6))
      } catch {
        setHistory((prev) => [record, ...prev].slice(0, 6))
      }
    }

    topUp()
    setCustomAmount('')
  }

  const activeAmount = Number(customAmount) || selectedAmount
  const displayBalance = balance === null ? null : convertFromPhp(balance, currency)
  const conversionCurrencies = CURRENCIES.filter((item) => item !== currency)

  const conversionLabels = conversionCurrencies.slice(0, 3).map((item) => ({
    currency: item,
    value: convertFromPhp(balance, item),
  }))

  return (
    <div className="dashboard-layout">
      <Sidebar active="wallet" />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Wallet</h1>
            <p className="header-date">Manage your balance and top-ups</p>
          </div>
        </header>

        <div className="dashboard-content wallet-layout">
          <div className="main-column">
            <section className="wallet-balance-card">
              <div className="wallet-balance-header">
                <div>
                  <p className="wallet-label">Wallet Balance</p>
                  <h2>
                    {displayBalance === null
                      ? 'Loading...'
                      : formatCurrency(displayBalance, currency)}
                  </h2>
                  <p className="wallet-subtext">Last updated: just now</p>
                </div>

                <label className="wallet-currency-chip" htmlFor="walletCurrency">
                  Select Currency
                  <select
                    id="walletCurrency"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  >
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="GBP">GBP</option>
                  </select>
                </label>
              </div>

              <div className="wallet-conversions">
                {conversionLabels.map((item) => (
                  <span key={item.currency}>
                    ≈ {getSymbol(item.currency)}
                    {item.value.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {item.currency}
                  </span>
                ))}
              </div>
            </section>

            <section className="recent-expenses-section">
              <div className="section-heading">
                <h2>Transaction History</h2>
              </div>

              {history.length === 0 ? (
                <div className="empty-state">No top-ups yet. Add funds to get started.</div>
              ) : (
                <div className="wallet-table-wrap">
                  <table className="expenses-table wallet-history-table">
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>PayPal Order ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.timestamp).toLocaleString()}</td>
                          <td>{item.id}</td>
                          <td>{formatCurrency(item.amount, item.currency || 'PHP')}</td>
                          <td>
                            <span className="status-pill success">SUCCESS</span>
                          </td>
                          <td>
                            <button className="receipt-btn" type="button">
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="sidebar-column">
            <section className="stats-card">
              <div className="section-heading">
                <h2>Add Funds via PayPal</h2>
              </div>

              <p className="field-help">Select an amount to top up your PocketBooks wallet.</p>

              <div className="top-up-grid">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`top-up-button ${selectedAmount === amount ? 'active' : ''}`}
                    onClick={() => setSelectedAmount(amount)}
                  >
                    {getSymbol(currency)} {amount.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="field-group">
                <label htmlFor="customAmount">Or enter custom amount</label>
                <input
                  id="customAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  placeholder="Enter amount..."
                />
              </div>

              <button className="primary-btn wallet-pay-btn" type="button" onClick={() => addFunds(activeAmount)}>
                Pay with PayPal Sandbox
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default Wallet