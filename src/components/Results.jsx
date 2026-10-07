import { useState } from 'react'
import { CARS } from '../lib/cars'
import { fmtSEK, fmtInt, fmtDec, fmtTime } from '../lib/format'

/* ── Results ───────────────────────────────────────────── */
export default function Results({ data, animKey, stale }) {
  const [copied, setCopied] = useState(false)
  if (!data) return null
  const { totalCost, distKm, durSec, startName, endName, isRoundTrip, carType, fuelUsed, fuelPrice, persons } = data
  const isEV      = carType === 'elbil'
  const perPerson = totalCost / persons
  const perMil    = totalCost / (distKm / 10)
  const summary   = `${startName} → ${endName}: ${fmtDec(distKm, 0)} km, ca ${fmtSEK(totalCost)} i ${isEV ? 'el' : 'bränsle'}${persons > 1 ? ` (${fmtSEK(perPerson)} per person)` : ''}. Räkna din egen resa: https://raknabilresa.se`
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Resekostnad', text: summary }); return }
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* user cancelled share */ }
  }
  const usageStr  = isEV
    ? `${fmtDec(fuelUsed)} kWh × ${fmtDec(fuelPrice)} kr/kWh`
    : `${fmtDec(fuelUsed)} l × ${fmtDec(fuelPrice)} kr/l`

  return (
    <div className="card results" key={animKey} aria-live="polite">
      <div className="res-header">
        <div className="res-title">Resultat</div>
        <div className="res-tag">{isRoundTrip ? 'Tur & retur' : 'Enkel resa'}</div>
      </div>

      {stale && <div className="res-stale">Rutten har ändrats. Tryck på &quot;Beräkna resa&quot; för att uppdatera.</div>}

      <div className="res-total">
        <div className="res-total-label">Total kostnad</div>
        <div className="res-total-amount">
          {fmtInt(totalCost)}<span className="res-total-unit">kr</span>
        </div>
        <div className="res-total-route">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 16 14" />
          </svg>
          {startName} → {endName}
        </div>
      </div>

      <div className="res-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-label">Distans</div>
          <div className="stat-value">{fmtInt(distKm)}<span className="stat-unit">km</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱</div>
          <div className="stat-label">Restid (est.)</div>
          <div className="stat-time">{fmtTime(durSec)}</div>
        </div>
      </div>

      <div className="breakdown">
        <div className="breakdown-head">Kostnadsfördelning</div>
        <div className="bd-row">
          <span className="bd-key">{CARS[carType].fuelLabel}</span>
          <span className="bd-val">{fmtSEK(totalCost)}</span>
        </div>
        {persons > 1 && (
          <div className="bd-row">
            <span className="bd-key">Per person</span>
            <span className="bd-val">{fmtSEK(perPerson)}</span>
          </div>
        )}
        <div className="bd-row">
          <span className="bd-key">Kostnad per mil</span>
          <span className="bd-val">{fmtDec(perMil)}&nbsp;kr/mil</span>
        </div>
        <div className="bd-row">
          <span className="bd-key">{isEV ? 'Energiåtgång' : 'Bränsleåtgång'}</span>
          <span className="bd-val">{usageStr}</span>
        </div>
      </div>

      <button type="button" className="res-share" onClick={share}>
        {copied ? 'Kopierat ✓' : 'Dela / kopiera resultat'}
      </button>
    </div>
  )
}
