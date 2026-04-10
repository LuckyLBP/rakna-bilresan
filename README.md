# Räknabilresa.se

Gratis kalkylator för att beräkna kostnaden för en bilresa i Sverige. Stöd för bensin, diesel, elbil och hybrid.

**Live:** [rakna-bilresan.vercel.app](https://rakna-bilresan.vercel.app)

## Stack

- React 18 + Vite
- react-leaflet v4 (Leaflet.js) — interaktiv karta med ruttvisning
- Nominatim API — geokodning av svenska adresser
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
  App.jsx       — huvudkomponent (kalkylator, karta, FAQ)
  index.css     — globala stilar
  main.jsx      — entry point
public/
  robots.txt
  sitemap.xml
  Rakna_bilresan_logo.jpg
index.html      — SEO-metadata, JSON-LD, Open Graph
```
