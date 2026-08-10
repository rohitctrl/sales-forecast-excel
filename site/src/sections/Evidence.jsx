import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import ChartPlate from '../components/ChartPlate'
import { CHARTS } from '../data'

export default function Evidence() {
  const root = useRef(null)
  const rail = useRef(null)
  const column = useRef(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const items = gsap.utils.toArray('[data-chart-item]', root.current)

      items.forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 62%',
          end: 'bottom 42%',
          onToggle: (self) => self.isActive && setActive(i),
        })

        if (reduce) return

        // Grow into view.
        gsap.fromTo(
          el,
          { scale: 0.84, opacity: 0.22 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 46%', scrub: 0.8 },
          },
        )

        // Darken and fade on the way out.
        gsap.to(el, {
          opacity: 0.18,
          scale: 0.95,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'bottom 62%', end: 'bottom 8%', scrub: 0.8 },
        })
      })

      if (reduce) return

      // Real pinning: the title rail holds while the plates travel past it.
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top top+=104',
          // Release exactly when the rail's foot meets the foot of the plates,
          // so the title never drifts up under the navigation.
          end: () => `+=${Math.max(0, column.current.offsetHeight - rail.current.offsetHeight)}`,
          pin: rail.current,
          pinSpacing: false,
          invalidateOnRefresh: true,
        })
        return () => st.kill()
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="evidence" className="relative w-full py-32 md:py-48">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div>
            <div ref={rail} className="lg:pr-6">
              <h2
                className="max-w-[27rem] font-medium leading-[1.04] tracking-tightest text-bone"
                style={{ fontSize: 'clamp(2.1rem, 3.6vw, 3.6rem)' }}
              >
                What the series actually looks like
              </h2>
              <p className="mt-7 max-w-sm text-pretty text-[0.95rem] leading-relaxed text-sand/70">
                Six charts came out of the pipeline. These four carry the argument. Each one is the file the
                analysis wrote, not a redrawing of it.
              </p>

              <div className="mt-12 hidden flex-col gap-px bg-white/10 lg:flex">
                {CHARTS.map((chart, i) => (
                  <div
                    key={chart.src}
                    className={`bg-pitch py-4 pr-4 transition-colors duration-500 ${
                      active === i ? 'text-bone' : 'text-sand/40'
                    }`}
                  >
                    <div className="flex items-baseline gap-4">
                      <span
                        className={`h-px w-8 shrink-0 transition-colors duration-500 ${
                          active === i ? 'bg-lift' : 'bg-white/15'
                        }`}
                      />
                      <span className="text-[0.95rem] font-medium leading-snug">{chart.title}</span>
                    </div>
                    <div
                      className={`overflow-hidden pl-12 transition-all duration-700 ease-out ${
                        active === i ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-pretty text-[0.83rem] leading-relaxed text-sand/70">
                        {chart.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div ref={column} className="flex flex-col gap-24 md:gap-32">
            {CHARTS.map((chart) => (
              <div key={chart.src} data-chart-item className="will-change-transform">
                <ChartPlate src={chart.src} alt={chart.caption} />
                <div className="mt-6 max-w-2xl lg:hidden">
                  <p className="text-[1.05rem] font-medium text-bone">{chart.title}</p>
                  <p className="mt-2 text-pretty text-[0.9rem] leading-relaxed text-sand/70">
                    {chart.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
