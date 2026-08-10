import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { HEADLINE, LINKS } from '../data'

export default function Hero() {
  const root = useRef(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        gsap.set('[data-hero-line] > span, [data-hero-tail]', { yPercent: 0, opacity: 1 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

      tl.from('[data-hero-line] > span', {
        yPercent: 118,
        duration: 1.5,
        stagger: 0.09,
      })
        .from('[data-hero-tail]', { y: 26, opacity: 0, duration: 1.1, stagger: 0.1 }, '-=1.05')
        .from('[data-hero-wash]', { opacity: 0, scale: 1.08, duration: 2.4 }, 0)

      // The ground drifts very slowly as the reader scrolls off the hero.
      gsap.to('[data-hero-wash]', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root },
  )

  return (
    <section
      id="top"
      ref={root}
      className="grain relative flex min-h-[100svh] w-full items-center overflow-hidden pb-24 pt-36 md:pb-32 md:pt-40"
    >
      {/* Ambient ground. CSS first, so the hero never depends on a remote image. */}
      <div data-hero-wash className="pointer-events-none absolute inset-0 -z-10">
        {/* Texture only. Blurred hard so it can never read as a stock photograph,
            and layered over a CSS ground that stands alone if it never loads. */}
        <div
          className="absolute -inset-24 scale-110 bg-cover bg-center opacity-[0.22] blur-[64px] grayscale contrast-125 mix-blend-luminosity"
          style={{ backgroundImage: "url('https://picsum.photos/seed/warehouse-dusk-ledger/1600/900')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(65rem_45rem_at_50%_38%,rgba(31,44,209,0.26),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(100rem_60rem_at_50%_50%,transparent_10%,rgba(8,8,10,0.72)_62%,#08080a_92%)]" />
      </div>

      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div className="mx-auto flex max-w-[72rem] flex-col items-center text-center">
          <h1
            className="max-w-[68rem] font-medium leading-[0.95] tracking-tightest text-bone"
            style={{ fontSize: 'clamp(2.75rem, 6.1vw, 6.4rem)' }}
          >
            <span data-hero-line className="block overflow-hidden pb-[0.08em]">
              <span className="block">Three months carry</span>
            </span>
            <span data-hero-line className="block overflow-hidden pb-[0.08em]">
              <span className="block">
                <span className="text-lift">{HEADLINE.share}%</span> of the year.
              </span>
            </span>
          </h1>

          <p
            data-hero-tail
            className="mt-9 max-w-[54rem] text-pretty text-base leading-relaxed text-sand/80 md:mt-11 md:text-[1.075rem] md:leading-[1.75]"
          >
            {HEADLINE.sentence}
          </p>

          <div data-hero-tail className="mt-11 flex flex-col items-center gap-3 sm:flex-row md:mt-14">
            <a
              href="#finding"
              className="group inline-flex items-center gap-3 rounded-full bg-bone px-7 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:bg-white"
            >
              Read the finding
              <span className="inline-block transition-transform duration-500 ease-out group-hover:translate-y-0.5">
                &#8595;
              </span>
            </a>
            <a
              href={LINKS.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-4 text-sm font-medium text-bone transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.06]"
            >
              Open the repository
            </a>
          </div>
        </div>
      </div>

      <div
        data-hero-tail
        className="pointer-events-none absolute inset-x-0 bottom-7 mx-auto flex max-w-canvas justify-center px-6 md:justify-start md:px-10"
      >
        <p className="max-w-md font-mono text-[0.68rem] leading-relaxed tracking-[0.14em] text-sand/40">
          UCI ONLINE RETAIL II &middot; ONE UK ONLINE GIFT WHOLESALER &middot; TWO YEARS OF TRANSACTION LINES
        </p>
      </div>
    </section>
  )
}
