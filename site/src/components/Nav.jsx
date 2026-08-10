import { useEffect, useState } from 'react'
import { LINKS } from '../data'

const ITEMS = [
  { href: '#finding', label: 'Finding' },
  { href: '#data', label: 'Data' },
  { href: '#evidence', label: 'Charts' },
  { href: '#model', label: 'Model' },
  { href: '#honesty', label: 'Honesty' },
]

export default function Nav() {
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:px-8 md:pt-6">
      <nav
        className="pointer-events-auto flex w-full max-w-canvas items-center justify-between gap-4"
        aria-label="Primary"
      >
        <a
          href="#top"
          className={`group flex items-center gap-3 rounded-full border px-4 py-2.5 backdrop-blur-xl transition-colors duration-500 md:px-5 ${
            lifted ? 'border-white/[0.14] bg-void/80' : 'border-white/[0.08] bg-void/40'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-lift opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
          </span>
          <span className="whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.16em] text-bone/90 sm:text-[0.7rem] sm:tracking-[0.2em]">
            Seasonality<span className="text-sand/50"> / </span>Forecast
          </span>
        </a>

        <div
          className={`hidden items-center rounded-full border px-2 py-1.5 backdrop-blur-xl transition-colors duration-500 lg:flex ${
            lifted ? 'border-white/[0.14] bg-void/80' : 'border-white/[0.08] bg-void/40'
          }`}
        >
          {ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sand/70 transition-colors duration-300 hover:bg-white/[0.06] hover:text-bone"
            >
              {item.label}
            </a>
          ))}
          <a
            href={LINKS.repo}
            target="_blank"
            rel="noreferrer"
            className="ml-1 rounded-full bg-bone px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:bg-white"
          >
            Repository
          </a>
        </div>

        <a
          href={LINKS.repo}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-bone px-4 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink lg:hidden"
        >
          Repository
        </a>
      </nav>
    </header>
  )
}
