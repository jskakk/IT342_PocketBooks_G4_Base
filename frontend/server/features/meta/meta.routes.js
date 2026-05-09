import { DEFAULT_CURRENCY, EXCHANGE_RATES, EXPENSE_CATEGORIES } from '../../lib/constants.js'

export const registerMetaRoutes = (app) => {
  app.get('/api/health', (_, res) => {
    res.json({
      ok: true,
      currencies: EXCHANGE_RATES,
      categories: EXPENSE_CATEGORIES,
    })
  })

  app.get('/api/meta', (_, res) => {
    res.json({
      currencies: EXCHANGE_RATES,
      categories: EXPENSE_CATEGORIES,
      defaultCurrency: DEFAULT_CURRENCY,
    })
  })
}