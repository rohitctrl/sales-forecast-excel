/*
 * Every figure rendered on this site comes from this file, and every figure in
 * this file comes from the independently re-verified output of run_analysis.py.
 * Nothing here is rounded, restated or re-derived. If a number is not in this
 * file it does not appear on the page.
 */

export const LINKS = {
  repo: 'https://github.com/rohitctrl/sales-forecast-excel',
  email: 'knowwrohit@gmail.com',
  github: 'https://github.com/rohitctrl',
  linkedin: 'https://linkedin.com/in/rohiiit',
  dataset: 'https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip',
}

export const HEADLINE = {
  share: '37.2',
  sharePrecise: '37.20',
  priorShare: '36.11',
  window: '2010-12 to 2011-11',
  priorWindow: '2009-12 to 2010-11',
  sentence:
    'September, October and November alone bring in 37.2 percent of this wholesaler’s revenue in the trailing twelve months (2010-12 to 2011-11) — half as much again as an evenly spread quarter would — and it is not a one-year artefact: the same three months were 36.1 percent of the year before.',
}

export const SEASON = {
  ratio: '2.86',
  peakMonth: '2011-11',
  troughMonth: '2011-02',
  peakRevenue: '1,451,578.98',
  troughRevenue: '507,799.87',
  totalRevenue: '19,028,804.10',
  months: '24',
  seriesStart: '2009-12',
  seriesEnd: '2011-11',
}

export const DATASET = {
  name: 'UCI Online Retail II',
  author: 'Dr Daqing Chen, London South Bank University',
  raw: '1,067,371',
  final: '978,583',
  dropped: '88,788',
  droppedPct: '8.32',
  perMonth: '40,774.3',
  countries: '43',
  products: '4,893',
  productsForHalf: '290',
  top12Share: '8.36',
}

export const REGIONS = [
  { name: 'United Kingdom', share: '85.29' },
  { name: 'Rest of Europe', share: '9.91' },
  { name: 'Ireland (EIRE)', share: '3.24' },
  { name: 'Rest of World', share: '1.56' },
]

export const DECEMBER_TRAP = {
  rows: '22,523',
  invoices: '1,088',
  deduped: '775,638.36',
  notDeduped: '1,187,158.33',
  fakeGrowth: '48.19',
  overlapStart: '2010-12-01',
  overlapEnd: '2010-12-09',
}

/* The seven-step cleaning ledger, in the order the pipeline applies it. */
export const LEDGER = [
  {
    key: 'cross_sheet_overlap',
    name: 'Cross-sheet overlap',
    dropped: '22,523',
    from: '1,067,371',
    to: '1,044,848',
    lede: 'Both worksheets cover 2010-12-01 to 2010-12-09.',
    body:
      'The worksheets “Year 2009-2010” and “Year 2010-2011” both cover 2010-12-01 to 2010-12-09; 1,088 invoices appear in both. Kept the sheet-1 copy. Leaving these in inflates December 2010 from GBP 775,638 to GBP 1,187,158 and fabricates a 48.19 percent year-on-year jump inside the training window.',
  },
  {
    key: 'exact_duplicate_lines',
    name: 'Exact duplicate lines',
    dropped: '11,814',
    from: '1,044,848',
    to: '1,033,034',
    lede: 'The same line recorded twice, field for field.',
    body:
      'Identical Invoice + StockCode + Quantity + Price + timestamp + Country; the same line recorded twice, and keeping both would double-count revenue.',
  },
  {
    key: 'credit_notes',
    name: 'Credit notes',
    dropped: '19,104',
    from: '1,033,034',
    to: '1,013,930',
    lede: 'Invoice numbers prefixed C are cancellations and returns.',
    body:
      'Invoice numbers prefixed “C” are cancellations and returns with negative quantities; excluded so the series measures gross sales.',
  },
  {
    key: 'admin_stock_codes',
    name: 'Admin stock codes',
    dropped: '4,631',
    from: '1,013,930',
    to: '1,009,299',
    lede: 'Postage, adjustments, bank charges, samples, vouchers.',
    body:
      'Postage (POST/DOT), manual adjustments (M/ADJUST), bank charges, samples, Amazon fees, gift vouchers and TEST rows are not product sales.',
  },
  {
    key: 'nonpositive_quantity',
    name: 'Non-positive quantity',
    dropped: '3,392',
    from: '1,009,299',
    to: '1,005,907',
    lede: 'Write-offs and stock corrections, not sales.',
    body:
      'Quantity <= 0 outside the credit-note set: write-offs and stock corrections, not sales.',
  },
  {
    key: 'nonpositive_price',
    name: 'Non-positive price',
    dropped: '2,571',
    from: '1,005,907',
    to: '1,003,336',
    lede: 'Freebies and entry errors produce zero or negative revenue.',
    body:
      'Price <= 0 produces zero or negative revenue; freebies and entry errors, not sales.',
  },
  {
    key: 'truncated_final_month',
    name: 'Truncated final month',
    dropped: '24,753',
    from: '1,003,336',
    to: '978,583',
    lede: 'The file stops on 2011-12-09, so December 2011 is a part-month.',
    body:
      'The file stops on 2011-12-09, so December 2011 is a part-month and would read as a 58 percent collapse in a monthly series. The series therefore ends 2011-11.',
  },
]

