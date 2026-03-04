import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const initialLogin = {
  email: '',
  password: '',
}

const initialRegister = {
  name: '',
  email: '',
  password: '',
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'

  const [formData, setFormData] = useState(isRegister ? initialRegister : initialLogin)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (isRegister && !formData.name.trim()) {
      return 'Name is required.'
    }
    if (!formData.email.trim()) {
      return 'Email is required.'
    }
    if (!formData.password.trim()) {
      return 'Password is required.'
    }
    return ''
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    try {
      setIsSubmitting(true)
      const endpoint = isRegister ? '/api/register' : '/api/login'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Request failed. Please try again.')
        return
      }

      if (isRegister) {
        setSuccess('Account created successfully. You can now sign in.')
        setFormData(initialRegister)
        return
      }

      localStorage.setItem('authUser', JSON.stringify(data.user))
      localStorage.setItem('authToken', data.token)
      navigate('/dashboard')
    } catch {
      setError('Could not connect to the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="promo-panel">
        <div className="brand">💰 PocketBooks</div>

        <h1>Track Every Peso, Stress-Free.</h1>
        <p className="promo-description">
          The smart expense tracker built for Filipino students. Log expenses,
          upload receipts, and see your balance in any currency — all in one place.
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div>
              <h3>Expense Tracking</h3>
              <span>Available on Web &amp; Android</span>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🧾</div>
            <div>
              <h3>Receipt Upload</h3>
              <span>Available on Web &amp; Android</span>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">💱</div>
            <div>
              <h3>Currency Conversion</h3>
              <span>Available on Web &amp; Android</span>
            </div>
          </div>
        </div>

        <div className="decor decor-left" />
        <div className="decor decor-right" />
      </aside>

      <main className="form-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-tabs">
            <Link to="/login" className={`tab ${!isRegister ? 'tab-active' : ''}`}>
              Sign In
            </Link>
            <Link to="/register" className={`tab ${isRegister ? 'tab-active' : ''}`}>
              Sign Up
            </Link>
          </div>

          <h2>{isRegister ? 'Create your account ✨' : 'Welcome back! 👋'}</h2>
          <p className="subtext">
            {isRegister
              ? 'Sign up to start managing your PocketBooks account.'
              : 'Sign in to your PocketBooks account.'}
          </p>

          {!isRegister && (
            <button type="button" className="google-btn">
              <span className="google-dot" /> Continue with Google
            </button>
          )}

          <div className="separator">
            <span>{isRegister ? 'Create with email' : 'Email Address'}</span>
            <span>{isRegister ? 'required fields' : 'or sign in with email'}</span>
          </div>

          {isRegister && (
            <>
              <label className="field-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={onChange}
              />
            </>
          )}

          <label className="field-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="student@example.com"
            value={formData.email}
            onChange={onChange}
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={onChange}
          />

          {!isRegister && (
            <a href="#" className="forgot-link">
              Forgot password?
            </a>
          )}

          {error && <p className="form-message form-error">{error}</p>}
          {success && <p className="form-message form-success">{success}</p>}

          <button type="submit" className="signin-btn" disabled={isSubmitting}>
            {isSubmitting
              ? 'Please wait...'
              : isRegister
                ? 'Create PocketBooks Account'
                : 'Sign In to PocketBooks'}
          </button>

          <p className="signup-line">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in instead' : "Create one — it's free!"}
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}

export default AuthPage
