import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { DATASET, LINKS } from '../data'

const CONTACT = [
  { label: 'Repository', value: 'github.com/rohitctrl/sales-forecast-excel', href: LINKS.repo },
  { label: 'Email', value: LINKS.email, href: `mailto:${LINKS.email}` },
  { label: 'GitHub', value: 'github.com/rohitctrl', href: LINKS.github },
  { label: 'LinkedIn', value: 'linkedin.com/in/rohiiit', href: LINKS.linkedin },
]

export default function Action() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('[data-cta-panel]', {
        yPercent: 6,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-cta-panel]', start: 'top 88%' },
      })
    },
    { scope: root },
  )

  return (
    <footer ref={root} className="relative w-full pb-14 pt-16 md:pb-20 md:pt-24">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div data-cta-panel className="grain relative overflow-hidden rounded-[4px] bg-bone px-7 py-20 md:px-16 md:py-28">
          <div
            className="pointer-events-none absolute -inset-20 bg-cover bg-center opacity-[0.14] blur-[56px] grayscale contrast-125"
            style={{ backgroundImage: "url('https://picsum.photos/seed/paper-ledger-grain/1200/700')" }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2
              className="max-w-[52rem] font-medium leading-[1.02] tracking-tightest text-ink"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 4.8rem)' }}
            >
              The code that disagrees with the resume is in the repository too.
            </h2>
            <p className="mt-8 max-w-xl text-pretty text-[1rem] leading-relaxed text-ink/70">
              The pipeline, the workbook builder, the verification script and the README that publishes the
              dropped-row ledger and marks two of the six claims contradicted. Clone it and re-run it; it
              rebuilds byte for byte.
            </p>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <a
                href={LINKS.repo}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-ink px-8 py-4 text-sm font-medium text-bone transition-colors duration-300 hover:bg-volt"
              >
                Open the repository
                <span className="inline-block transition-transform duration-500 ease-out group-hover:translate-x-1">
                  &#8594;
                </span>
              </a>
              <a
                href={`mailto:${LINKS.email}`}
                className="inline-flex items-center justify-center rounded-full border border-ink/25 px-8 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink/60 hover:bg-ink/[0.06]"
              >
                Email Rohit
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <p className="text-lg font-medium text-bone">Rohit Kumar</p>
            <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-sand/70">
              Electrical engineer and QA analyst moving into data. This page reports one finished analysis,
              including the parts of it that did not work.
            </p>
          </div>
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {CONTACT.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer"
                className="group block"
              >
                <span className="rule-label block">{item.label}</span>
                <span className="mt-2 block break-all font-mono text-[0.8rem] text-bone transition-colors duration-300 group-hover:text-lift">
                  {item.value}
                </span>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-14 max-w-3xl text-pretty font-mono text-[0.68rem] leading-relaxed tracking-[0.06em] text-sand/60">
          Data: {DATASET.name}, {DATASET.author}. {DATASET.raw} raw transaction lines, {DATASET.final}{' '}
          analysed, {DATASET.dropped} dropped. One UK online gift wholesaler, 2009 to 2011. Nothing here
          generalises to other retailers or to today.
        </p>
      </div>
    </footer>
  )
}
