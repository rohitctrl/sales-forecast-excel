"""House-style SVG charts. figsize 4.33x2.53, #1f2cd1 primary, #b9b6ac secondary,
transparent background, no titles, minimal ink. These sit on light #eceae2 plates."""

from __future__ import annotations

import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

BLUE = "#1f2cd1"
GREY = "#b9b6ac"
INK = "#141414"
FIGSIZE = (4.33, 2.53)

plt.rcParams.update({
    "font.size": 7,
    "axes.edgecolor": INK,
    "axes.labelcolor": INK,
    "text.color": INK,
    "xtick.color": INK,
    "ytick.color": INK,
    "axes.linewidth": 0.7,
    "xtick.major.width": 0.7,
    "ytick.major.width": 0.7,
    "svg.fonttype": "none",
})

MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _finish(fig, ax, path):
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    fig.tight_layout(pad=0.3)
    fig.savefig(path, transparent=True, format="svg")
    plt.close(fig)


def chart_monthly_revenue(series, out_dir) -> str:
    """24 months of revenue; the Sep-Nov peak window called out in blue."""
    path = os.path.join(out_dir, "monthly-revenue.svg")
    fig, ax = plt.subplots(figsize=FIGSIZE)
    x = np.arange(len(series))
    y = series.to_numpy() / 1e6
    peak = np.array([p.month in (9, 10, 11) for p in series.index])
    ax.plot(x, y, color=GREY, lw=1.2, zorder=1)
    ax.scatter(x[~peak], y[~peak], s=9, color=GREY, zorder=2)
    ax.scatter(x[peak], y[peak], s=16, color=BLUE, zorder=3)
    for i in np.where(peak)[0]:
        ax.plot([i, i], [0, y[i]], color=BLUE, lw=0.8, alpha=0.25, zorder=0)
    ticks = [i for i, p in enumerate(series.index) if p.month in (1, 7)]
    ax.set_xticks(ticks)
    ax.set_xticklabels([f"{MONTH_ABBR[series.index[i].month - 1]}\n{series.index[i].year}"
                        for i in ticks])
    ax.set_ylabel("Revenue (GBP m)")
    ax.set_ylim(0, y.max() * 1.12)
    ax.margins(x=0.02)
    _finish(fig, ax, path)
    return path


def chart_month_of_year(series, out_dir) -> str:
    """Mean revenue by calendar month. Sep-Nov in blue, the rest warm grey."""
    path = os.path.join(out_dir, "month-of-year.svg")
    means = [float(np.mean([v for p, v in series.items() if p.month == m]))
             for m in range(1, 13)]
    fig, ax = plt.subplots(figsize=FIGSIZE)
    colors = [BLUE if m in (9, 10, 11) else GREY for m in range(1, 13)]
    ax.bar(range(12), [v / 1e6 for v in means], color=colors, width=0.72)
    overall = float(np.mean(series.to_numpy())) / 1e6
    ax.axhline(overall, color=INK, lw=0.7, ls=(0, (3, 2)))
    ax.text(11.4, overall * 1.03, "average month", ha="right", va="bottom", fontsize=6)
    ax.set_xticks(range(12))
    ax.set_xticklabels(MONTH_ABBR)
    ax.set_ylabel("Mean revenue (GBP m)")
    _finish(fig, ax, path)
    return path


def chart_forecast(series, holdout, out_dir) -> str:
    """
    The held-out quarter, month by month: what actually happened against what
    each model said would happen, with the absolute percentage error on each
    forecast bar.
    """
    path = os.path.join(out_dir, "forecast-holdout.svg")
    labels = [f"{MONTH_ABBR[int(m.split('-')[1]) - 1]} {m.split('-')[0]}"
              for m in holdout["test_months"]]
    actual = np.array(holdout["actual"], float) / 1e6
    reg = np.array(holdout["models"]["linreg_dummies"]["pred"], float) / 1e6
    sn = np.array(holdout["models"]["seasonal_naive"]["pred"], float) / 1e6

    x = np.arange(len(labels))
    w = 0.26
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.bar(x - w, actual, w, color=INK, label="Actual")
    ax.bar(x, reg, w, color=BLUE, label="Linear regression")
    ax.bar(x + w, sn, w, color=GREY, label="Seasonal naive")
    for i in range(len(labels)):
        ax.text(x[i], reg[i] + 0.03, f"{abs(reg[i]-actual[i])/actual[i]*100:.1f}%",
                ha="center", fontsize=6, color=BLUE)
        ax.text(x[i] + w, sn[i] + 0.03, f"{abs(sn[i]-actual[i])/actual[i]*100:.1f}%",
                ha="center", fontsize=6, color="#6f6a5e")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel("Revenue (GBP m)")
    ax.set_ylim(0, max(actual.max(), reg.max(), sn.max()) * 1.30)
    ax.legend(frameon=False, fontsize=6, loc="upper left", ncol=1,
              labelspacing=0.25, borderpad=0.1, handlelength=1.4)
    _finish(fig, ax, path)
    return path


