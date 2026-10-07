import { useState, useEffect } from 'react'
import { CAR_OPTIONS } from '../lib/cars'
import { parseNum } from '../lib/format'

/* ── NumInput: decimal comma friendly, can be emptied while typing ── */
export function NumInput({ id, value, onChange }) {
  const [text, setText] = useState(String(value).replace('.', ','))
  // Re-sync when the value is changed from outside (e.g. switching car type)
  useEffect(() => {
    if (parseNum(text) !== value) setText(String(value).replace('.', ','))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      className="num-input"
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={e => {
        const t = e.target.value
        if (!/^\d*[.,]?\d*$/.test(t)) return
        setText(t)
        const n = parseNum(t)
        onChange(Number.isFinite(n) ? n : 0)
      }}
    />
  )
}

/* ── CarTypeSelector ───────────────────────────────────── */
export function CarTypeSelector({ selected, onChange }) {
  return (
    <div className="car-grid" role="radiogroup" aria-label="Biltyp">
      {CAR_OPTIONS.map(({ type, emoji, label, ev }) => (
        <button
          key={type}
          type="button"
          role="radio"
          aria-checked={selected === type}
          className={`car-btn${selected === type ? ' active' : ''}${ev ? ' ev' : ''}`}
          onClick={() => onChange(type)}
        >
          <span className="car-emoji" aria-hidden="true">{emoji}</span>
          <span className="car-name">{label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── PersonsStepper ────────────────────────────────────── */
export function PersonsStepper({ value, onChange }) {
  return (
    <div className="stepper" role="group" aria-labelledby="lbl-persons">
      <button type="button" className="stepper-btn" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Minska">−</button>
      <div className="stepper-divider" />
      <span className="stepper-val" aria-live="polite">{value}</span>
      <div className="stepper-divider" />
      <button type="button" className="stepper-btn" onClick={() => onChange(Math.min(8, value + 1))} aria-label="Öka">+</button>
    </div>
  )
}

/* ── RoundTripToggle ───────────────────────────────────── */
export function RoundTripToggle({ value, onChange }) {
  return (
    <button type="button" className={`toggle-row${value ? ' on' : ''}`} onClick={() => onChange(!value)} role="switch" aria-checked={value}>
      <div className="toggle-left">
        <div className="toggle-icon-box" aria-hidden="true">🔄</div>
        <div>
          <div className="toggle-title">Tur &amp; retur</div>
          <div className="toggle-desc">Dubblar distans och kostnad</div>
        </div>
      </div>
      <div className="toggle-pill" aria-hidden="true" />
    </button>
  )
}
