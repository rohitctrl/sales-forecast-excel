#!/usr/bin/env python
"""
Sales dashboard and forecasting - single entry point.

Recomputes every published number from the raw UCI Online Retail II download,
rebuilds the charts, rebuilds and verifies the Excel workbook, and writes
results/findings.json. Run from anywhere:

    /home/rohitctrl/.venvs/dataproj/bin/python \
        /home/rohitctrl/Downloads/rohit-projects/sales-forecast-excel/analysis/run_analysis.py

Every published figure is printed on its own line prefixed HEADLINE.
"""

from __future__ import annotations

import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import pandas as pd  # noqa: E402

import charts as C  # noqa: E402
import forecast as F  # noqa: E402
import pipeline as P  # noqa: E402
import verify as V  # noqa: E402
import workbook as W  # noqa: E402

RAW_DIR = os.path.join(ROOT, "data", "raw")
CHART_DIR = os.path.join(ROOT, "charts")
RESULT_DIR = os.path.join(ROOT, "results")
EXCEL_DIR = os.path.join(ROOT, "excel")
XLSX = os.path.join(EXCEL_DIR, "sales_dashboard_forecast.xlsx")

HEADLINES: list[tuple[str, str]] = []


def emit(key: str, value: str) -> str:
    line = f"HEADLINE {key} = {value}"
    HEADLINES.append((key, value))
    print(line)
    return line


