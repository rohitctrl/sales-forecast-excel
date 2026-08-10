# Sales dashboard and forecasting

**September, October and November bring in 37.20 percent of this wholesaler's revenue
in the trailing twelve months (2010-12 to 2011-11) - three months carrying nearly four
tenths of the year, where an evenly spread quarter would be 25 percent.** It is not a
one-year artefact: the same three months were 36.11 percent of the year before
(2009-12 to 2010-11). November alone is 2.86 times the weakest month. Any inventory
plan that treats the calendar as flat is wrong by half a quarter's stock.

The second finding is about the forecast itself. A linear regression on trend plus
month-of-year dummies predicted the held-out quarter with a **MAPE of 5.49 percent** -
forecasts landed within about five and a half percent of actual. That sounds good until
you fit the baseline: a one-line rule that says *this month equals the same month last
year* scores **5.93 percent** on the same holdout, and on a 15-point rolling-origin
backtest the baseline **wins** (6.38 percent against the regression's 6.83 percent).

The honest conclusion is that on this series the regression does not reliably beat
"same month last year". The seasonality is doing all the work; the model is mostly
re-deriving it.

Data: UCI Online Retail II, 1,067,371 raw transaction lines from a UK online gift
wholesaler, December 2009 to November 2011.

---

## The deliverable

`excel/sales_dashboard_forecast.xlsx` - built with openpyxl, five sheets, opens in
Excel or LibreOffice.

| Sheet | What is in it |
| --- | --- |
| Notes | Read-me, provenance, the dropped-row ledger, the claim check |
| Data | 845 aggregated fact rows at month x region x product grain, as an Excel Table |
| Lookups | VLOOKUP targets and the list backing the dashboard dropdown |
| Dashboard | 147 live SUMIFS formulas, 12 VLOOKUPs, 4 conditional-formatting rules, 2 native charts, a region dropdown that re-filters the KPI row |
| Forecast | The regression fitted **inside the workbook** on the training rows only (TREND / LINEST), with live fitted values, forecasts, APE columns and MAPE / RMSE / R-squared cells |

Nothing on the Dashboard or Forecast sheet is a pasted value. Press F9 and the whole
workbook rebuilds from the Data sheet. `fullCalcOnLoad` is set, so it recalculates the
moment you open it.

### Two honest notes about the Excel file

**There are no PivotTables in it.** openpyxl cannot write a `pivotCache` or
`pivotTable` part, so claiming one would be false. The pivot logic - revenue sliced by
month, region and product - is implemented with SUMIFS against a tidy fact table. For a
reader's purpose that is equivalent: it produces the same cross-tab, it recalculates
live when the source changes, and unlike a PivotTable it never needs a manual refresh.
What it does not give you is drag-and-drop re-pivoting in the Excel UI.

**The Data sheet holds the aggregate, not the line level.** The transaction file has
1,067,371 rows. Putting those in a workbook would produce a several-hundred-megabyte
download and make every SUMIFS crawl. The line level lives in the Python pipeline; the
workbook carries the 845-row aggregate that the dashboard actually needs.

**Verification.** `analysis/verify.py` runs 19 checks on the generated file: zip CRC
integrity, XML well-formedness across every part, resolvable relationship targets,
declared content types, a clean openpyxl reload with the expected sheets, the expected
formula families and chart objects, no XLOOKUP (it needs an `_xlfn.` prefix through
openpyxl and would render `#NAME?`), no formulas smuggled onto the Data sheet, and that
every `TREND` fit stops at the last training row so the held-out months never enter it.
The strictest one refits OLS from the numbers actually written into the workbook's
design matrix and compares against the published forecast - they agree to
GBP 0.000000. All 19 pass.

No copy of Excel or LibreOffice is installed on the build machine, so the file has
**not** been opened by a spreadsheet application. The structural checks are what is
claimed, not more. The workbook is byte-reproducible: its sha256 is
`0dd9481f9ee111cd12a4cae110080370d6524cef13849b4e26852ffb0c37edd8`.

One deliberate design choice: the forecast column uses `TREND`, not the `LINEST`
coefficient block. Excel's `LINEST` returns coefficients in reverse column order with
the intercept last, and getting that unpicking wrong would silently produce a wrong
forecast that nobody would catch without opening the file. `TREND` fits the identical
OLS and returns the prediction directly. The `LINEST` block is still there so you can
read the seasonal coefficients, and the Python-computed coefficients are printed
alongside it so any disagreement is visible at a glance.

---

## Method

**Series.** Total monthly revenue (quantity x price), 24 complete months,
2009-12 to 2011-11.

**Design fixed before any holdout number was looked at.** Train on the first 21 months,
hold out the last 3 - the "next quarter" the resume bullet talks about.

- Primary: OLS `revenue ~ trend + month-of-year dummies`. This is the literal reading of
  "applied linear regression".
- Secondary: OLS `log(revenue) ~ trend + Fourier(2)`. A genuinely different functional
  form with a quarter of the parameters.
- Baseline 1: naive - next month equals last month.
- Baseline 2: seasonal naive - next month equals the same month a year earlier.

**Metrics on the holdout only**, never in-sample.

| Model | Holdout MAPE | Holdout RMSE (GBP) | Holdout R2 | Rolling MAPE |
| --- | ---: | ---: | ---: | ---: |
| Linear regression (trend + month dummies) | 5.49% | 89,466 | 0.765 | 6.83% |
| Seasonal naive (baseline) | 5.93% | 92,850 | 0.746 | **6.38%** |
| Log-linear trend + Fourier(2) | 11.63% | 189,518 | -0.056 | 10.07% |
| Naive (last month carried forward) | 38.01% | 505,058 | -6.501 | 19.80% |

The fixed holdout is only 3 points, and R-squared on 3 points is close to meaningless -
it is reported because the brief asks for it, with that caveat attached. The robustness
check is an expanding-window rolling-origin backtest: 6 origins, horizons 1 to 3,
15 strictly out-of-sample forecasts. There the baseline wins.

**Why the regression is nearly the baseline by construction.** With 21 training months,
September, October and November each appear exactly once (2010 only). Their dummy
coefficients are each fit by a single observation, so the 2011 forecast reduces to
"same month last year, plus one year of trend". That is why the two models sit within
half a percentage point of each other, and it is a more useful thing to know than a
flattering headline number.

Almost all the holdout error is one month: both models miss September 2011 by about
15 percent and land within 1.5 percent on October and November. September 2011 ran
18.3 percent above September 2010 - the season started early that year.

---

## Data provenance

| | |
| --- | --- |
| Dataset | UCI Online Retail II (Dr Daqing Chen, London South Bank University) |
| Landing page | https://archive.ics.uci.edu/dataset/502/online+retail+ii |
| File | https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip |
| sha256 | `572e36277c2390fbfde10664750731e0a86f55e33470d91919085f0408e67bfb` |
| Bytes | 45,622,418 |
| Raw rows | 1,067,371 |
| Final rows | 978,583 |
| Dropped | 88,788 (8.32%) |

Public, no authentication. The script re-downloads it only when `data/raw/` is empty and
refuses to proceed if the response is not a real zip archive.

### Dropped-row ledger

| Step | Rows dropped | Remaining | Why |
| --- | ---: | ---: | --- |
| cross_sheet_overlap | 22,523 | 1,044,848 | The two worksheets both cover 2010-12-01 to 2010-12-09. Kept the sheet-1 copy. |
| exact_duplicate_lines | 11,814 | 1,033,034 | Identical invoice + stock code + quantity + price + timestamp + country. |
| credit_notes | 19,104 | 1,013,930 | Invoices prefixed `C` are cancellations and returns with negative quantities. |
| admin_stock_codes | 4,631 | 1,009,299 | POST, DOT, M, ADJUST, BANK CHARGES, AMAZONFEE, PADS, CRUK, TEST*, gift vouchers. Not product sales. |
| nonpositive_quantity | 3,392 | 1,005,907 | Quantity <= 0 outside the credit-note set: write-offs and stock corrections. |
| nonpositive_price | 2,571 | 1,003,336 | Price <= 0: freebies and entry errors, zero or negative revenue. |
| truncated_final_month | 24,753 | 978,583 | The file stops on 2011-12-09; December 2011 is a part-month. |

**Kept deliberately.** 243,007 rows have no Customer ID and 4,382 have no Description.
Both are kept: they are valid transactions, the stock code still identifies the product,
and only customer-level analysis would need the ID.

**The overlap is worth dwelling on.** The two worksheets are titled "Year 2009-2010" and
"Year 2010-2011", which reads like a clean split, but sheet 1 runs to 2010-12-09 and
sheet 2 starts at 2010-12-01. 1,088 invoices - 22,523 line items - appear in both.
Concatenate the sheets and clean them without deduplicating on the transaction key and
December 2010 comes out at GBP 1,187,158 instead of GBP 775,638: a fabricated
48.19 percent year-on-year jump sitting inside the training window, which then poisons
the December seasonal coefficient. Deduplicating on `Invoice + StockCode + Quantity +
Price + timestamp + Country` removes it. `run_analysis.py` computes and prints both
figures so you can see the difference rather than take it on trust.

---

## Resume claims, checked against the data

| Claim | Verdict | What the data says |
| --- | --- | --- |
| "15K+ monthly sales records" | **supported** | 40,774 clean records per month (978,583 over 24 months). The claim understates the dataset by about 2.7x. |
| "across 4 regions" | **contradicted** | 43 countries in a single free-text `Country` column. There is no region field. The four buckets on the dashboard (UK / Ireland / Rest of Europe / Rest of World) are defined by us in `analysis/pipeline.py`, not read from the data. |
| "and 12 products" | **contradicted** | 4,893 distinct stock codes. The dashboard does show 12 products, but they are the twelve largest and account for only 8.36 percent of revenue. It takes 290 products to reach half of turnover. |
| "pivot tables, VLOOKUP, conditional formatting, charts" | **partially supported** | VLOOKUP, conditional formatting and native charts are all in the workbook. There are no PivotTables - openpyxl cannot write one, so SUMIFS over a tidy fact table is used instead. |
| "linear regression ... 93% accuracy" | **partially supported** | "93% accuracy" is not a defined regression metric. Translated to MAPE, the number is roughly right: 5.49 percent MAPE on the held-out quarter, i.e. forecasts within about 5.5 percent of actual, which reads as 94.51 percent "accuracy". But the claim is hollow without a baseline. Seasonal naive scores 5.93 percent on the same holdout and beats the regression outright on the wider rolling backtest. |
| "reducing inventory gaps by 18%" | **unverifiable** | No inventory, stock-out or fulfilment field exists in this dataset, or in any public transaction file. Kept off the site. The defensible inventory-relevant fact is the seasonality: 37.20 percent of the trailing twelve months' revenue lands in September to November, and 36.11 percent in the twelve months before that. |

---

## Caveats

- 24 complete months is the bare minimum for a seasonal forecast. Every calendar month
  is observed exactly twice, so every seasonal coefficient rests on two data points.
- December 2011 is truncated on the 9th and is excluded. The series ends 2011-11.
- "Region" is not in the data. The four geography buckets are ours.
- 85.29 percent of revenue is United Kingdom, so the regional split is informative about
  concentration rather than a genuine four-way comparison.
- This is one UK online gift wholesaler in 2009-2011. Nothing here generalises to other
  retailers or to today.
- The workbook has been verified structurally, not by opening it in Excel. See above.

---

## Reproducing it

```
/home/rohitctrl/.venvs/dataproj/bin/python \
  /home/rohitctrl/Downloads/rohit-projects/sales-forecast-excel/analysis/run_analysis.py
```

Runs from any working directory. 90 seconds cold on this machine with an empty
`data/raw/` (downloads 45 MB and parses a 1M-row xlsx), about 5 seconds once the raw
file is cached. It re-downloads the source,
re-profiles it, re-cleans it, refits every model, redraws every chart, rebuilds and
re-verifies the workbook, and prints every published figure on a line prefixed
`HEADLINE`. `results/findings.json` is written from exactly those lines.

```
analysis/
  run_analysis.py   entry point - prints every HEADLINE number, writes findings.json
  pipeline.py       download, profile, clean, aggregate, drop ledger
  forecast.py       models, metrics, rolling-origin backtest
  charts.py         the six SVGs
  workbook.py       the .xlsx build
  verify.py         structural verification of the generated .xlsx
charts/             six SVGs, house style
excel/              the deliverable workbook
results/            findings.json plus the monthly series, fact table and backtest as CSV
data/               gitignored - raw download and parquet cache
```

Charts: `month-of-year.svg` (the headline seasonality), `monthly-revenue.svg`,
`forecast-holdout.svg`, `model-mape.svg`, `revenue-by-region.svg`,
`product-pareto.svg`.

Built by Rohit Kumar - knowwrohit@gmail.com - github.com/rohitctrl
