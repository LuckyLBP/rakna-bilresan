export default function Footer() {
  return (
    <footer>
      <div className="footer-strip">
        <a className="pohlare-badge" href="https://pohlare.com" target="_blank" rel="noopener noreferrer" aria-label="Skapad av din Pohlare – pohlare.com">
          <img className="pohlare-badge-avatar" src="/pohlare-avatar.webp" alt="" width="40" height="40" />
          <span className="pohlare-badge-text">
            <span className="pohlare-badge-label">Skapad av</span>
            <span className="pohlare-badge-name">din Pohlare</span>
          </span>
        </a>
        <p className="footer-blurb">
          Ett gratis verktyg, byggt med omsorg.
          <a href="mailto:lucas@pohlare.com">Hör av dig →</a>
        </p>
      </div>
      <div className="footer-meta">
        <a className="footer-related-link" href="https://raknabil.se" target="_blank" rel="noopener noreferrer">
          Fler verktyg: räknabil.se
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <div>
          Rutter: <strong>OSRM</strong> · Karta: <strong>OpenFreeMap</strong> · Sök: <strong>Photon</strong>.
          Restider och förbrukning är uppskattningar.
        </div>
      </div>
    </footer>
  )
}
