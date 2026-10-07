// Photon (komoot) – OSM geocoder built for search-as-you-type, no API key.
// lang=default gives local names (Göteborg, not Gothenburg) whatever the browser language.
// Results are mapped to { place_id, display_name, lat, lon }.
export async function searchPlaces(q, limit, signal) {
  // lat/lon bias results towards Sweden without excluding the rest of Europe
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lang=default&lat=59.3&lon=18.0`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const data = await res.json()
  return (data.features ?? []).map(f => {
    const p = f.properties
    const parts = [p.name ?? [p.street, p.housenumber].filter(Boolean).join(' '), p.city, p.county, p.country]
    return {
      place_id:     `${p.osm_type}${p.osm_id}`,
      display_name: parts.filter((x, i) => x && parts.indexOf(x) === i).join(', '),
      lat:          f.geometry.coordinates[1],
      lon:          f.geometry.coordinates[0],
    }
  }).filter((r, i, all) => all.findIndex(o => o.display_name === r.display_name) === i)
}

export async function geocodeQuery(q) {
  const [hit] = await searchPlaces(q, 1)
  return hit ? { lat: +hit.lat, lon: +hit.lon } : null
}

// OSRM public demo server: real driving distance, time and geometry
export async function fetchRoute(from, to, signal) {
  const res  = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`, { signal })
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) return null
  const r = data.routes[0]
  return { geometry: r.geometry, distM: r.distance, durSec: r.duration }
}
