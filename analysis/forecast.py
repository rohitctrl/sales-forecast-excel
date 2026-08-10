"""
Forecast models and honest holdout evaluation.

Design decisions were fixed BEFORE any holdout number was looked at:

  * Series      : total monthly revenue, 24 complete months (2009-12 .. 2011-11).
  * Holdout     : the final 3 months = "next quarter". Train on the first 21.
  * PRIMARY     : OLS  revenue ~ trend + month-of-year dummies.
                  This is the literal reading of "applied linear regression".
  * SECONDARY   : OLS  log(revenue) ~ trend + 2-harmonic Fourier seasonality.
                  A genuinely different functional form, far fewer parameters.
  * BASELINE 1  : naive        - next month = last observed month.
  * BASELINE 2  : seasonal naive - next month = same month one year earlier.
  * Metrics     : MAPE, RMSE, R^2, all computed on the HOLDOUT only.
  * Robustness  : expanding-window rolling-origin backtest, h = 1..3.

A model only earns the word "accurate" if it beats seasonal naive.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

HOLDOUT_MONTHS = 3
MIN_TRAIN_MONTHS = 18  # every calendar month needs >= 1 observation for dummies


# ----------------------------------------------------------------- metrics

def mape(actual: np.ndarray, pred: np.ndarray) -> float:
    return float(np.mean(np.abs((actual - pred) / actual)) * 100.0)


def rmse(actual: np.ndarray, pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((actual - pred) ** 2)))


def r2(actual: np.ndarray, pred: np.ndarray) -> float:
    sse = float(np.sum((actual - pred) ** 2))
    sst = float(np.sum((actual - np.mean(actual)) ** 2))
    return float(1.0 - sse / sst) if sst > 0 else float("nan")


def evaluate(actual, pred) -> dict:
    a, p = np.asarray(actual, float), np.asarray(pred, float)
    return {"mape_pct": mape(a, p), "rmse": rmse(a, p), "r2": r2(a, p), "n": int(len(a))}


# ------------------------------------------------------------ design matrices

def _dummy_design(t: np.ndarray, month_no: np.ndarray) -> np.ndarray:
    """[1, t, Feb..Dec indicators]. January is the reference month."""
    cols = [np.ones_like(t, dtype=float), t.astype(float)]
    for m in range(2, 13):
        cols.append((month_no == m).astype(float))
    return np.column_stack(cols)


def _fourier_design(t: np.ndarray, k: int = 2) -> np.ndarray:
    cols = [np.ones_like(t, dtype=float), t.astype(float)]
    for h in range(1, k + 1):
        cols.append(np.sin(2 * np.pi * h * t / 12.0))
        cols.append(np.cos(2 * np.pi * h * t / 12.0))
    return np.column_stack(cols)


def _ols(X: np.ndarray, y: np.ndarray) -> np.ndarray:
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    return beta


# ------------------------------------------------------------------- models

def fit_predict(series: pd.Series, n_train: int, horizon: int) -> dict:
    """
    Fit every model on series[:n_train] and predict the next `horizon` points.
    `series` is indexed by pandas Period[M].
    """
    y = series.to_numpy(dtype=float)
    months = np.array([p.month for p in series.index])
    t = np.arange(len(series), dtype=float)

    tr = slice(0, n_train)
    te = slice(n_train, n_train + horizon)
    out = {"n_train": n_train,
           "test_index": [str(p) for p in series.index[te]],
           "actual": y[te].tolist()}

    # PRIMARY: trend + month-of-year dummies
    Xtr = _dummy_design(t[tr], months[tr])
    beta = _ols(Xtr, y[tr])
    out["linreg_dummies"] = (_dummy_design(t[te], months[te]) @ beta).tolist()
    out["linreg_dummies_coef"] = beta.tolist()
    out["linreg_dummies_insample_fit"] = (Xtr @ beta).tolist()

    # SECONDARY: log-linear trend + Fourier(2)
    Ftr = _fourier_design(t[tr])
    fbeta = _ols(Ftr, np.log(y[tr]))
    out["loglin_fourier"] = np.exp(_fourier_design(t[te]) @ fbeta).tolist()
    out["loglin_fourier_coef"] = fbeta.tolist()
    out["loglin_fourier_insample_fit"] = np.exp(Ftr @ fbeta).tolist()

    # BASELINE: naive (carry the last observed value forward)
    out["naive"] = [float(y[n_train - 1])] * horizon

    # BASELINE: seasonal naive (same calendar month, one year earlier)
    sn = []
    for i in range(n_train, n_train + horizon):
        j = i - 12
        sn.append(float(y[j]) if j >= 0 else float("nan"))
    out["seasonal_naive"] = sn

    return out


MODEL_KEYS = ["linreg_dummies", "loglin_fourier", "seasonal_naive", "naive"]
MODEL_LABELS = {
    "linreg_dummies": "Linear regression (trend + month dummies)",
    "loglin_fourier": "Log-linear trend + Fourier(2)",
    "seasonal_naive": "Seasonal naive (same month last year)",
    "naive": "Naive (last month carried forward)",
}


def holdout_evaluation(series: pd.Series, horizon: int = HOLDOUT_MONTHS) -> dict:
    n_train = len(series) - horizon
    fp = fit_predict(series, n_train, horizon)
    actual = np.array(fp["actual"], float)
    res = {"train_months": [str(p) for p in series.index[:n_train]],
           "test_months": fp["test_index"],
           "actual": actual.tolist(),
           "models": {}}
    for k in MODEL_KEYS:
        pred = np.array(fp[k], float)
        res["models"][k] = {"label": MODEL_LABELS[k],
                            "pred": pred.tolist(),
                            **evaluate(actual, pred)}
    res["raw"] = fp
    return res


def rolling_origin(series: pd.Series, horizon: int = HOLDOUT_MONTHS,
                   min_train: int = MIN_TRAIN_MONTHS) -> dict:
    """Expanding window. Every forecast is strictly out of sample."""
    recs = []
    n = len(series)
    for n_train in range(min_train, n):
        h = min(horizon, n - n_train)
        fp = fit_predict(series, n_train, h)
        for k in MODEL_KEYS:
            for step, (a, p) in enumerate(zip(fp["actual"], fp[k]), start=1):
                recs.append({"origin": n_train, "h": step, "model": k,
                             "month": fp["test_index"][step - 1],
                             "actual": float(a), "pred": float(p)})
    df = pd.DataFrame(recs)
    out = {"n_origins": int(df.origin.nunique()),
           "origins": sorted(df.origin.unique().tolist()),
           "models": {}}
    for k in MODEL_KEYS:
        sub = df[df.model == k]
        out["models"][k] = {"label": MODEL_LABELS[k],
                            **evaluate(sub.actual.to_numpy(), sub.pred.to_numpy())}
    out["table"] = df
    return out
