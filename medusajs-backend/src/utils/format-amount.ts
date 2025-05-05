export function formatAmount(amount: number, region: any): string {
  if (typeof amount !== 'number') {
    console.warn('Invalid amount:', amount)
    amount = 0
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: region.currency_code || 'USD',
  })
  
  return formatter.format(amount / 100)
}
