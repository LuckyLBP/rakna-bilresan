import { useState, useCallback, useRef, useEffect } from 'react'
import { searchPlaces } from '../lib/places'

export default function AutocompleteInput({ id, label, placeholder, value, onChange, onSelect, pinType }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const [hiIdx, setHiIdx]             = useState(-1)
  const [busy, setBusy]               = useState(false)
  const [empty, setEmpty]             = useState(false)
  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const wrapRef  = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = useCallback(async e => {
    const val = e.target.value
    onChange(val)
    clearTimeout(timerRef.current)
    abortRef.current?.abort()
    setEmpty(false)
    if (val.trim().length < 2) { setSuggestions([]); setOpen(false); setBusy(false); return }
    setBusy(true)
    timerRef.current = setTimeout(async () => {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const data = await searchPlaces(val, 5, ctrl.signal)
        setSuggestions(data ?? [])
        setHiIdx(-1)
        setEmpty((data?.length ?? 0) === 0)
        setOpen(true)
        setBusy(false)
      } catch (err) {
        // Aborted = a newer request took over; leave its state alone
        if (err.name !== 'AbortError') { setOpen(false); setBusy(false) }
      }
    }, 280)
  }, [onChange])

  const pickItem = useCallback(item => {
    const name = item.display_name.split(',').slice(0, 2).join(',').trim()
    onChange(name)
    onSelect({ lat: +item.lat, lon: +item.lon })
    setSuggestions([])
    setOpen(false)
    setBusy(false)
  }, [onChange, onSelect])

  const handleKeyDown = useCallback(e => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHiIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setHiIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && hiIdx >= 0) { e.preventDefault(); pickItem(suggestions[hiIdx]) }
    else if (e.key === 'Escape') setOpen(false)
  }, [open, suggestions, hiIdx, pickItem])

  const handleClear = () => {
    clearTimeout(timerRef.current)
    abortRef.current?.abort()
    setBusy(false)
    onChange('')
    onSelect(null)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="route-field" ref={wrapRef} style={{ zIndex: open ? 10 : 1 }}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="ac-wrap">
        <div className="field-row">
          <div className="field-pin">
            <div className={pinType === 'start' ? 'pin-dot-start' : 'pin-dot-end'} />
          </div>
          <input
            className="txt-input"
            id={id}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open && hiIdx >= 0 ? `${id}-opt-${hiIdx}` : undefined}
          />
          {busy && <span className="ac-spin" aria-hidden="true" />}
          {value && (
            <button className="input-clear" type="button" onClick={handleClear} aria-label={`Rensa ${label.toLowerCase()}`}>
              ✕
            </button>
          )}
        </div>

        {open && empty && (
          <div className="ac-list"><div className="ac-empty">Inga träffar. Pröva ett annat namn.</div></div>
        )}
        {open && suggestions.length > 0 && (
          <div className="ac-list" id={`${id}-list`} role="listbox" aria-label={label}>
            {suggestions.map((item, i) => {
              const parts = item.display_name.split(',')
              const name  = parts[0].trim()
              const sub   = parts.slice(1, 3).join(',').trim()
              return (
                <div
                  key={item.place_id}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === hiIdx}
                  className={`ac-item${i === hiIdx ? ' hi' : ''}`}
                  onMouseDown={e => { e.preventDefault(); pickItem(item) }}
                >
                  <svg className="ac-pin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <div className="ac-name">{name}</div>
                    {sub && <div className="ac-sub">{sub}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
