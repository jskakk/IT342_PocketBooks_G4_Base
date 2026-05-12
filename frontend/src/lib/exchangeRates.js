export const EXCHANGE_RATES = {
  PHP: 1,
  USD: 56.12,
  EUR: 61.08,
  JPY: 0.38,
  GBP: 71.52,
}

export const CURRENCIES = Object.keys(EXCHANGE_RATES)

export const convertFromPhp = (phpAmount, currency) => {
  const rate = EXCHANGE_RATES[currency] || EXCHANGE_RATES.PHP
  return Number((Number(phpAmount || 0) / rate).toFixed(2))
}
