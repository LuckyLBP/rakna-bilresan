# Räknabilresa.se

Gratis kalkylator för att beräkna kostnaden för en bilresa i Sverige. Stöd för bensin, diesel, elbil och hybrid.

**Live:** [raknabilresa.se](https://raknabilresa.se)

## Stack

- React 19 + Vite 7
- react-leaflet v5 + MapLibre GL — interaktiv karta med ruttvisning
- OpenFreeMap — kartunderlag (ingen API-nyckel)
- Photon (komoot) — ortsök och geokodning
- OSRM API — ruttberäkning och distans

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173).

## Bygga för produktion

```bash
npm run build
npm run preview   # förhandsgranskning av bygget
```

Bygget hamnar i `dist/`.

## Deploya

Projektet är konfigurerat för Vercel. Pusha till main-branchen så deployas det automatiskt.

## Struktur

```
src/
  App.jsx       — sidans state och sammansättning
  components/   — AutocompleteInput, Controls, RouteMap, Results, Faq, Footer
  lib/          — format, places (Photon/OSRM), cars
  content/faq.js — FAQ, enda källan (appen + JSON-LD + statisk HTML vid bygget)
  index.css     — globala stilar
  main.jsx      — entry point
public/
  robots.txt
  sitemap.xml
  Rakna_bilresan_logo.jpg
index.html      — SEO-metadata, JSON-LD, Open Graph
vite.config.js  — injicerar FAQ-schema och crawlbar HTML vid bygget
```
