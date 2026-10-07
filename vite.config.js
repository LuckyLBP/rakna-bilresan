import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Injects the FAQ as JSON-LD and as static, crawlable HTML inside #root.
// Both come from src/content/faq.js, the same source the React app renders,
// so the markup Google sees can't drift from what visitors see.
// React's createRoot replaces the static HTML when the app mounts.
function seoPrerender() {
  return {
    name: 'seo-prerender',
    async transformIndexHtml(html) {
      const { FAQ_ITEMS } = await import(pathToFileURL(resolve('src/content/faq.js')).href + `?t=${Date.now()}`)

      const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }).replace(/</g, '\\u003c')

      const faqHtml = FAQ_ITEMS.map(({ q, a }) =>
        `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')

      const prerender = `
        <main class="prerender">
          <div class="hero">
            <div class="hero-eyebrow">Bilresa</div>
            <h1>Vad kostar<br /><em>resan egentligen?</em></h1>
            <p>Ange start och destination i Sverige eller Europa — vi hämtar distans, beräknar bränslekostnad och uppskattar restiden.</p>
          </div>
          <section aria-label="Vanliga frågor"><h2>Vanliga frågor</h2>${faqHtml}</section>
        </main>`

      return html
        .replace('<!--FAQ_JSONLD-->', `<script type="application/ld+json">${jsonLd}</script>`)
        .replace('<!--PRERENDER-->', prerender)
    },
  }
}

export default defineConfig({
  plugins: [react(), seoPrerender()],
})
