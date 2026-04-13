import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import CookieBanner from './CookieBanner'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default marker icons (broken with Vite bundling)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const startIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#F5B700;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #F5B700,0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const endIcon = L.divIcon({
  className: '',
  html: `<div style="width:13px;height:13px;background:#0C2340;border-radius:2px;border:3px solid #fff;box-shadow:0 0 0 2px #0C2340,0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [13, 13],
  iconAnchor: [6.5, 6.5],
})

// Fits the map to show the whole route
// Stable string dep so fitBounds only fires when coords actually change
function FitBounds({ start, end }) {
  const map = useMap()
  const boundsKey = `${start[0]},${start[1]},${end[0]},${end[1]}`
  useEffect(() => {
    map.fitBounds([start, end], { padding: [40, 40], animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey])
  return null
}

/* ── Constants ─────────────────────────────────────────── */
const CARS = {
  bensin: { cons: 8.5,  price: 18.50, consUnit: 'l/100km',   priceUnit: 'kr/liter', fuelLabel: 'Bränsle (bensin)' },
  diesel: { cons: 7.5,  price: 17.80, consUnit: 'l/100km',   priceUnit: 'kr/liter', fuelLabel: 'Bränsle (diesel)' },
  elbil:  { cons: 20.0, price: 2.50,  consUnit: 'kWh/100km', priceUnit: 'kr/kWh',   fuelLabel: 'El (kWh)'         },
  hybrid: { cons: 5.0,  price: 18.50, consUnit: 'l/100km',   priceUnit: 'kr/liter', fuelLabel: 'Bränsle (hybrid)' },
}

const CAR_OPTIONS = [
  { type: 'bensin', emoji: '⛽', label: 'Bensin' },
  { type: 'diesel', emoji: '🛢️', label: 'Diesel' },
  { type: 'elbil',  emoji: '⚡', label: 'Elbil', ev: true },
  { type: 'hybrid', emoji: '🔋', label: 'Hybrid' },
]

/* ── Helpers ───────────────────────────────────────────── */
const fmtSEK  = n => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n) + '\u00a0kr'
const fmtInt  = n => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(n))
const fmtDec  = (n, d = 1) => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

function fmtTime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} tim`
  return `${h} tim ${m} min`
}

async function geocodeQuery(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'sv', 'User-Agent': 'Räknabilresa.se/1.0' } })
  const data = await res.json()
  if (!data?.length) return null
  return { lat: +data[0].lat, lon: +data[0].lon }
}

