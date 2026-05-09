import cors from 'cors'
import express from 'express'
import { initializeDb } from './lib/database.js'
import { registerAuthRoutes } from './features/auth/auth.routes.js'
import { registerExpenseRoutes } from './features/expenses/expenses.routes.js'
import { registerMetaRoutes } from './features/meta/meta.routes.js'
import { registerWalletRoutes } from './features/wallet/wallet.routes.js'

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

registerMetaRoutes(app)
registerAuthRoutes(app)
registerExpenseRoutes(app)
registerWalletRoutes(app)

initializeDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PocketBooks API running on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
