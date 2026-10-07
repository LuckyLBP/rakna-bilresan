/* ── Cars ──────────────────────────────────────────────── */
export const CARS = {
  bensin: { cons: 8.5,  price: 18.50, consUnit: 'l/100km',   priceUnit: 'kr/liter', fuelLabel: 'Bränsle (bensin)' },
  diesel: { cons: 7.5,  price: 17.80, consUnit: 'l/100km',   priceUnit: 'kr/liter', fuelLabel: 'Bränsle (diesel)' },
  elbil:  { cons: 20.0, price: 2.50,  consUnit: 'kWh/100km', priceUnit: 'kr/kWh',   fuelLabel: 'El (kWh)'         },
  hybrid: { cons: 5.0,  price: 18.50, consUnit: 'l/100km',   priceUnit: 'kr/liter', fuelLabel: 'Bränsle (hybrid)' },
}

export const CAR_OPTIONS = [
  { type: 'bensin', emoji: '⛽', label: 'Bensin' },
  { type: 'diesel', emoji: '🛢️', label: 'Diesel' },
  { type: 'elbil',  emoji: '⚡', label: 'Elbil', ev: true },
  { type: 'hybrid', emoji: '🔋', label: 'Hybrid' },
]