/* ── AutocompleteInput ─────────────────────────────────── */
function AutocompleteInput({ id, label, placeholder, value, onChange, onSelect, pinType }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const [hiIdx, setHiIdx]             = useState(-1)
  const timerRef = useRef(null)
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
    if (val.trim().length < 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'sv', 'User-Agent': 'Räknabilresa.se/1.0' } })
        const data = await res.json()
        setSuggestions(data ?? [])
        setHiIdx(-1)
        setOpen((data?.length ?? 0) > 0)
      } catch {
        setOpen(false)
      }
    }, 280)
  }, [onChange])

  const pickItem = useCallback(item => {
    const name = item.display_name.split(',').slice(0, 2).join(',').trim()
    onChange(name)
    onSelect({ lat: +item.lat, lon: +item.lon })
    setSuggestions([])
    setOpen(false)
  }, [onChange, onSelect])

  const handleKeyDown = useCallback(e => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHiIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setHiIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && hiIdx >= 0) { e.preventDefault(); pickItem(suggestions[hiIdx]) }
    else if (e.key === 'Escape') setOpen(false)
  }, [open, suggestions, hiIdx, pickItem])

  const handleClear = () => {
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
          />
          {value && (
            <button className="input-clear" onClick={handleClear} tabIndex={-1} aria-label="Rensa">
              ✕
            </button>
          )}
        </div>

        {open && suggestions.length > 0 && (
          <div className="ac-list">
            {suggestions.map((item, i) => {
              const parts = item.display_name.split(',')
              const name  = parts[0].trim()
              const sub   = parts.slice(1, 3).join(',').trim()
              return (
                <div
                  key={item.place_id}
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

/* ── CarTypeSelector ───────────────────────────────────── */
function CarTypeSelector({ selected, onChange }) {
  return (
    <div className="car-grid">
      {CAR_OPTIONS.map(({ type, emoji, label, ev }) => (
        <button
          key={type}
          className={`car-btn${selected === type ? ' active' : ''}${ev ? ' ev' : ''}`}
          onClick={() => onChange(type)}
        >
          <span className="car-emoji">{emoji}</span>
          <span className="car-name">{label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── PersonsStepper ────────────────────────────────────── */
function PersonsStepper({ value, onChange }) {
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Minska">−</button>
      <div className="stepper-divider" />
      <span className="stepper-val">{value}</span>
      <div className="stepper-divider" />
      <button className="stepper-btn" onClick={() => onChange(Math.min(8, value + 1))} aria-label="Öka">+</button>
    </div>
  )
}

/* ── RoundTripToggle ───────────────────────────────────── */
function RoundTripToggle({ value, onChange }) {
  return (
    <div className={`toggle-row${value ? ' on' : ''}`} onClick={() => onChange(!value)} role="switch" aria-checked={value}>
      <div className="toggle-left">
        <div className="toggle-icon-box">🔄</div>
        <div>
          <div className="toggle-title">Tur &amp; retur</div>
          <div className="toggle-desc">Dubblar distans och kostnad</div>
        </div>
      </div>
      <div className="toggle-pill" />
    </div>
  )
}

/* ── RouteMap ──────────────────────────────────────────── */
function RouteMap({ startCoords, endCoords, geometry }) {
  const startPos = useMemo(
    () => [startCoords.lat, startCoords.lon],
    [startCoords.lat, startCoords.lon]
  )
  const endPos = useMemo(
    () => [endCoords.lat, endCoords.lon],
    [endCoords.lat, endCoords.lon]
  )
  const routePositions = useMemo(
    () => geometry?.coordinates.map(([lon, lat]) => [lat, lon]) ?? null,
    [geometry]
  )

  const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${startCoords.lat},${startCoords.lon}&destination=${endCoords.lat},${endCoords.lon}&travelmode=driving`
  const appleUrl  = `https://maps.apple.com/?saddr=${startCoords.lat},${startCoords.lon}&daddr=${endCoords.lat},${endCoords.lon}&dirflg=d`

  return (
    <div className="map-card">
      <MapContainer
        center={startPos}
        zoom={8}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#0C2340', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
          />
        )}
        <Marker position={startPos} icon={startIcon} />
        <Marker position={endPos}   icon={endIcon}   />
        <FitBounds start={startPos} end={endPos} />
      </MapContainer>

      <div className="map-nav-btns">
        <a className="map-nav-btn map-nav-google" href={googleUrl} target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
          Google Maps
        </a>
        <a className="map-nav-btn map-nav-apple" href={appleUrl} target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
          Apple Maps
        </a>
      </div>
    </div>
  )
}

/* ── Results ───────────────────────────────────────────── */
function Results({ data, animKey }) {
  if (!data) return null
  const { totalCost, distKm, durSec, startName, endName, isRoundTrip, carType, fuelUsed, fuelPrice, persons } = data
  const isEV      = carType === 'elbil'
  const perPerson = totalCost / persons
  const usageStr  = isEV
    ? `${fmtDec(fuelUsed)} kWh × ${fmtDec(fuelPrice)} kr/kWh`
    : `${fmtDec(fuelUsed)} l × ${fmtDec(fuelPrice)} kr/l`

  return (
    <div className="card results" key={animKey}>
      <div className="res-header">
        <div className="res-title">Resultat</div>
        <div className="res-tag">{isRoundTrip ? 'Tur & retur' : 'Enkel resa'}</div>
      </div>

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
          <span className="bd-key">{isEV ? 'Energiåtgång' : 'Bränsleåtgång'}</span>
          <span className="bd-val">{usageStr}</span>
        </div>
      </div>
    </div>
  )
}

/* ── App ───────────────────────────────────────────────── */
/* ── FAQ data ──────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'Hur mycket kostar det att köra bil i Sverige?',
    a: 'Det beror på biltyp och bränslepris. En genomsnittlig bensinbil kostar ungefär 14–17 kr per mil, diesel är något billigare och elbil kostar typiskt 4–6 kr per mil. Ange din start och destination i kalkylatorn så får du ett exakt svar baserat på din bil.',
  },
  {
    q: 'Hur beräknar jag bränslekostnaden för min resa?',
    a: 'Ange startort, destination och ditt aktuella bränslepris — kalkylatorn hämtar den verkliga vägdistansen och räknar ut vad resan kostar. Du kan också justera förbrukningen om du vet hur mycket just din bil drar.',
  },
  {
    q: 'Hur mycket kostar det att köra Stockholm–Göteborg?',
    a: 'Sträckan är ca 470 km via E4. Med en vanlig bensinbil (8,5 l/100 km, bensin 18,50 kr/l) landar bränslekostnaden på ungefär 740 kr enkel resa. Kör du elbil med 20 kWh/100 km och 2,50 kr/kWh kostar samma resa ca 235 kr.',
  },
  {
    q: 'Är det billigare att köra elbil eller bensinbil på en lång resa?',
    a: 'Elbil är oftast betydligt billigare — skillnaden kan vara 3–4 gånger lägre kostnad per mil. På en längre resa som Stockholm–Malmö (ca 620 km) sparar du typiskt 600–800 kr med elbil jämfört med bensin, beroende på elpriset.',
  },
  {
    q: 'Hur delar man resekostnaden om man åker flera personer?',
    a: 'Ange antalet personer i kalkylatorn så visas kostnaden per person automatiskt. Är ni fyra som delar på en Stockholm–Göteborg-resa betalar var och en ungefär 185 kr istället för 740 kr.',
  },
  {
    q: 'Kan jag räkna på tur och retur direkt?',
    a: 'Ja — slå på "Tur & retur" i kalkylatorn så dubblas distansen och totalkostnaden direkt. Smidigt för dagsutflykter, pendling eller om du ska hämta någon.',
  },
]

/* ── FAQ component ─────────────────────────────────────── */
function FAQ() {
  const [openIdx, setOpenIdx] = useState(null)
  const toggle = i => setOpenIdx(prev => (prev === i ? null : i))

  return (
    <section className="seo-section" aria-label="Vanliga frågor">
      <div className="card faq-card">
        <h2 className="faq-card-title">Vanliga frågor</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIdx === i
            const isLast = i === FAQ_ITEMS.length - 1
            return (
              <div key={i} className={`faq-item${isOpen ? ' open' : ''}${isLast ? ' last' : ''}`}>
                <button className="faq-q" onClick={() => toggle(i)} aria-expanded={isOpen}>
                  <span className="faq-q-text">{item.q}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                <div className="faq-body" aria-hidden={!isOpen}>
                  <p className="faq-a">{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── App ───────────────────────────────────────────────── */
export default function App() {
  // Form state
  const [carType,    setCarTypeState] = useState('bensin')
  const [fuelPrice,  setFuelPrice]    = useState(CARS.bensin.price)
  const [cons,       setCons]         = useState(CARS.bensin.cons)
  const [persons,    setPersons]      = useState(1)
  const [roundTrip,  setRoundTrip]    = useState(false)

  // Route state
  const [startVal,    setStartVal]    = useState('')
  const [startCoords, setStartCoords] = useState(null)
  const [endVal,      setEndVal]      = useState('')
  const [endCoords,   setEndCoords]   = useState(null)

  // UI state
  const [routePreview, setRoutePreview] = useState(null) // { geometry, distM, durSec }
  const [loading,       setLoading]       = useState(false)
  const [error,     setError]     = useState(null)
  const [results,   setResults]   = useState(null)
  const [animKey,   setAnimKey]   = useState(0)

  const resultsRef = useRef(null)

  const handleCarType = useCallback(type => {
    setCarTypeState(type)
    setFuelPrice(CARS[type].price)
    setCons(CARS[type].cons)
  }, [])

  const handleStartChange = useCallback(val => { setStartVal(val); setStartCoords(null); setRoutePreview(null) }, [])
  const handleEndChange   = useCallback(val => { setEndVal(val);   setEndCoords(null);   setRoutePreview(null) }, [])
  const handleStartSelect = useCallback(coords => { setStartCoords(coords); setRoutePreview(null) }, [])
  const handleEndSelect   = useCallback(coords => { setEndCoords(coords);   setRoutePreview(null) }, [])

  // Fetch route geometry + stats as soon as both coords are selected
  useEffect(() => {
    if (!startCoords || !endCoords) return
    let cancelled = false
    ;(async () => {
      try {
        const res  = await fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=full&geometries=geojson`)
        const data = await res.json()
        if (!cancelled && data.code === 'Ok' && data.routes?.length) {
          const r = data.routes[0]
          setRoutePreview({ geometry: r.geometry, distM: r.distance, durSec: r.duration })
        }
      } catch { /* silent */ }
    })()
    return () => { cancelled = true }
  }, [startCoords, endCoords])

  const calculate = async () => {
    setError(null)
    if (!startVal.trim())             { setError('Ange en startort.');           return }
    if (!endVal.trim())               { setError('Ange en destination.');         return }
    if (!fuelPrice || fuelPrice <= 0) { setError('Ange ett giltigt bränslepris.'); return }
    if (!cons || cons <= 0)           { setError('Ange en giltig förbrukning.'); return }

    setLoading(true)
    try {
      const sc = startCoords ?? await geocodeQuery(startVal)
      if (!sc) throw new Error(`Hittade inte "${startVal}". Pröva ett mer specifikt namn.`)
      setStartCoords(sc)

      const ec = endCoords ?? await geocodeQuery(endVal)
      if (!ec) throw new Error(`Hittade inte "${endVal}". Pröva ett mer specifikt namn.`)
      setEndCoords(ec)

      // Use cached preview; fall back to a fresh fetch if coords were just geocoded
      let preview = routePreview
      if (!preview) {
        const res  = await fetch(`https://router.project-osrm.org/route/v1/driving/${sc.lon},${sc.lat};${ec.lon},${ec.lat}?overview=full&geometries=geojson`)
        const data = await res.json()
        if (data.code !== 'Ok' || !data.routes?.length) {
          throw new Error('Kunde inte beräkna rutten. Kontrollera orterna och försök igen.')
        }
        const r = data.routes[0]
        preview = { geometry: r.geometry, distM: r.distance, durSec: r.duration }
        setRoutePreview(preview)
      }

      let { distM, durSec } = preview
      if (roundTrip) { distM *= 2; durSec *= 2 }

      const distKm    = distM / 1000
      const fuelUsed  = (distKm * cons) / 100
      const totalCost = fuelUsed * fuelPrice

      setResults({
        totalCost, distKm, durSec,
        startName: startVal.split(',')[0].trim(),
        endName:   endVal.split(',')[0].trim(),
        carType, fuelUsed, fuelPrice, persons,
        isRoundTrip: roundTrip,
        startCoords: sc,
        endCoords:   ec,
      })
      setAnimKey(k => k + 1)

      // Scroll to results on mobile
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)

    } catch (err) {
      setError(err.message || 'Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const car = CARS[carType]

  return (
    <>
      <header>
        <a className="logo" href="/">
          <img className="logo-img" src="/Rakna_bilresan_logo.jpg" alt="Räknabilresa.se logotyp" width="34" height="34" />
          <span className="logo-name">Räknabilresa<span>.se</span></span>
        </a>
        <span className="header-tag">Resekostnadsberäknare</span>
      </header>

      <main>
        <div className="hero">
          <div className="hero-eyebrow">Bilresa</div>
          <h1>Vad kostar<br /><em>resan egentligen?</em></h1>
          <p>Ange start och destination i Sverige eller Europa — vi hämtar distans, beräknar bränslekostnad och uppskattar restiden.</p>
        </div>

        {/* ── Form card ── */}
        <div className="card">

          <div className="section-label">Rutt</div>
          <div className="route-wrap">
            <div className="route-spine" />
            <AutocompleteInput
              id="inp-start"
              label="Startort"
              placeholder="T.ex. Stockholm, Berlin…"
              value={startVal}
              onChange={handleStartChange}
              onSelect={handleStartSelect}
              pinType="start"
            />
            <div className="route-gap" />
            <AutocompleteInput
              id="inp-end"
              label="Destination"
              placeholder="T.ex. Göteborg, Paris…"
              value={endVal}
              onChange={handleEndChange}
              onSelect={handleEndSelect}
              pinType="end"
            />
          </div>

          {startCoords && endCoords && (
            <div className="inline-map-wrap">
              <RouteMap
                startCoords={startCoords}
                endCoords={endCoords}
                geometry={routePreview?.geometry}
              />
            </div>
          )}

          <div className="section-divider" />

          <div className="section-label">Biltyp</div>
          <CarTypeSelector selected={carType} onChange={handleCarType} />

          <div className="section-divider" />

          <div className="section-label">Parametrar</div>
          <div className="two-col">
            <div className="field-stack">
              <label htmlFor="inp-fuel">
                Bränslepris
                <span className="field-unit-badge">{car.priceUnit}</span>
              </label>
              <input
                className="num-input"
                id="inp-fuel"
                type="number"
                step="0.01"
                min="0"
                value={fuelPrice}
                onChange={e => setFuelPrice(parseFloat(e.target.value) || '')}
              />
            </div>

            <div className="field-stack">
              <label htmlFor="inp-cons">
                Förbrukning
                <span className="field-unit-badge">{car.consUnit}</span>
              </label>
              <input
                className="num-input"
                id="inp-cons"
                type="number"
                step="0.1"
                min="0"
                value={cons}
                onChange={e => setCons(parseFloat(e.target.value) || '')}
              />
            </div>

            <div className="field-stack">
              <label>Antal personer</label>
              <PersonsStepper value={persons} onChange={setPersons} />
            </div>
          </div>

          <RoundTripToggle value={roundTrip} onChange={setRoundTrip} />

          {error && (
            <div className="error-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button className="calc-btn" onClick={calculate} disabled={loading}>
            {loading ? (
              <>
                <div className="spin" />
                <span>Hämtar rutt…</span>
              </>
            ) : (
              <>
                <span>Beräkna resa</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* ── Results card ── */}
        <div ref={resultsRef}>
          <Results data={results} animKey={animKey} />
        </div>

        {/* ── FAQ ── */}
        <FAQ />
      </main>

      <CookieBanner />

      <footer>
        <div className="footer-about">
          <div className="footer-logo-row">
            <a className="footer-brand" href="https://produktionen.se" target="_blank" rel="noopener noreferrer">Produktionen AB</a>
          </div>
          <p className="footer-desc">
            Vi är webbutvecklare som älskar att bygga smarta, enkla verktyg — stora som små.
            Räknabilresa.se är ett av dem, helt kostnadsfritt att använda.
            Hoppas det underlättar din nästa resa!
          </p>
          <p className="footer-cta">
            Gillar du vad vi gör?{' '}
            <a href="mailto:hej@produktionen.se">Hör av dig</a> — vi hjälper gärna med ditt nästa projekt.
          </p>
          <div className="footer-related">
            <span className="footer-related-label">Liknande verktyg</span>
            <a className="footer-related-link" href="https://raknabil.se" target="_blank" rel="noopener noreferrer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              räknabil.se — Beräkna kostnaden för att köpa en bil
            </a>
          </div>
        </div>
        <div className="footer-meta">
          Använder <strong>OSRM</strong> för ruttberäkning och <strong>Nominatim</strong> för geokodning.
          Restider och förbrukningsvärden är estimerade.
        </div>
      </footer>
    </>
  )
}
