import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { CAVEATS, CLAIMS } from '../data'

const VERDICT_STYLE = {
  supported: 'text-lift border-lift/40',
  'partially supported': 'text-sand border-sand/40',
  contradicted: 'text-rust border-rust/50',
  unverifiable: 'text-rust border-rust/50',
}

export default function Honesty() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('[data-claim-row]', {
        y: 34,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '[data-claim-list]', start: 'top 82%' },
      })
    },
    { scope: root },
  )

  return (
    <section id="honesty" ref={root} className="relative w-full py-32 md:py-48">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2
            className="max-w-[48rem] font-medium leading-[1.04] tracking-tightest text-bone"
            style={{ fontSize: 'clamp(2.1rem, 4.4vw, 4.2rem)' }}
          >
            The six claims, checked against the data
          </h2>
          <p className="max-w-md text-pretty text-[0.95rem] leading-relaxed text-sand/70">
            These are the bullets from Rohit’s own resume, run against the file. Two of them do not survive
            and one cannot be evidenced at all. They stay on the page because that is the point of checking.
          </p>
        </div>

        <div data-claim-list className="mt-16 flex flex-col gap-px bg-white/10">
          {CLAIMS.map((claim) => (
            <article
              key={claim.claim}
              data-claim-row
              className="grid gap-6 bg-pitch p-7 md:grid-cols-[1fr_1.5fr] md:gap-12 md:p-9 lg:grid-cols-[0.9fr_1.6fr]"
            >
              <div>
                <span
                  className={`inline-block border-b pb-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] ${
                    VERDICT_STYLE[claim.verdict]
                  }`}
                >
                  {claim.verdict}
                </span>
                <p className="mt-6 text-pretty text-[1.05rem] leading-snug text-bone md:text-[1.15rem]">
                  &ldquo;{claim.claim}&rdquo;
                </p>
              </div>
              <div>
                <p className="text-pretty text-[0.95rem] leading-relaxed text-sand/80">{claim.finding}</p>
                <p className="mt-5 border-l border-white/15 pl-5 text-pretty text-[0.9rem] leading-relaxed text-bone/90">
                  {claim.fix}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-24 md:mt-32">
          <h3
            className="max-w-[38rem] font-medium leading-[1.06] tracking-tightest text-bone"
            style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.6rem)' }}
          >
            What this analysis cannot tell you
          </h3>
          <ul className="mt-10 flex flex-col gap-px bg-white/10">
            {CAVEATS.map((caveat) => (
              <li key={caveat.slice(0, 40)} className="bg-pitch py-6 md:py-7">
                <div className="flex gap-6 md:gap-8">
                  <span className="mt-[0.7em] h-px w-6 shrink-0 bg-lift/70 md:w-10" />
                  <p className="text-pretty text-[0.95rem] leading-relaxed text-sand/80">{caveat}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
