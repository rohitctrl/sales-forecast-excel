import { useState } from 'react'
import { DATASET, DECEMBER_TRAP, KEPT, LEDGER, LINKS } from '../data'

function Ledger() {
  const [open, setOpen] = useState(0)

  return (
    <div className="mt-12 md:mt-16">
      {/* Desktop: horizontal accordion. Every step keeps its name, its count and
          a one-line reason visible at all times; expanding adds the full note. */}
      <div className="hidden gap-px bg-white/10 lg:flex lg:h-[26rem]">
        {LEDGER.map((step, i) => {
          const active = open === i
          return (
            <button
              key={step.key}
              type="button"
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onClick={() => setOpen(i)}
              aria-expanded={active}
              className={`group relative flex min-w-0 cursor-pointer flex-col justify-between overflow-hidden bg-pitch p-6 text-left transition-[flex-grow] duration-700 ease-out ${
                active ? 'flex-[3.4]' : 'flex-[1]'
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-px transition-colors duration-500 ${
                  active ? 'bg-lift' : 'bg-transparent'
                }`}
              />
              <span className="block">
                <span className="rule-label block">{step.name}</span>
                <span className="figure mt-4 block text-2xl font-medium text-rust">&minus;{step.dropped}</span>
                <span className="mt-3 block text-[0.8rem] leading-relaxed text-sand/70">{step.lede}</span>
              </span>
              <span className="block">
                <span
                  className={`block overflow-hidden text-pretty text-[0.83rem] leading-relaxed text-sand/70 transition-all duration-700 ease-out ${
                    active ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {step.body}
                </span>
                <span className="mt-5 block font-mono text-[0.65rem] tracking-[0.14em] text-sand/40">
                  {step.from} &rarr; {step.to}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Below large screens the same ledger reads as a plain stacked list with
          nothing hidden behind a hover. */}
      <div className="flex flex-col gap-px bg-white/10 lg:hidden">
        {LEDGER.map((step) => (
          <div key={step.key} className="bg-pitch p-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="rule-label">{step.name}</span>
              <span className="figure text-lg font-medium text-rust">&minus;{step.dropped}</span>
            </div>
            <p className="mt-3 text-pretty text-[0.85rem] leading-relaxed text-sand/70">{step.body}</p>
            <p className="mt-4 font-mono text-[0.65rem] tracking-[0.14em] text-sand/40">
              {step.from} &rarr; {step.to}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-white/10 pt-6">
        <p className="font-mono text-sm tracking-[0.06em] text-bone">
          {DATASET.raw} <span className="text-sand/40">&rarr;</span> {DATASET.final}
        </p>
        <p className="text-sm text-sand/70">
          {DATASET.dropped} rows dropped across seven steps, {DATASET.droppedPct} percent of the file.
        </p>
      </div>
    </div>
  )
}

export default function Data() {
  return (
    <section id="data" className="relative w-full py-32 md:py-48">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2
            className="max-w-[42rem] font-medium leading-[1.04] tracking-tightest text-bone"
            style={{ fontSize: 'clamp(2.1rem, 4.4vw, 4.2rem)' }}
          >
            A million rows, and the ones that had to go
          </h2>
          <p className="max-w-md text-pretty text-[0.95rem] leading-relaxed text-sand/70">
            Cleaning is where a seasonality finding is won or lost. Every row removed is listed below with the
            reason and the running count, because a number nobody can audit is not a number.
          </p>
        </div>

        {/* Gapless bento. 12 columns, 2 rows, 24 cells, all occupied:
            row 1 = 4 + 8, row 2 = 4 (spanned) + 5 + 3. */}
        <div className="mt-16 grid grid-flow-row-dense grid-cols-1 gap-px bg-white/10 md:auto-rows-[minmax(12rem,auto)] md:grid-cols-12">
          {/* E — 4 wide, 2 tall */}
          <article className="cell flex flex-col justify-between md:col-span-4 md:row-span-2">
            <div>
              <p className="rule-label">Provenance</p>
              <p className="mt-6 text-xl font-medium leading-snug text-bone">{DATASET.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-sand/70">{DATASET.author}</p>
              <a
                href={LINKS.dataset}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block break-all font-mono text-[0.7rem] leading-relaxed text-lift underline decoration-lift/30 underline-offset-4 transition-colors hover:decoration-lift"
              >
                archive.ics.uci.edu/static/public/502/online+retail+ii.zip
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8">
              <div>
                <dt className="rule-label">Raw lines</dt>
                <dd className="figure mt-2 text-lg text-bone">{DATASET.raw}</dd>
              </div>
              <div>
                <dt className="rule-label">Analysed</dt>
                <dd className="figure mt-2 text-lg text-bone">{DATASET.final}</dd>
              </div>
              <div>
                <dt className="rule-label">Dropped</dt>
                <dd className="figure mt-2 text-lg text-rust">{DATASET.dropped}</dd>
              </div>
              <div>
                <dt className="rule-label">Of the file</dt>
                <dd className="figure mt-2 text-lg text-sand">{DATASET.droppedPct}%</dd>
              </div>
            </dl>
          </article>

          {/* F — 8 wide, 1 tall */}
          <article className="cell md:col-span-8">
            <p className="rule-label">The trap in this file</p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
              <p className="text-pretty text-[1.05rem] leading-relaxed text-bone/90 md:text-[1.15rem]">
                The two worksheets both cover {DECEMBER_TRAP.overlapStart} to {DECEMBER_TRAP.overlapEnd}.{' '}
                {DECEMBER_TRAP.rows} rows and {DECEMBER_TRAP.invoices} invoices appear in both. Concatenate
                them and December 2010 doubles, inventing a{' '}
                <span className="text-rust">{DECEMBER_TRAP.fakeGrowth} percent</span> year-on-year jump inside
                the training window.
              </p>
              <div className="flex flex-col gap-px bg-white/10">
                <div className="flex items-baseline justify-between gap-4 bg-pitch py-4">
                  <span className="rule-label">Deduplicated</span>
                  <span className="figure text-base text-bone">GBP {DECEMBER_TRAP.deduped}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4 bg-pitch py-4">
                  <span className="rule-label">If left alone</span>
                  <span className="figure text-base text-rust">GBP {DECEMBER_TRAP.notDeduped}</span>
                </div>
              </div>
            </div>
          </article>

          {/* G — 5 wide, 1 tall */}
          <article className="cell md:col-span-5">
            <p className="rule-label">Kept deliberately</p>
            <ul className="mt-6 flex flex-col gap-5">
              {KEPT.map((item) => (
                <li key={item.rows} className="flex gap-4">
                  <span className="figure shrink-0 text-base text-lift">{item.rows}</span>
                  <span className="text-pretty text-sm leading-relaxed text-sand/70">
                    {item.label}. {item.why}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          {/* H — 3 wide, 1 tall */}
          <article className="cell flex flex-col justify-between md:col-span-3">
            <p className="rule-label">Clean records per month</p>
            <p className="figure mt-8 text-[clamp(2rem,3vw,2.75rem)] font-medium leading-none text-bone">
              {DATASET.perMonth}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-sand/70">
              Mean across the {DATASET.final} analysed lines.
            </p>
          </article>
        </div>

        <Ledger />
      </div>
    </section>
  )
}
