import { useMemo, useEffect } from 'react'
import { MapContainer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'


// Fix Leaflet default marker icons (broken with Vite bundling)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// OpenFreeMap Positron vector basemap – free, no API key
function BaseMap() {
  const map = useMap()
  useEffect(() => {
    let layer, cancelled = false
    // Loaded on demand so MapLibre stays out of the initial bundle
    Promise.all([
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]).then(([{ maplibreGL }, { setWorkerUrl }, { default: workerUrl }]) => {
      if (cancelled) return
      // Vite bundles MapLibre, so point it at the separately built worker
      setWorkerUrl(workerUrl)
      layer = maplibreGL({ style: 'https://tiles.openfreemap.org/styles/positron' }).addTo(map)
      // Show Swedish place names (falls back to the local name)
      const ml = layer.getMaplibreMap()
      ml.once('load', () => {
        for (const l of ml.getStyle().layers) {
          const field = l.layout?.['text-field']
          if (field && JSON.stringify(field).includes('"name')) {
            ml.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:sv'], ['get', 'name']])
          }
        }
      })
    })
    return () => {
      cancelled = true
      if (layer) map.removeLayer(layer)
    }
  }, [map])
  return null
}

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

/* ── RouteMap ──────────────────────────────────────────── */
export default function RouteMap({ startCoords, endCoords, geometry, status }) {
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
        <BaseMap />
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
      {status === 'loading' && <div className="map-status" role="status">Hämtar rutt…</div>}
      {status === 'error' && <div className="map-status map-status-err" role="status">Kunde inte visa rutten just nu. Du kan ändå beräkna kostnaden.</div>}
      <div className="map-attribution">
        <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
      </div>

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
