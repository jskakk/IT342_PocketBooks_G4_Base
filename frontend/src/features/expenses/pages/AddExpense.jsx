import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../dashboard/components/Sidebar'
import { apiUrl } from '../../../lib/api'

const categories = ['Food', 'Transportation', 'School', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other']
const currencies = ['PHP', 'USD', 'EUR', 'JPY', 'GBP']

const initialForm = {
  title: '',
  amount: '',
  category: 'Food',
  currency: 'PHP',
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: '',
  receiptFile: null,
}

function AddExpense() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  const token = useMemo(() => localStorage.getItem('authToken') || '', [])

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [navigate, user])

  if (!user) {
    return null
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onReceiptChange = (event) => {
    const file = event.target.files?.[0] || null
    setForm((prev) => ({ ...prev, receiptFile: file }))
  }

  const selectCategory = (category) => {
    setForm((prev) => ({ ...prev, category }))
  }

  const reset = () => {
    setForm(initialForm)
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title.trim()) {
      setError('Expense title is required.')
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be greater than zero.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(apiUrl('/api/expenses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          amount: Number(form.amount),
          category: form.category,
          currency: form.currency,
          expenseDate: form.expenseDate,
          notes: form.notes,
          receiptName: form.receiptFile?.name || '',
          receiptSize: form.receiptFile?.size || 0,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save expense.')
      }

      setSuccess('Expense saved successfully.')
      // if server returned updated balance, notify other components
      if (data && typeof data.balance !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('wallet:updated', { detail: { balance: data.balance } }))
        } catch {
          // Ignore browsers/environments where CustomEvent dispatch fails.
        }
      }
      reset()
    } catch (saveError) {
      setError(saveError.message || 'Could not save expense.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="expenses" />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Add New Expense</h1>
            <p className="header-date">Expenses / New</p>
          </div>
        </header>

        <div className="dashboard-content add-expense-layout">
          <div className="main-column">
            <section className="recent-expenses-section">
              <div className="section-heading section-heading-wrap">
                <div>
                  <h2>Expense Details</h2>
                  <p>Record spending and attach a receipt for later review.</p>
                </div>
              </div>

              <form className="expense-form" onSubmit={submit}>
                <div className="field-group">
                  <label htmlFor="title">Expense Title</label>
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="Lunch at canteen"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="expenseDate">Expense Date</label>
                  <input
                    id="expenseDate"
                    name="expenseDate"
                    type="date"
                    value={form.expenseDate}
                    onChange={onChange}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="amount">Amount (PHP)</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={onChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="currency">Currency</label>
                  <select id="currency" name="currency" value={form.currency} onChange={onChange}>
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={form.category} onChange={onChange}>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor="notes">Description</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    placeholder="Enter expense description or notes..."
                  />
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor="receiptFile">Receipt / Proof of Payment</label>
                  <label className="receipt-dropzone" htmlFor="receiptFile">
                    <input id="receiptFile" type="file" onChange={onReceiptChange} />
                    <span className="receipt-dropzone-title">Drag or click to browse</span>
                    <span className="field-help">JPG, PNG, PDF up to 2MB</span>
                  </label>
                  {form.receiptFile && (
                    <p className="receipt-meta">Selected file: {form.receiptFile.name}</p>
                  )}
                </div>

                {error && <p className="form-message form-error field-span-2">{error}</p>}
                {success && <p className="form-message form-success field-span-2">{success}</p>}

                <div className="form-actions field-span-2">
                  <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Expense'}
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => navigate('/dashboard')}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="sidebar-column">
            <section className="stats-card">
              <div className="section-heading">
                <h2>Tips</h2>
              </div>
              <ul className="tips-list">
                <li>Amount should reflect the exact cost in PHP.</li>
                <li>Always attach a receipt for expenses over ₱100.</li>
                <li>Use the Other category if nothing matches.</li>
                <li>Receipts are stored with the expense history.</li>
              </ul>
            </section>

            <section className="stats-card">
              <div className="section-heading">
                <h2>Quick Categories</h2>
              </div>
              <div className="quick-tags">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`quick-tag ${form.category === category ? 'active' : ''}`}
                    onClick={() => selectCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default AddExpense