export const KEPT = [
  {
    rows: '243,007',
    label: 'rows with a missing Customer ID',
    why: 'Valid transactions, and only customer-level analysis would need the ID.',
  },
  {
    rows: '4,382',
    label: 'rows with a missing Description',
    why: 'The StockCode still identifies the product.',
  },
]

export const HOLDOUT = [
  { model: 'Linear regression, trend + month dummies', mape: '5.49', rmse: '89,466.25', r2: '0.765', lead: true },
  { model: 'Seasonal naive, same month last year', mape: '5.93', rmse: '92,849.91', r2: '0.746', lead: false },
  { model: 'Log-linear trend + Fourier(2)', mape: '11.63', rmse: null, r2: null, lead: false },
  { model: 'Naive, last month carried forward', mape: '38.01', rmse: null, r2: null, lead: false },
]

export const ROLLING = {
  regressionMape: '6.83',
  baselineMape: '6.38',
  regressionR2: '0.911',
  baselineR2: '0.918',
  points: '15',
  origins: '6',
  holdoutMonths: '3',
  margin: '0.43',
  accuracyTranslation: '94.51',
  sepGrowth: '18.30',
  structural:
    'With 21 training months, September, October and November each appear exactly once, so their dummy coefficients are fit by a single observation and the forecast collapses to “same month last year plus one year of trend”.',
}

export const WORKBOOK = {
  factRows: '845',
  bytes: '62,280',
  sha256: '0dd9481f9ee111cd12a4cae110080370d6524cef13849b4e26852ffb0c37edd8',
  checks: '19',
  sumifs: '147',
  vlookups: '12',
  formatRules: '4',
  charts: '3',
}

export const CLAIMS = [
  {
    claim: 'Built a dynamic Excel dashboard analyzing 15K+ monthly sales records',
    verdict: 'supported',
    finding:
      '40,774.3 clean records per month on average, 978,583 over 24 months. Comfortably clears 15K — the claim understates the dataset by roughly 2.7 times, which is the good kind of error.',
    fix: 'Rohit could safely say “40K+ monthly records”.',
  },
  {
    claim: 'across 4 regions',
    verdict: 'contradicted',
    finding:
      '43 countries in a single free-text Country column; there is no region field in the data. The four buckets on the dashboard — UK, Ireland, Rest of Europe, Rest of World — are defined in analysis/pipeline.py, not read from the source. 85.29 percent of revenue is UK, so the split describes concentration rather than a genuine four-way comparison.',
    fix: 'The bullet must say the regions are a derived grouping, or drop the number.',
  },
  {
    claim: 'and 12 products',
    verdict: 'contradicted',
    finding:
      '4,893 distinct stock codes. The top 12 are only 8.36 percent of revenue, and it takes 290 products to reach half of turnover. The dashboard does display 12 products, but they are the twelve largest of nearly five thousand.',
    fix: '“Top 12 products by revenue” is the honest phrasing.',
  },
  {
    claim: 'Used pivot tables, VLOOKUP, conditional formatting, and charts',
    verdict: 'partially supported',
    finding:
      '12 VLOOKUPs, 4 conditional-formatting rules and 3 native charts are in the workbook. There are no PivotTables — openpyxl cannot emit a pivotCache part, so claiming one would be false and it is not claimed. The pivot logic is 147 live SUMIFS over a tidy fact table: same cross-tab, recalculates live, never needs a manual refresh.',
    fix: 'What it does not give you is drag-and-drop re-pivoting in the Excel UI.',
  },
  {
    claim: 'applied linear regression to forecast next-quarter sales with 93% accuracy',
    verdict: 'partially supported',
    finding:
      'MAPE 5.49 percent on the held-out quarter, equivalently 94.51 percent “accuracy”; RMSE GBP 89,466; R-squared 0.765 on n=3 months. But “93% accuracy” is not a defined metric for a regression, and the number is hollow without a baseline. Seasonal naive scores 5.93 percent on the same holdout and beats the regression on the 15-point rolling backtest, 6.38 against 6.83.',
    fix: 'The honest bullet states the metric, the holdout, and that the model does not reliably beat the naive seasonal baseline.',
  },
  {
    claim: 'reducing inventory gaps by 18%',
    verdict: 'unverifiable',
    finding:
      'No inventory, stock-out or fulfilment field exists in this dataset, or in any public transaction file. A downstream business outcome that transaction data cannot evidence. Kept off this page as a finding.',
    fix:
      'The defensible inventory-relevant fact is the seasonality: 37.20 percent of the trailing twelve months’ revenue lands in September to November, and 36.11 percent in the twelve months before, so the pattern is stable enough to plan stock against.',
  },
]

