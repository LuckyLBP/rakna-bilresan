import { useState } from 'react'
import { FAQ_ITEMS } from '../content/faq'

/* ── FAQ component ─────────────────────────────────────── */
export default function FAQ() {
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