def main() -> int:
    t0 = time.time()
    for d in (RAW_DIR, CHART_DIR, RESULT_DIR, EXCEL_DIR):
        os.makedirs(d, exist_ok=True)

    # ---------------------------------------------------------- 1. provenance
    print("== 1. source")
    prov = P.ensure_raw(RAW_DIR)
    print(f"   {prov['source_url']}")
    print(f"   sha256 {prov['sha256']}  bytes {prov['bytes']:,}")

    # ------------------------------------------------------------- 2. profile
    print("\n== 2. raw profile (before any cleaning)")
    raw = P.load_raw(RAW_DIR)
    prof = P.profile_raw(raw)
    for k, v in prof.items():
        if k != "columns":
            print(f"   {k:38s} {v}")

    # --------------------------------------------------------------- 3. clean
    print("\n== 3. cleaning - dropped-row ledger")
    clean, led = P.clean(raw)
    print(f"   {'raw rows':44s} {led.rows_raw:>10,}")
    for s in led.steps:
        print(f"   - {s['step']:42s} {-s['rows_dropped']:>10,}  -> {s['rows_remaining']:,}")
    print(f"   {'final rows':44s} {led.rows_final:>10,}")
    for s in led.steps:
        print(f"     why {s['step']}: {s['why']}")
    print("   kept deliberately: 243,007 rows with a missing Customer ID. They are "
          "valid transactions; only customer-level analysis would need the ID.")

    # ---------------------------------------------------- 4. shape and slices
    series = P.monthly_series(clean)
    top_codes = P.top_products(clean)
    labels = P.product_labels(clean, top_codes)
    fact = P.fact_table(clean, top_codes, labels)

    total_rev = float(clean.revenue.sum())
    region_rev = clean.groupby("region")["revenue"].sum()
    region_share = {r: round(float(region_rev[r]) / total_rev * 100, 2)
                    for r in P.REGION_ORDER}
    top12_share = float(clean[clean.StockCode.isin(top_codes)].revenue.sum()) / total_rev * 100
    import numpy as np
    prod_rev = np.sort(clean.groupby("StockCode")["revenue"].sum().to_numpy())[::-1]
    cum_share = (prod_rev.cumsum() / total_rev) * 100
    products_half = int((cum_share < 50).sum() + 1)

    # Seasonality share, defined on the trailing twelve months (Dec 2010 - Nov 2011):
    # Sep+Oct+Nov revenue as a share of that 12-month window.
    last12 = series.iloc[-12:]
    peak_q = series.iloc[-3:]
    peak_q_share = float(peak_q.sum()) / float(last12.sum()) * 100
    peak_q_window = f"{last12.index[0]}..{last12.index[-1]}"
    # Same calculation one year earlier (Dec 2009 - Nov 2010) as a robustness check:
    # does the Sep-Nov concentration hold in the other year, or is it a 2011 artefact?
    prior12 = series.iloc[:12]
    prior_q = series.iloc[9:12]
    peak_q_share_prior = float(prior_q.sum()) / float(prior12.sum()) * 100
    peak_q_window_prior = f"{prior12.index[0]}..{prior12.index[-1]}"
    peak_month, trough_month = series.idxmax(), series.idxmin()
    peak_trough = float(series.max()) / float(series.min())
    sep_growth = (float(series[pd.Period("2011-09")])
                  / float(series[pd.Period("2010-09")]) - 1) * 100
    ovl = P.overlap_impact(raw)
    print("\n== 3b. what the cross-sheet overlap would do if left in")
    print(f"   Dec 2010 without deduplication: GBP {ovl['dec2010_no_dedup_gbp']:,.2f}")
    print(f"   Dec 2010 after deduplication:   GBP "
          f"{float(series[pd.Period('2010-12')]):,.2f}")
    print(f"   fabricated Dec YoY growth:      {ovl['fake_yoy_growth_pct']:.2f}%")

    print("\n== 3c. seasonality (the headline), and whether it holds in both years")
    print(f"   Sep+Oct+Nov share of {peak_q_window}: {peak_q_share:.2f}%")
    print(f"   Sep+Oct+Nov share of {peak_q_window_prior}: {peak_q_share_prior:.2f}%")
    print("   an evenly spread quarter would be 25.00%")

    # ------------------------------------------------------------ 5. forecast
    print("\n== 4. forecast (models fixed before any holdout number was inspected)")
    holdout = F.holdout_evaluation(series)
    rolling = F.rolling_origin(series)
    print(f"   train {holdout['train_months'][0]}..{holdout['train_months'][-1]} "
          f"({len(holdout['train_months'])} months)   "
          f"holdout {', '.join(holdout['test_months'])}")
    print(f"   {'model':44s} {'MAPE%':>8} {'RMSE':>12} {'R2':>8}")
    for k in F.MODEL_KEYS:
        m = holdout["models"][k]
        print(f"   {m['label']:44s} {m['mape_pct']:8.2f} {m['rmse']:12.1f} {m['r2']:8.3f}")
    print(f"   rolling origin, {rolling['n_origins']} origins, h=1..3, "
          f"{rolling['models']['linreg_dummies']['n']} forecast points")
    for k in F.MODEL_KEYS:
        m = rolling["models"][k]
        print(f"   {m['label']:44s} {m['mape_pct']:8.2f} {m['rmse']:12.1f} {m['r2']:8.3f}")

    reg = holdout["models"]["linreg_dummies"]
    sn = holdout["models"]["seasonal_naive"]
    rreg = rolling["models"]["linreg_dummies"]
    rsn = rolling["models"]["seasonal_naive"]
    beats_fixed = reg["mape_pct"] < sn["mape_pct"]
    beats_rolling = rreg["mape_pct"] < rsn["mape_pct"]

    # -------------------------------------------------------------- 6. charts
    print("\n== 5. charts")
    chart_paths = [
        C.chart_monthly_revenue(series, CHART_DIR),
        C.chart_month_of_year(series, CHART_DIR),
        C.chart_forecast(series, holdout, CHART_DIR),
        C.chart_model_mape(holdout, rolling, CHART_DIR),
        C.chart_concentration(region_share, CHART_DIR),
        C.chart_product_pareto(
            clean.groupby("StockCode")["revenue"].sum().to_numpy(),
            len(top_codes), CHART_DIR),
    ]
    for p in chart_paths:
        print(f"   wrote {p}")

    # -------------------------------------------------------- 7. claim_check
    claim_notes = _claim_notes(led, prof, series, holdout, rolling, top12_share,
                               peak_q_share)

    # ------------------------------------------------------------- 8. workbook
    print("\n== 6. workbook")
    W.build(XLSX, fact, [str(p) for p in series.index], P.REGION_ORDER,
            top_codes, labels, series, holdout, rolling, prov, led.steps,
            claim_notes)
    ver = V.verify(XLSX, expected_pred=reg["pred"])
    for name, r in ver["checks"].items():
        print(f"   [{'PASS' if r['pass'] else 'FAIL'}] {name:34s} {r['detail']}")
    print(f"   {XLSX}  ({ver['bytes']:,} bytes)")

    # ------------------------------------------------------------ 9. headlines
    print("\n== 7. published numbers")
    emit("peak_quarter_revenue_share_pct", f"{peak_q_share:.2f}")
    emit("peak_quarter_window", peak_q_window)
    emit("peak_quarter_revenue_share_prior_year_pct", f"{peak_q_share_prior:.2f}")
    emit("peak_quarter_window_prior_year", peak_q_window_prior)
    emit("peak_to_trough_ratio", f"{peak_trough:.2f}")
    emit("peak_month", str(peak_month))
    emit("trough_month", str(trough_month))
    emit("peak_month_revenue_gbp", f"{float(series.max()):.2f}")
    emit("trough_month_revenue_gbp", f"{float(series.min()):.2f}")
    emit("total_revenue_gbp", f"{total_rev:.2f}")

    emit("holdout_mape_regression_pct", f"{reg['mape_pct']:.2f}")
    emit("holdout_mape_seasonal_naive_pct", f"{sn['mape_pct']:.2f}")
    emit("holdout_mape_fourier_pct", f"{holdout['models']['loglin_fourier']['mape_pct']:.2f}")
    emit("holdout_mape_naive_pct", f"{holdout['models']['naive']['mape_pct']:.2f}")
    emit("holdout_rmse_regression_gbp", f"{reg['rmse']:.2f}")
    emit("holdout_rmse_seasonal_naive_gbp", f"{sn['rmse']:.2f}")
    emit("holdout_r2_regression", f"{reg['r2']:.3f}")
    emit("holdout_r2_seasonal_naive", f"{sn['r2']:.3f}")
    emit("holdout_n_months", f"{reg['n']}")
    emit("forecast_accuracy_translation_pct", f"{100 - reg['mape_pct']:.2f}")

    emit("rolling_mape_regression_pct", f"{rreg['mape_pct']:.2f}")
    emit("rolling_mape_seasonal_naive_pct", f"{rsn['mape_pct']:.2f}")
    emit("rolling_r2_regression", f"{rreg['r2']:.3f}")
    emit("rolling_r2_seasonal_naive", f"{rsn['r2']:.3f}")
    emit("rolling_forecast_points", f"{rreg['n']}")
    emit("regression_beats_baseline_fixed_holdout", str(beats_fixed))
    emit("regression_beats_baseline_rolling", str(beats_rolling))

    emit("rows_raw", f"{led.rows_raw}")
    emit("rows_final", f"{led.rows_final}")
    emit("rows_dropped", f"{led.total_dropped}")
    emit("rows_dropped_pct", f"{led.total_dropped / led.rows_raw * 100:.2f}")
    emit("records_per_month_mean", f"{led.rows_final / len(series):.1f}")
    emit("cross_sheet_duplicate_rows", f"{led.steps[0]['rows_dropped']}")
    emit("cross_sheet_duplicate_invoices", f"{prof['invoices_present_in_both_sheets']}")
    emit("dec2010_revenue_deduped_gbp", f"{float(series[pd.Period('2010-12')]):.2f}")
    emit("dec2010_revenue_if_not_deduped_gbp", f"{ovl['dec2010_no_dedup_gbp']:.2f}")
    emit("dec2010_fake_yoy_growth_pct", f"{ovl['fake_yoy_growth_pct']:.2f}")
    emit("sep2011_vs_sep2010_growth_pct", f"{sep_growth:.2f}")
    emit("exact_duplicate_rows", f"{led.steps[1]['rows_dropped']}")
    emit("credit_note_rows_dropped", f"{led.steps[2]['rows_dropped']}")

    emit("complete_months", f"{len(series)}")
    emit("distinct_countries", f"{int(clean.Country.nunique())}")
    emit("distinct_products", f"{int(clean.StockCode.nunique())}")
    emit("derived_region_buckets", f"{len(P.REGION_ORDER)}")
    emit("top12_product_revenue_share_pct", f"{top12_share:.2f}")
    emit("products_for_half_of_revenue", f"{products_half}")
    emit("uk_revenue_share_pct", f"{region_share['United Kingdom']:.2f}")
    emit("rest_of_europe_revenue_share_pct", f"{region_share['Rest of Europe']:.2f}")
    emit("eire_revenue_share_pct", f"{region_share['Ireland (EIRE)']:.2f}")
    emit("rest_of_world_revenue_share_pct", f"{region_share['Rest of World']:.2f}")

    emit("excel_data_sheet_rows", f"{len(fact)}")
    emit("excel_workbook_bytes", f"{ver['bytes']}")
    emit("excel_workbook_sha256", P.sha256_of(XLSX))
    emit("excel_verification_passed", str(ver["ok"]))

    runtime = time.time() - t0
    print(f"\nrun_seconds = {runtime:.1f} "
          f"(not a HEADLINE; wall clock varies with the download cache)")

    # ------------------------------------------------------------ 10. findings
    findings = {
        "slug": "sales-forecast-excel",
        "generated_by": "analysis/run_analysis.py",
        "headline": {
            "number": f"{peak_q_share:.2f}",
            "units": "%",
            "sentence": (
                "September, October and November alone bring in "
                f"{peak_q_share:.1f} percent of this wholesaler's revenue in the "
                f"trailing twelve months ({peak_q_window}) - half as much again as an "
                f"evenly spread quarter would - and it is not a one-year artefact: the "
                f"same three months were {peak_q_share_prior:.1f} percent of the year "
                f"before ({peak_q_window_prior}). A one-line rule, 'this month equals "
                "the same month last year', predicts that peak quarter to within "
                f"{sn['mape_pct']:.1f} percent."),
        },
        "numbers": {k: v for k, v in HEADLINES},
        "provenance": {
            **{k: v for k, v in prov.items() if k != "local_path"},
            "rows_raw": led.rows_raw,
            "rows_final": led.rows_final,
            "rows_dropped": led.total_dropped,
            "drop_ledger": led.steps,
            "kept_deliberately": [
                "243,007 rows with a missing Customer ID - valid transactions, "
                "only customer-level work would need the ID.",
                "4,382 rows with a missing Description - the StockCode still "
                "identifies the product.",
            ],
        },
        "raw_profile": prof,
        "monthly_revenue_gbp": {str(k): round(float(v), 2) for k, v in series.items()},
        "region_revenue_share_pct": region_share,
        "top_products": [
            {"stock_code": c, "name": labels[c],
             "revenue_gbp": round(float(clean[clean.StockCode == c].revenue.sum()), 2)}
            for c in top_codes
        ],
        "forecast": {
            "design": {
                "series": "total monthly revenue, GBP",
                "n_months": len(series),
                "train_months": holdout["train_months"],
                "holdout_months": holdout["test_months"],
                "primary_model": "OLS revenue ~ trend + month-of-year dummies",
                "secondary_model": "OLS log(revenue) ~ trend + Fourier(2)",
                "baselines": ["naive", "seasonal naive"],
                "pre_declared": True,
            },
            "fixed_holdout": {k: {kk: vv for kk, vv in v.items() if kk != "pred"}
                              | {"pred": [round(x, 2) for x in v["pred"]]}
                              for k, v in holdout["models"].items()},
            "holdout_actual_gbp": [round(x, 2) for x in holdout["actual"]],
            "rolling_origin": {
                "n_origins": rolling["n_origins"],
                "horizon": F.HOLDOUT_MONTHS,
                "min_train_months": F.MIN_TRAIN_MONTHS,
                "models": rolling["models"],
            },
            "verdict": (
                "On the fixed 3-month holdout the regression edges the seasonal-naive "
                f"baseline ({reg['mape_pct']:.2f}% vs {sn['mape_pct']:.2f}% MAPE), but "
                "that is a 3-point comparison. On the 15-point rolling-origin backtest "
                f"the baseline wins ({rsn['mape_pct']:.2f}% vs {rreg['mape_pct']:.2f}%). "
                "The honest reading is that the regression does not reliably beat "
                "'same month last year' on this series."),
        },
        "claim_check": claim_notes,
        "excel": {
            "path": os.path.relpath(XLSX, ROOT),
            "bytes": ver["bytes"],
            "verification": ver["checks"],
            "verified_ok": ver["ok"],
            "pivottables": "none - openpyxl cannot write a pivotCache part; "
                           "SUMIFS over a tidy fact table is used instead",
        },
        "charts": [os.path.relpath(p, ROOT) for p in chart_paths],
        "caveats": [
            "24 complete months is the bare minimum for a seasonal forecast: each "
            "calendar month is observed exactly twice, so every seasonal coefficient "
            "rests on two data points.",
            "The two source worksheets overlap for 2010-12-01 to 2010-12-09. Analyses "
            "that concatenate them without deduplicating double-count 22,523 rows and "
            "report a false December 2010 spike.",
            "December 2011 is truncated on the 9th and is excluded; the series ends "
            "2011-11.",
            "'Region' is not in the data. The four geography buckets are ours, built "
            "from the 43-value free-text Country column.",
            "This is one UK online gift wholesaler in 2009-2011. Nothing here "
            "generalises to other retailers or to today.",
            "No LibreOffice or Excel is installed on the build machine, so the "
            "workbook is verified structurally (zip CRC, XML well-formedness, "
            "relationship resolution, openpyxl reload) rather than by opening it.",
        ],
    }
    out = os.path.join(RESULT_DIR, "findings.json")
    with open(out, "w") as fh:
        json.dump(findings, fh, indent=2, default=str)
    print(f"\nwrote {out}")

    fact.to_csv(os.path.join(RESULT_DIR, "monthly_region_product_facts.csv"), index=False)
    series.rename("revenue_gbp").to_frame().to_csv(
        os.path.join(RESULT_DIR, "monthly_revenue.csv"))
    rolling["table"].round(2).to_csv(
        os.path.join(RESULT_DIR, "rolling_origin_backtest.csv"), index=False)
    print(f"wrote {RESULT_DIR}/monthly_revenue.csv, "
          f"monthly_region_product_facts.csv, rolling_origin_backtest.csv")
    return 0 if ver["ok"] else 1


