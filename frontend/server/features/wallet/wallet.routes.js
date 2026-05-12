import { db } from '../../lib/database.js'
import { getUserFromRequest } from '../../lib/helpers.js'

export const registerWalletRoutes = (app) => {
  app.get('/api/wallet', (req, res) => {
    const user = getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized request.' })
    }

    const userRecord = db.data.users.find((u) => u.id === user.id)
    const balance = userRecord && typeof userRecord.balance === 'number' ? userRecord.balance : 0

    return res.status(200).json({ balance })
  })

  app.post('/api/wallet/topup', async (req, res) => {
    const user = getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized request.' })
    }

    const { amount } = req.body
    const numeric = Number(amount)
    if (!numeric || numeric <= 0) {
      return res.status(400).json({ message: 'Top-up amount must be greater than zero.' })
    }

    const userRecord = db.data.users.find((u) => u.id === user.id)
    if (!userRecord) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (typeof userRecord.balance !== 'number') {
      userRecord.balance = 0
    }
    userRecord.balance = Number((userRecord.balance + numeric).toFixed(2))

    await db.write()

    return res.status(200).json({ balance: userRecord.balance })
  })
}