def chart_model_mape(holdout, rolling, out_dir) -> str:
    """MAPE by model on the fixed holdout and on the rolling-origin backtest."""
    path = os.path.join(out_dir, "model-mape.svg")
    # The plain naive baseline (MAPE ~38% / ~20%) is reported in the README and
    # findings.json but left off the chart: at this scale it flattens the
    # comparison that actually matters.
    keys = ["linreg_dummies", "seasonal_naive", "loglin_fourier"]
    labels = ["Linear regression\n(trend + month)", "Seasonal naive\n(baseline)",
              "Log-linear\n+ Fourier"]
    a = [holdout["models"][k]["mape_pct"] for k in keys]
    b = [rolling["models"][k]["mape_pct"] for k in keys]
    yy = np.arange(len(keys))
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.barh(yy - 0.19, a, height=0.36, color=BLUE, label="3-month holdout")
    ax.barh(yy + 0.19, b, height=0.36, color=GREY, label="Rolling origin (n=15)")
    for i, (va, vb) in enumerate(zip(a, b)):
        ax.text(va + 0.5, i - 0.19, f"{va:.1f}", va="center", fontsize=6)
        ax.text(vb + 0.5, i + 0.19, f"{vb:.1f}", va="center", fontsize=6)
    ax.set_yticks(yy)
    ax.set_yticklabels(labels, fontsize=6)
    ax.invert_yaxis()
    ax.set_xlabel("MAPE (%, lower is better)")
    ax.set_xlim(0, max(a + b) * 1.30)
    ax.legend(frameon=False, fontsize=6, loc="upper right", labelspacing=0.25,
              borderpad=0.1, handlelength=1.4)
    fig.subplots_adjust(left=0.30)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    fig.savefig(path, transparent=True, format="svg", bbox_inches="tight",
                pad_inches=0.04)
    plt.close(fig)
    return path


def chart_concentration(region_share, out_dir) -> str:
    """Revenue by derived geography bucket, largest first."""
    path = os.path.join(out_dir, "revenue-by-region.svg")
    items = sorted(region_share.items(), key=lambda kv: (-kv[1], kv[0]))
    names = [k for k, _ in items]
    vals = [v for _, v in items]
    fig, ax = plt.subplots(figsize=FIGSIZE)
    colors = [BLUE] + [GREY] * (len(names) - 1)
    ax.bar(range(len(names)), vals, color=colors, width=0.6)
    for i, v in enumerate(vals):
        ax.text(i, v + 2.0, f"{v:.1f}%", ha="center", fontsize=6.5)
    ax.set_xticks(range(len(names)))
    ax.set_xticklabels([n.replace(" ", "\n", 1) for n in names], fontsize=6)
    ax.set_ylabel("Share of revenue (%)")
    ax.set_ylim(0, 100)
    _finish(fig, ax, path)
    return path


def chart_product_pareto(product_revenue, top_n, out_dir) -> str:
    """
    Cumulative revenue share against product rank, with the top-12 point called
    out. This is the evidence against the "12 products" claim: the catalogue is
    long-tailed, not concentrated.
    """
    path = os.path.join(out_dir, "product-pareto.svg")
    rev = np.sort(np.asarray(product_revenue, float))[::-1]
    cum = np.cumsum(rev) / rev.sum() * 100
    rank = np.arange(1, len(rev) + 1)
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.plot(rank, cum, color=BLUE, lw=1.4)
    ax.axhline(50, color=GREY, lw=0.7, ls=(0, (3, 2)))
    half = int(np.searchsorted(cum, 50) + 1)
    ax.plot([half, half], [0, 50], color=GREY, lw=0.7, ls=(0, (3, 2)))
    ax.text(half + 90, 44, f"{half:,} products = half of revenue", fontsize=6)
    ax.scatter([top_n], [cum[top_n - 1]], s=18, color=INK, zorder=3)
    ax.annotate(f"top {top_n} products\n= {cum[top_n-1]:.1f}% of revenue",
                xy=(top_n, cum[top_n - 1]), xytext=(len(rev) * 0.16, 8),
                fontsize=6, arrowprops=dict(arrowstyle="-", lw=0.6, color=INK))
    ax.set_xlabel("Products, ranked by revenue")
    ax.set_ylabel("Cumulative revenue (%)")
    ax.set_xlim(0, len(rev))
    ax.set_ylim(0, 101)
    _finish(fig, ax, path)
    return path
