import ChartPlate from '../components/ChartPlate'
import ScrubText from '../components/ScrubText'
import { HEADLINE, SEASON } from '../data'

const QUESTION =
  'The question was narrow. Two years of transaction lines from one UK online gift wholesaler: when does the money actually arrive, and can the next quarter be predicted well enough to plan stock against?'

export default function Finding() {
  return (
    <section id="finding" className="relative w-full py-32 md:py-48">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <ScrubText
          text={QUESTION}
          accent={['arrive', 'predicted']}
          className="max-w-[62rem] text-balance text-2xl font-medium leading-[1.28] tracking-editorial text-bone sm:text-3xl md:text-[2.6rem] md:leading-[1.22]"
        />

        <h2
          className="mt-24 max-w-[64rem] font-medium leading-[1.02] tracking-tightest text-bone md:mt-32"
          style={{ fontSize: 'clamp(2.1rem, 4.4vw, 4.2rem)' }}
        >
          Where the money
          <span
            className="mx-3 inline-block h-[0.62em] w-[1.75em] rounded-full bg-cover bg-center align-middle grayscale contrast-125"
            style={{ backgroundImage: "url('https://picsum.photos/seed/autumn-shelves-crate/480/220')" }}
            aria-hidden="true"
          />
          actually lands
        </h2>

        {/* Gapless bento. 12 columns, 2 rows, 24 cells, all occupied:
            row 1 = 5 + 7, row 2 = 5 (spanned) + 4 + 3. */}
        <div className="mt-14 grid grid-flow-row-dense grid-cols-1 gap-px bg-white/10 md:mt-16 md:auto-rows-[minmax(13rem,auto)] md:grid-cols-12">
          {/* A — 5 wide, 2 tall */}
          <article className="cell flex flex-col justify-between md:col-span-5 md:row-span-2">
            <p className="rule-label">Trailing twelve months, {HEADLINE.window}</p>
            <div className="py-10 md:py-14">
              <p
                className="figure font-medium leading-[0.86] text-bone"
                style={{ fontSize: 'clamp(4.5rem, 9vw, 8.5rem)' }}
              >
                {HEADLINE.sharePrecise}
                <span className="text-lift">%</span>
              </p>
              <p className="mt-6 max-w-sm text-pretty text-[0.95rem] leading-relaxed text-sand/70">
                of revenue falls in September, October and November &mdash; half as much again as an evenly
                spread quarter would.
              </p>
            </div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-pretty text-sm leading-relaxed text-sand/70">
                Not a one-year artefact. In the twelve months before, {HEADLINE.priorWindow}, the same three
                months were{' '}
                <span className="figure font-medium text-bone">{HEADLINE.priorShare}%</span>.
              </p>
            </div>
          </article>

          {/* B — 7 wide, 1 tall */}
          <article className="cell md:col-span-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="rule-label">Revenue by month of year</p>
              <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-sand/40">
                {SEASON.seriesStart} &ndash; {SEASON.seriesEnd}
              </p>
            </div>
            <ChartPlate
              className="mt-6"
              src="./charts/month-of-year.svg"
              alt="Bar chart of revenue by calendar month, showing September, October and November far above the rest of the year."
            />
          </article>

          {/* C — 4 wide, 1 tall */}
          <article className="cell flex flex-col justify-between md:col-span-4">
            <p className="rule-label">Strongest month over weakest</p>
            <p
              className="figure mt-8 font-medium leading-none text-bone"
              style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}
            >
              {SEASON.ratio}
              <span className="text-sand/50">&times;</span>
            </p>
            <p className="mt-6 text-pretty text-sm leading-relaxed text-sand/70">
              {SEASON.peakMonth} took GBP {SEASON.peakRevenue}. {SEASON.troughMonth} took GBP{' '}
              {SEASON.troughRevenue}.
            </p>
          </article>

          {/* D — 3 wide, 1 tall */}
          <article className="cell flex flex-col justify-between md:col-span-3">
            <p className="rule-label">Cleaned revenue, {SEASON.months} complete months</p>
            <div className="mt-8">
              <p className="font-mono text-xs tracking-[0.2em] text-sand/50">GBP</p>
              <p className="figure mt-2 text-[clamp(1.5rem,2.2vw,2.1rem)] font-medium leading-tight text-bone">
                {SEASON.totalRevenue}
              </p>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-sand/70">
              {SEASON.seriesStart} to {SEASON.seriesEnd}, with no part-months.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
