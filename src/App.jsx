import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import CookieBanner from './CookieBanner'
import AutocompleteInput from './components/AutocompleteInput'
import { NumInput, CarTypeSelector, PersonsStepper, RoundTripToggle } from './components/Controls'
import RouteMap from './components/RouteMap'
import Results from './components/Results'
import FAQ from './components/Faq'
import Footer from './components/Footer'
import { CARS } from './lib/cars'
import { geocodeQuery, fetchRoute } from './lib/places'

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
  const [routeStatus,  setRouteStatus]  = useState('idle') // idle | loading | error
  const [stale,        setStale]        = useState(false)  // results no longer match the chosen route
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

  const handleStartChange = useCallback(val => { setStartVal(val); setStartCoords(null); setRoutePreview(null); setStale(true) }, [])
  const handleEndChange   = useCallback(val => { setEndVal(val);   setEndCoords(null);   setRoutePreview(null); setStale(true) }, [])
  const handleStartSelect = useCallback(coords => { setStartCoords(coords); setRoutePreview(null); setStale(true) }, [])
  const handleEndSelect   = useCallback(coords => { setEndCoords(coords);   setRoutePreview(null); setStale(true) }, [])

  // Fetch route geometry + stats as soon as both coords are selected
  useEffect(() => {
    if (!startCoords || !endCoords) { setRouteStatus('idle'); return }
    let cancelled = false
    setRouteStatus('loading')
    ;(async () => {
      try {
        const route = await fetchRoute(startCoords, endCoords)
        if (cancelled) return
        if (route) { setRoutePreview(route); setRouteStatus('idle') }
        else setRouteStatus('error')
      } catch { if (!cancelled) setRouteStatus('error') }
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
        preview = await fetchRoute(sc, ec)
        if (!preview) throw new Error('Kunde inte beräkna rutten. Kontrollera orterna och försök igen.')
        setRoutePreview(preview)
      }

      setResults({
        distM: preview.distM, durSec: preview.durSec,
        startName: startVal.split(',')[0].trim(),
        endName:   endVal.split(',')[0].trim(),
        startCoords: sc,
        endCoords:   ec,
      })
      setStale(false)
      setAnimKey(k => k + 1)

      // Scroll to results (offset by the sticky header via scroll-margin in CSS)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)

    } catch (err) {
      setError(err.message || 'Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const car = CARS[carType]

  // Results follow the form live; only a new route needs a recalculation
  const resultData = useMemo(() => {
    if (!results || !(fuelPrice > 0) || !(cons > 0)) return null
    const mult      = roundTrip ? 2 : 1
    const distKm    = (results.distM * mult) / 1000
    const fuelUsed  = (distKm * cons) / 100
    return {
      ...results,
      distKm, fuelUsed, fuelPrice, persons, carType,
      durSec:      results.durSec * mult,
      totalCost:   fuelUsed * fuelPrice,
      isRoundTrip: roundTrip,
    }
  }, [results, carType, fuelPrice, cons, persons, roundTrip])

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
                status={routeStatus}
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
              <NumInput id="inp-fuel" value={fuelPrice} onChange={setFuelPrice} />
            </div>

            <div className="field-stack">
              <label htmlFor="inp-cons">
                Förbrukning
                <span className="field-unit-badge">{car.consUnit}</span>
              </label>
              <NumInput id="inp-cons" value={cons} onChange={setCons} />
            </div>

            <div className="field-stack">
              <label id="lbl-persons">Antal personer</label>
              <PersonsStepper value={persons} onChange={setPersons} />
            </div>
          </div>

          <RoundTripToggle value={roundTrip} onChange={setRoundTrip} />

          {error && (
            <div className="error-box" role="alert">
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
          <Results data={resultData} animKey={animKey} stale={stale} />
        </div>

        {/* ── FAQ ── */}
        <FAQ />
      </main>

      <CookieBanner />

      <Footer />
    </>
  )
}
