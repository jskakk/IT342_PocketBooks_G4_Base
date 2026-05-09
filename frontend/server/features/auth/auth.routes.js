import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { db } from '../../lib/database.js'
import { decodeGoogleToken, normalizeEmail, sanitizeUser } from '../../lib/helpers.js'

export const registerAuthRoutes = (app) => {
  app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: 'Name, email, and password are required.',
      })
    }

    const normalizedEmail = normalizeEmail(email)
    const existingUser = db.data.users.find((user) => user.email === normalizedEmail)

    if (existingUser) {
      return res.status(409).json({
        message: 'This email is already registered.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    db.data.users.push(user)
    await db.write()

    return res.status(201).json({
      message: 'Registration successful.',
      user: sanitizeUser(user),
    })
  })

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: 'Email and password are required.',
      })
    }

    const normalizedEmail = normalizeEmail(email)
    const user = db.data.users.find((item) => item.email === normalizedEmail)

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    return res.status(200).json({
      message: 'Login successful.',
      user: sanitizeUser(user),
      token: `demo-token-${user.id}`,
    })
  })

  app.post('/api/google-login', async (req, res) => {
    const { token } = req.body

    if (!token?.trim()) {
      return res.status(400).json({
        message: 'Google token is required.',
      })
    }

    try {
      const googleUser = decodeGoogleToken(token)

      if (!googleUser || !googleUser.email) {
        return res.status(400).json({
          message: 'Invalid Google token.',
        })
      }

      const normalizedEmail = normalizeEmail(googleUser.email)
      let user = db.data.users.find((item) => item.email === normalizedEmail)

      if (!user) {
        user = {
          id: randomUUID(),
          name: googleUser.name || googleUser.email.split('@')[0],
          email: normalizedEmail,
          googleId: googleUser.sub,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
        }

        db.data.users.push(user)
        await db.write()
      } else if (!user.googleId) {
        user.googleId = googleUser.sub
        user.authProvider = 'google'
        await db.write()
      }

      return res.status(200).json({
        message: 'Google login successful.',
        user: sanitizeUser(user),
        token: `demo-token-${user.id}`,
        provider: 'google',
      })
    } catch (error) {
      console.error('Google login error:', error)
      return res.status(500).json({
        message: 'Failed to process Google login.',
      })
    }
  })
}