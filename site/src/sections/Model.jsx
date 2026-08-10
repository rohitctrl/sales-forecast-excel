import ChartPlate from '../components/ChartPlate'
import { HOLDOUT, ROLLING } from '../data'

export default function Model() {
  return (
    <section id="model" className="relative w-full py-32 md:py-48">
      <div className="mx-auto w-full max-w-canvas px-6 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2
            className="max-w-[46rem] font-medium leading-[1.04] tracking-tightest text-bone"
            style={{ fontSize: 'clamp(2.1rem, 4.4vw, 4.2rem)' }}
          >
            Does the model beat the one-line rule?
          </h2>
          <p className="max-w-md text-pretty text-[0.95rem] leading-relaxed text-sand/70">
            A forecast without a baseline is a number with nothing to lean on. So the regression was run
            against the cheapest rule available: this month equals the same month last year.
          </p>
        </div>

        <div className="mt-16 grid gap-px bg-white/10 lg:grid-cols-[1.25fr_1fr]">
          <div className="cell">
            <p className="rule-label">
              Held-out quarter, {ROLLING.holdoutMonths} months the model never saw
            </p>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="rule-label pb-4 font-normal">Model</th>
                    <th className="rule-label pb-4 text-right font-normal">MAPE</th>
                    <th className="rule-label pb-4 text-right font-normal">RMSE, GBP</th>
                    <th className="rule-label pb-4 text-right font-normal">R-squared</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLDOUT.map((row) => (
                    <tr key={row.model} className="border-b border-white/[0.06] last:border-0">
                      <td className="py-5 pr-6 text-[0.92rem] leading-snug text-bone/90">{row.model}</td>
                      <td
                        className={`figure py-5 text-right text-[1.05rem] ${
                          row.lead ? 'text-lift' : 'text-bone'
                        }`}
                      >
                        {row.mape}%
                      </td>
                      <td className="figure py-5 text-right text-[0.95rem] text-sand/70">
                        {row.rmse ?? <span className="text-sand/30">&mdash;</span>}
                      </td>
                      <td className="figure py-5 text-right text-[0.95rem] text-sand/70">
                        {row.r2 ?? <span className="text-sand/30">&mdash;</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-8 text-pretty text-sm leading-relaxed text-sand/70">
              Out-of-sample throughout. The regression’s {HOLDOUT[0].mape} percent is also the honest reading
              of the “93% accuracy” line on the resume: {ROLLING.accuracyTranslation} percent, if you insist
              on subtracting MAPE from a hundred, which is not a defined metric.
            </p>
          </div>

          <div className="cell flex flex-col justify-between">
            <p className="rule-label">Holdout error by model</p>
            <ChartPlate
              className="mt-8"
              src="./charts/model-mape.svg"
              alt="Bar chart comparing holdout MAPE across the regression, seasonal naive, Fourier and naive models."
            />
            <p className="mt-8 text-pretty text-sm leading-relaxed text-sand/70">
              Three points is not a sample. R-squared on {ROLLING.holdoutMonths} observations is reported only
              because the brief asks for it.
            </p>
          </div>
        </div>

        {/* The verdict, stated against the author's own interest. */}
        <div className="mt-px grid gap-px bg-white/10 lg:grid-cols-[1fr_1fr]">
          <div className="cell border-l-2 border-l-lift">
            <p className="rule-label">Rolling-origin backtest</p>
            <p className="mt-7 text-pretty text-[1.25rem] font-medium leading-snug text-bone md:text-[1.5rem]">
              Widen the test from {ROLLING.holdoutMonths} forecasts to {ROLLING.points} and the one-line
              baseline wins outright.
            </p>
            <dl className="mt-9 grid grid-cols-2 gap-px bg-white/10">
              <div className="bg-pitch py-5 pr-5">
                <dt className="rule-label">Regression MAPE</dt>
                <dd className="figure mt-2 text-2xl text-bone">{ROLLING.regressionMape}%</dd>
                <dd className="figure mt-1 text-xs text-sand/50">R-squared {ROLLING.regressionR2}</dd>
              </div>
              <div className="bg-pitch py-5 pl-5">
                <dt className="rule-label">Seasonal naive MAPE</dt>
                <dd className="figure mt-2 text-2xl text-lift">{ROLLING.baselineMape}%</dd>
                <dd className="figure mt-1 text-xs text-sand/50">R-squared {ROLLING.baselineR2}</dd>
              </div>
            </dl>
            <p className="mt-7 text-sm leading-relaxed text-sand/70">
              {ROLLING.origins} origins, horizons one to three, {ROLLING.points} strictly out-of-sample
              points. On the fixed holdout the regression leads by {ROLLING.margin} points on{' '}
              {ROLLING.holdoutMonths} observations, which is not a lead worth defending.
            </p>
          </div>

          <div className="cell flex flex-col justify-between gap-10">
            <div>
              <p className="rule-label">Why the model cannot pull ahead</p>
              <p className="mt-7 text-pretty text-[0.98rem] leading-relaxed text-sand/70 md:text-[1.05rem]">
                {ROLLING.structural}
              </p>
            </div>
            <div className="border-t border-white/10 pt-7">
              <p className="text-pretty text-[0.98rem] leading-relaxed text-bone/90">
                September 2011 ran {ROLLING.sepGrowth} percent above September 2010. The season started early,
                and that is where almost all of the holdout error lives.
              </p>
              <p className="mt-6 text-pretty text-sm leading-relaxed text-sand/70">
                The conclusion the analysis reaches, and the one the resume did not: on this series the
                regression does not reliably beat “same month last year”. The seasonality is doing all the
                work; the model is mostly re-deriving it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