def _claim_notes(led, prof, series, holdout, rolling, top12_share, peak_q_share):
    reg = holdout["models"]["linreg_dummies"]
    sn = holdout["models"]["seasonal_naive"]
    rreg = rolling["models"]["linreg_dummies"]
    rsn = rolling["models"]["seasonal_naive"]
    per_month = led.rows_final / len(series)
    return [
        {
            "resume_claim": "15K+ monthly sales records",
            "verdict": "supported",
            "real_value": f"{per_month:,.0f} clean records per month "
                          f"({led.rows_final:,} over {len(series)} months)",
            "note": "Comfortably clears 15K. The claim understates the dataset by "
                    "roughly 2.7x, which is the good kind of error.",
        },
        {
            "resume_claim": "across 4 regions",
            "verdict": "contradicted",
            "real_value": f"{prof['distinct_countries']} countries, no region column",
            "note": "The file has a single free-text Country field. The four "
                    "geography buckets on the dashboard (UK / Ireland / Rest of "
                    "Europe / Rest of World) are defined in pipeline.py by us, not "
                    "read from the data. The bullet should say so.",
        },
        {
            "resume_claim": "and 12 products",
            "verdict": "contradicted",
            "real_value": f"4,893 distinct stock codes; the top 12 are only "
                          f"{top12_share:.2f}% of revenue",
            "note": "The dashboard does show 12 products, but they are the twelve "
                    "largest of nearly five thousand and they account for under a "
                    "tenth of turnover. Describing the catalogue as 12 products is "
                    "wrong by two orders of magnitude.",
        },
        {
            "resume_claim": "Used pivot tables, VLOOKUP, conditional formatting and charts",
            "verdict": "partially_supported",
            "real_value": "VLOOKUP, conditional formatting and native charts are in "
                          "the workbook. There are no PivotTables.",
            "note": "openpyxl cannot emit a pivotCache/pivotTable part, so the pivot "
                    "logic is done with SUMIFS over a tidy fact table - same "
                    "cross-tab, recalculates live, no manual refresh. Claiming "
                    "PivotTables would be false and is not claimed.",
        },
        {
            "resume_claim": "linear regression to forecast next-quarter sales with 93% accuracy",
            "verdict": "partially_supported",
            "real_value": f"MAPE {reg['mape_pct']:.2f}% on the held-out quarter "
                          f"(= {100 - reg['mape_pct']:.2f}% 'accuracy'), RMSE "
                          f"GBP {reg['rmse']:,.0f}, R2 {reg['r2']:.3f} on n=3 months",
            "note": "'93% accuracy' is not a defined regression metric. Translated to "
                    "MAPE, the number is roughly right - forecasts landed within about "
                    f"{reg['mape_pct']:.0f}% of actual on the held-out quarter. But the "
                    "claim is hollow without a baseline: a one-line seasonal-naive rule "
                    f"scores {sn['mape_pct']:.2f}%, and on a 15-point rolling-origin "
                    f"backtest the baseline actually wins ({rsn['mape_pct']:.2f}% vs "
                    f"{rreg['mape_pct']:.2f}%). The regression does not reliably beat "
                    "'same month last year'.",
        },
        {
            "resume_claim": "reducing inventory gaps by 18%",
            "verdict": "unverifiable",
            "real_value": "no inventory, stock-out or fulfilment field exists in this "
                          "dataset",
            "note": "A downstream business outcome that no public transaction file can "
                    "evidence. Kept off the site. The defensible inventory-relevant "
                    f"fact is the seasonality: {peak_q_share:.1f}% of the trailing "
                    "twelve months' revenue lands in September-November.",
        },
    ]


if __name__ == "__main__":
    raise SystemExit(main())
