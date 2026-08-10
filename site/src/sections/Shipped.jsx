import { useState } from 'react'
import { REGIONS, VERIFICATION, WORKBOOK } from '../data'

function Verification() {
  const [i, setI] = useState(0)
  const item = VERIFICATION[i]
  const go = (step) => setI((prev) => (prev + step + VERIFICATION.length) % VERIFICATION.length)

  return (
    <div className="mt-px grid gap-px bg-white/10 lg:grid-cols-[1fr_1.6fr]">
      <div className="cell flex flex-col justify-between gap-10">
        <div>
          <p className="rule-label">The independent pass</p>
          <p className="mt-7 text-pretty text-[0.98rem] leading-relaxed text-sand/70">
            Before any of this was written up, someone else deleted every derived artefact and rebuilt the
            analysis from the raw archive, then rewrote the pipeline from scratch to check it against itself.
            These are their notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous note"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-bone transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.06]"
          >
            &#8592;
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next note"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-bone transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.06]"
          >
            &#8594;
          </button>
          <span className="figure ml-3 text-xs text-sand/40">
            {i + 1} / {VERIFICATION.length}
          </span>
        </div>
      </div>

      <div className="cell relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(31,44,209,0.28),transparent_65%)]" />
        <p className="rule-label">{item.facet}</p>
        <blockquote
          key={i}
          className="mt-8 max-w-[42rem] text-pretty font-medium leading-[1.32] tracking-editorial text-bone"
          style={{ fontSize: 'clamp(1.35rem, 2.3vw, 2.05rem)' }}
        >
          {item.quote}
        </blockquote>
        <div className="mt-10 flex gap-2">
          {VERIFICATION.map((v, n) => (
            <button
              key={v.facet}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show note ${n + 1}`}
              className={`h-px w-10 transition-colors duration-500 ${n === i ? 'bg-lift' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Shipped() {
  return (
    <section className="relative w-full py-32 md:py-48">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2
            className="max-w-[44rem] font-medium leading-[1.04] tracking-tightest text-bone"
            style={{ fontSize: 'clamp(2.1rem, 4.4vw, 4.2rem)' }}
          >
            What actually shipped
          </h2>
          <p className="max-w-md text-pretty text-[0.95rem] leading-relaxed text-sand/70">
            One workbook, built by openpyxl, live rather than pasted. Press F9 and it rebuilds itself from the
            fact table.
          </p>
        </div>

        {/* 12 columns, one row: 5 + 4 + 3. No empty cells. */}
        <div className="mt-16 grid grid-flow-row-dense grid-cols-1 gap-px bg-white/10 md:grid-cols-12">
          <article className="cell md:col-span-5">
            <p className="rule-label">Inside the file</p>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-7">
              <div>
                <dt className="figure text-2xl text-bone">{WORKBOOK.sumifs}</dt>
                <dd className="mt-1 text-sm text-sand/70">live SUMIFS</dd>
              </div>
              <div>
                <dt className="figure text-2xl text-bone">{WORKBOOK.vlookups}</dt>
                <dd className="mt-1 text-sm text-sand/70">VLOOKUPs</dd>
              </div>
              <div>
                <dt className="figure text-2xl text-bone">{WORKBOOK.formatRules}</dt>
                <dd className="mt-1 text-sm text-sand/70">conditional-formatting rules</dd>
              </div>
              <div>
                <dt className="figure text-2xl text-bone">{WORKBOOK.charts}</dt>
                <dd className="mt-1 text-sm text-sand/70">native charts</dd>
              </div>
            </dl>
            <p className="mt-9 text-pretty text-sm leading-relaxed text-sand/70">
              And no PivotTables. openpyxl cannot write a pivotCache part, so the pivot logic is SUMIFS over a
              tidy fact table of {WORKBOOK.factRows} rows at month by region by product grain: the same
              cross-tab, recalculating live, without drag-and-drop re-pivoting.
            </p>
          </article>

          <article className="cell md:col-span-4">
            <p className="rule-label">Reproducible to the byte</p>
            <p className="mt-8 text-pretty text-[1.05rem] leading-relaxed text-bone/90">
              A cold re-run from the raw archive regenerates the workbook byte for byte, and{' '}
              {WORKBOOK.checks} structural checks pass against it.
            </p>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="rule-label">sha256</p>
              <p className="mt-3 break-all font-mono text-[0.7rem] leading-relaxed text-lift">
                {WORKBOOK.sha256}
              </p>
              <p className="figure mt-5 text-xs text-sand/50">{WORKBOOK.bytes} bytes</p>
            </div>
          </article>

          <article className="cell md:col-span-3">
            <p className="rule-label">The four buckets, which are ours</p>
            <ul className="mt-8 flex flex-col gap-5">
              {REGIONS.map((region) => (
                <li key={region.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-sand/70">{region.name}</span>
                    <span className="figure text-sm text-bone">{region.share}%</span>
                  </div>
                  <div className="mt-3.5 h-[3px] w-full bg-white/[0.08]">
                    <div className="h-[3px] bg-lift" style={{ width: `${region.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <Verification />
      </div>
    </section>
  )
}
