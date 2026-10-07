// Single source for the FAQ: used by the React app and injected as
// static HTML + FAQPage JSON-LD at build time (see vite.config.js).
export const FAQ_ITEMS = [
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
