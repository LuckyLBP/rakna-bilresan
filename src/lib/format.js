export const fmtSEK  = n => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n) + '\u00a0kr'
export const fmtInt  = n => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(n))
export const parseNum = str => parseFloat(String(str).replace(',', '.'))
export const fmtDec  = (n, d = 1) => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

export function fmtTime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} tim`
  return `${h} tim ${m} min`
}
