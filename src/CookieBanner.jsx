import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cookie_consent'

function grantConsent() {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const choice = localStorage.getItem(STORAGE_KEY)
    if (choice === 'granted') {
      grantConsent()
    } else if (!choice) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'granted')
    grantConsent()
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'denied')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-bar" role="dialog" aria-label="Cookie-inställningar">
      <p className="cookie-text">
        Vi använder cookies för att förstå hur sajten används (Google Analytics).
        Ingen data säljs eller delas.
      </p>
      <div className="cookie-actions">
        <button className="cookie-btn cookie-btn-decline" onClick={decline}>
          Neka
        </button>
        <button className="cookie-btn cookie-btn-accept" onClick={accept}>
          Acceptera
        </button>
      </div>
    </div>
  )
}
