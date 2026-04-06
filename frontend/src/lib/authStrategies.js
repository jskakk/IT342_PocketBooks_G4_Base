/**
 * Authentication Strategy Pattern
 * Multiple authentication methods implemented as interchangeable strategies.
 */

export class AuthenticationStrategy {
  async authenticate(credentials) {
    throw new Error('authenticate() must be implemented')
  }

  async validateToken(token) {
    throw new Error('validateToken() must be implemented')
  }
}

export class EmailPasswordStrategy extends AuthenticationStrategy {
  constructor(apiBaseUrl = '/api') {
    super()
    this.apiBaseUrl = apiBaseUrl
  }

  async register(name, email, password) {
    const response = await fetch(`${this.apiBaseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Registration failed')
    }

    return response.json()
  }

  async authenticate(email, password) {
    const response = await fetch(`${this.apiBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Login failed')
    }

    return response.json()
  }

  async validateToken(token) {
    return token && token.startsWith('demo-token-')
  }
}

export class GoogleOAuthStrategy extends AuthenticationStrategy {
  constructor(apiBaseUrl = '/api') {
    super()
    this.apiBaseUrl = apiBaseUrl
  }

  async authenticate(googleToken) {
    const response = await fetch(`${this.apiBaseUrl}/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleToken }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Google authentication failed')
    }

    return response.json()
  }

  async validateToken(token) {
    return token && typeof token === 'string' && token.length > 0
  }
}

export class AuthenticationContext {
  constructor(strategy) {
    this.strategy = strategy
  }

  setStrategy(strategy) {
    this.strategy = strategy
  }

  async authenticate(credentials) {
    if (!this.strategy) {
      throw new Error('No authentication strategy set')
    }
    return this.strategy.authenticate(credentials)
  }

  async validateToken(token) {
    if (!this.strategy) {
      throw new Error('No authentication strategy set')
    }
    return this.strategy.validateToken(token)
  }
}

export class AuthStrategyFactory {
  static createStrategy(type, config = {}) {
    const apiBaseUrl = config.apiBaseUrl || '/api'

    switch (type) {
      case 'email':
        return new EmailPasswordStrategy(apiBaseUrl)
      case 'google':
        return new GoogleOAuthStrategy(apiBaseUrl)
      default:
        throw new Error(`Unknown authentication strategy: ${type}`)
    }
  }

  static createContext(type, config = {}) {
    const strategy = this.createStrategy(type, config)
    return new AuthenticationContext(strategy)
  }
}