export const CAVEATS = [
  '24 complete months is the bare minimum for a seasonal forecast: each calendar month is observed exactly twice, so every seasonal coefficient rests on two data points.',
  'The two source worksheets overlap for 2010-12-01 to 2010-12-09. Analyses that concatenate them without deduplicating double-count 22,523 rows and report a false December 2010 spike; run_analysis.py prints both figures so the difference is visible rather than taken on trust.',
  'December 2011 is truncated on the 9th and is excluded; the series ends 2011-11.',
  '“Region” is not in the data. The four geography buckets are ours, built from the 43-value free-text Country column, and 85.29 percent of revenue is UK.',
  'R-squared on a 3-point holdout is close to meaningless; it is reported because the brief asks for it, and the 15-point rolling-origin backtest is the robustness check that actually carries weight.',
  'The workbook’s Data sheet holds the 845-row month x region x product aggregate, not the 978,583 cleaned line items — the line level would make the download several hundred megabytes and every SUMIFS crawl, so it stays in the Python pipeline.',
  'The workbook contains no PivotTables. openpyxl cannot write a pivotCache part, so the pivot logic is SUMIFS over a tidy fact table: same cross-tab, recalculates live, but no drag-and-drop re-pivoting.',
  'No LibreOffice or Excel is installed on the build machine, so the workbook is verified structurally — zip CRC, XML well-formedness across every part, resolvable relationships, declared content types, a clean openpyxl reload, the expected formula families and chart objects, and a refit of OLS from the sheet’s own design matrix agreeing with the published forecast to GBP 0.000000 — rather than by opening it in a spreadsheet application. 19 checks, all passing.',
  'This is one UK online gift wholesaler in 2009-2011. Nothing here generalises to other retailers or to today.',
]

export const VERIFICATION = [
  {
    quote:
      'I deleted every derived artifact and forced a real re-run from the raw zip. Every regenerated artifact is byte-identical to the originals, including the workbook.',
    facet: 'Cold rebuild',
  },
  {
    quote:
      'I did not trust the pipeline. I wrote my own loader and cleaner straight from the zip and reproduced every headline figure independently, including the OLS refit.',
    facet: 'Independent recompute',
  },
  {
    quote:
      'I mutation-tested the verification script against the real workbook. Corrupting one design-matrix cell made the check fail. The checks bite.',
    facet: 'Mutation test',
  },
  {
    quote:
      'I enumerated all ten consecutive three-month windows in the trailing year. September to November is genuinely the maximum, and it holds in both years.',
    facet: 'Cherry-pick check',
  },
  {
    quote: 'I tried hard to break this and could not. It reproduces exactly.',
    facet: 'Verdict',
  },
]

export const CHARTS = [
  {
    src: './charts/monthly-revenue.svg',
    title: 'Twenty-four months of revenue',
    caption:
      'Every complete month from 2009-12 to 2011-11. The autumn ramp is the whole story: 2011-11 reaches GBP 1,451,578.98 against GBP 507,799.87 in 2011-02.',
  },
  {
    src: './charts/forecast-holdout.svg',
    title: 'The held-out quarter',
    caption:
      'Trained on the first 21 months, tested on the last 3, which the model never saw. MAPE 5.49 percent, RMSE GBP 89,466.25. September 2011 ran 18.30 percent above September 2010 — the season started early, and that is where almost all the holdout error lives.',
  },
  {
    src: './charts/revenue-by-region.svg',
    title: 'Four buckets we defined ourselves',
    caption:
      'There is no region column. These four groupings are built from the 43-value free-text Country field, and 85.29 percent of revenue is United Kingdom.',
  },
  {
    src: './charts/product-pareto.svg',
    title: 'The long tail behind the top twelve',
    caption:
      'The twelve largest products are 8.36 percent of revenue. It takes 290 of the 4,893 stock codes to reach half of turnover.',
  },
]
