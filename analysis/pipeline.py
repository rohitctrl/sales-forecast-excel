"""
Download, load, profile and clean the UCI Online Retail II dataset.

Source: UCI Machine Learning Repository, dataset 502 "Online Retail II"
        https://archive.ics.uci.edu/dataset/502/online+retail+ii
Direct: https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip

Every row dropped is accounted for in the returned drop ledger.
"""

from __future__ import annotations

import hashlib
import io
import os
import zipfile
from dataclasses import dataclass, field

import pandas as pd

DATA_URL = "https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip"
ZIP_NAME = "online_retail_II.zip"
XLSX_NAME = "online_retail_II.xlsx"
PARQUET_NAME = "online_retail_II_raw.parquet"

# Stock codes that are not products: postage, manual adjustments, bank charges,
# test rows, gift vouchers, Amazon fees, sample/carriage codes.
ADMIN_CODES = {
    "POST", "DOT", "M", "C2", "D", "S", "B", "BANK CHARGES", "ADJUST",
    "ADJUST2", "AMAZONFEE", "PADS", "CRUK", "SP1002",
}
ADMIN_PREFIXES = ("TEST", "GIFT_")

# The two worksheets overlap: sheet "Year 2009-2010" runs to 2010-12-09 and
# sheet "Year 2010-2011" starts at 2010-12-01. The nine-day overlap is the same
# transactions recorded twice. We keep the sheet-1 copy.
OVERLAP_CUTOFF = pd.Timestamp("2010-12-10")
OVERLAP_SHEET = "Year 2010-2011"

# Final month in the file is truncated at 2011-12-09, so it is not a complete
# month and cannot go into a monthly series.
LAST_COMPLETE_MONTH = pd.Period("2011-11", freq="M")

BUSINESS_KEY = ["Invoice", "StockCode", "Quantity", "Price", "InvoiceDate", "Country"]

# Derived geography buckets. THESE ARE OURS, NOT THE DATA'S.
# The raw file has a single free-text `Country` column with 43 distinct values
# and no region field of any kind.
UK = {"United Kingdom"}
EIRE = {"EIRE"}
REST_OF_EUROPE = {
    "Austria", "Belgium", "Channel Islands", "Cyprus", "Czech Republic",
    "Denmark", "European Community", "Finland", "France", "Germany", "Greece",
    "Iceland", "Italy", "Lithuania", "Malta", "Netherlands", "Norway",
    "Poland", "Portugal", "Spain", "Sweden", "Switzerland",
}
# Everything else (Australia, Bahrain, Bermuda, Brazil, Canada, Hong Kong,
# Israel, Japan, Korea, Lebanon, Nigeria, RSA, Saudi Arabia, Singapore,
# Thailand, USA, United Arab Emirates, West Indies, Unspecified) -> Rest of World.

REGION_ORDER = ["United Kingdom", "Ireland (EIRE)", "Rest of Europe", "Rest of World"]

N_TOP_PRODUCTS = 12


@dataclass
class DropLedger:
    rows_raw: int = 0
    steps: list = field(default_factory=list)

    def record(self, name: str, dropped: int, remaining: int, why: str):
        self.steps.append(
            {"step": name, "rows_dropped": int(dropped),
             "rows_remaining": int(remaining), "why": why}
        )

    @property
    def rows_final(self) -> int:
        return self.steps[-1]["rows_remaining"] if self.steps else self.rows_raw

    @property
    def total_dropped(self) -> int:
        return self.rows_raw - self.rows_final


def sha256_of(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ensure_raw(raw_dir: str) -> dict:
    """Download the zip if missing. Return provenance facts."""
    os.makedirs(raw_dir, exist_ok=True)
    zip_path = os.path.join(raw_dir, ZIP_NAME)
    if not os.path.exists(zip_path):
        import urllib.request
        req = urllib.request.Request(DATA_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=600) as resp:
            payload = resp.read()
        if payload[:2] != b"PK":
            raise RuntimeError(
                f"Downloaded file is not a zip archive (first bytes: {payload[:16]!r}). "
                "The source probably returned an HTML error page."
            )
        with open(zip_path, "wb") as fh:
            fh.write(payload)

    with open(zip_path, "rb") as fh:
        head = fh.read(2)
    if head != b"PK":
        raise RuntimeError("Cached raw file is not a zip archive; delete data/raw and re-run.")

    return {
        "dataset_name": "UCI Online Retail II",
        "source_url": DATA_URL,
        "landing_page": "https://archive.ics.uci.edu/dataset/502/online+retail+ii",
        "local_path": zip_path,
        "sha256": sha256_of(zip_path),
        "bytes": os.path.getsize(zip_path),
    }


def load_raw(raw_dir: str) -> pd.DataFrame:
    """Read both worksheets out of the zipped xlsx. Cached as parquet."""
    pq = os.path.join(raw_dir, PARQUET_NAME)
    if os.path.exists(pq):
        return pd.read_parquet(pq)

    zip_path = os.path.join(raw_dir, ZIP_NAME)
    with zipfile.ZipFile(zip_path) as zf:
        with zf.open(XLSX_NAME) as fh:
            blob = fh.read()
    xl = pd.ExcelFile(io.BytesIO(blob))
    frames = [xl.parse(s).assign(source_sheet=s) for s in xl.sheet_names]
    df = pd.concat(frames, ignore_index=True)
    for col in ["Invoice", "StockCode", "Description", "Country", "source_sheet"]:
        df[col] = df[col].astype("string")
    df.to_parquet(pq)
    return df


def profile_raw(df: pd.DataFrame) -> dict:
    sc = df["StockCode"].str.upper()
    s1 = df[df.source_sheet == "Year 2009-2010"]
    s2 = df[df.source_sheet == "Year 2010-2011"]
    return {
        "rows": int(len(df)),
        "columns": list(df.columns),
        "sheets": sorted(df.source_sheet.unique().tolist()),
        "date_min": str(df.InvoiceDate.min()),
        "date_max": str(df.InvoiceDate.max()),
        "null_description": int(df.Description.isna().sum()),
        "null_customer_id": int(df["Customer ID"].isna().sum()),
        "distinct_countries": int(df.Country.nunique()),
        "distinct_stockcodes": int(df.StockCode.nunique()),
        "negative_quantity_rows": int((df.Quantity < 0).sum()),
        "zero_quantity_rows": int((df.Quantity == 0).sum()),
        "nonpositive_price_rows": int((df.Price <= 0).sum()),
        "credit_note_rows": int(df.Invoice.str.upper().str.startswith("C").sum()),
        "admin_code_rows": int(
            (sc.isin(ADMIN_CODES) | sc.str.startswith(ADMIN_PREFIXES)).sum()
        ),
        "invoices_present_in_both_sheets": int(len(set(s1.Invoice) & set(s2.Invoice))),
        "overlap_window_rows_sheet1": int((s1.InvoiceDate >= "2010-12-01").sum()),
        "overlap_window_rows_sheet2": int((s2.InvoiceDate < OVERLAP_CUTOFF).sum()),
    }


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, DropLedger]:
    led = DropLedger(rows_raw=len(df))
    n = len(df)

    # 1. Cross-sheet overlap. The two worksheets both contain 2010-12-01..09.
    m = (df.source_sheet == OVERLAP_SHEET) & (df.InvoiceDate < OVERLAP_CUTOFF)
    df = df[~m]
    led.record(
        "cross_sheet_overlap", n - len(df), len(df),
        "Sheets 'Year 2009-2010' and 'Year 2010-2011' both cover 2010-12-01 to "
        "2010-12-09. Kept the sheet-1 copy, dropped the sheet-2 duplicate.",
    )
    n = len(df)

    # 2. Exact duplicate transaction lines within a sheet.
    df = df.drop_duplicates(subset=BUSINESS_KEY, keep="first")
    led.record(
        "exact_duplicate_lines", n - len(df), len(df),
        "Identical Invoice+StockCode+Quantity+Price+timestamp+Country rows. "
        "Same line recorded twice; keeping both would double-count revenue.",
    )
    n = len(df)

    # 3. Credit notes / cancellations (Invoice prefixed 'C').
    df = df[~df.Invoice.str.upper().str.startswith("C")]
    led.record(
        "credit_notes", n - len(df), len(df),
        "Invoice numbers starting with 'C' are cancellations/returns with "
        "negative quantities. Excluded so the series measures gross sales.",
    )
    n = len(df)

    # 4. Non-product administrative stock codes.
    sc = df["StockCode"].str.upper()
    df = df[~(sc.isin(ADMIN_CODES) | sc.str.startswith(ADMIN_PREFIXES))]
    led.record(
        "admin_stock_codes", n - len(df), len(df),
        "Postage (POST/DOT), manual adjustments (M/ADJUST), bank charges, "
        "samples, Amazon fees, gift vouchers and TEST rows are not product sales.",
    )
    n = len(df)

    # 5. Remaining non-positive quantities (returns not booked as credit notes).
    df = df[df.Quantity > 0]
    led.record(
        "nonpositive_quantity", n - len(df), len(df),
        "Quantity <= 0 outside the credit-note set: write-offs and stock "
        "corrections, not sales.",
    )
    n = len(df)

    # 6. Non-positive prices (zero-priced giveaways / data entry errors).
    df = df[df.Price > 0]
    led.record(
        "nonpositive_price", n - len(df), len(df),
        "Price <= 0 lines produce zero or negative revenue; they are freebies "
        "and entry errors, not sales.",
    )
    n = len(df)

    # 7. Truncated final month.
    df = df.assign(month=df.InvoiceDate.dt.to_period("M"))
    df = df[df.month <= LAST_COMPLETE_MONTH]
    led.record(
        "truncated_final_month", n - len(df), len(df),
        "The file stops on 2011-12-09, so December 2011 is a part-month and "
        "would read as a 58% collapse in a monthly series.",
    )

    df = df.assign(revenue=df.Quantity * df.Price)
    df = df.assign(region=df.Country.map(_region_of))
    return df.reset_index(drop=True), led


def _region_of(country: str) -> str:
    if country in UK:
        return "United Kingdom"
    if country in EIRE:
        return "Ireland (EIRE)"
    if country in REST_OF_EUROPE:
        return "Rest of Europe"
    return "Rest of World"


def overlap_impact(raw: pd.DataFrame) -> dict:
    """
    Quantify what the cross-sheet overlap does if you concatenate the two
    worksheets and clean them without deduplicating on the transaction key.
    Computed, never asserted.
    """
    d = raw.copy()
    d = d[~d.Invoice.str.upper().str.startswith("C")]
    sc = d["StockCode"].str.upper()
    d = d[~(sc.isin(ADMIN_CODES) | sc.str.startswith(ADMIN_PREFIXES))]
    d = d[(d.Quantity > 0) & (d.Price > 0)]
    d = d.assign(month=d.InvoiceDate.dt.to_period("M"),
                 revenue=d.Quantity * d.Price)
    dec10 = pd.Period("2010-12", freq="M")
    dec09 = pd.Period("2009-12", freq="M")
    naive_dec10 = float(d.loc[d.month == dec10, "revenue"].sum())
    naive_dec09 = float(d.loc[d.month == dec09, "revenue"].sum())
    return {"dec2010_no_dedup_gbp": naive_dec10,
            "dec2009_no_dedup_gbp": naive_dec09,
            "fake_yoy_growth_pct": (naive_dec10 / naive_dec09 - 1) * 100}


def monthly_series(df: pd.DataFrame) -> pd.Series:
    s = df.groupby("month")["revenue"].sum().sort_index()
    return s


def top_products(df: pd.DataFrame, n: int = N_TOP_PRODUCTS) -> list[str]:
    rev = df.groupby("StockCode")["revenue"].sum()
    rev = rev.sort_values(ascending=False, kind="mergesort")
    return rev.index[:n].tolist()


def product_labels(df: pd.DataFrame, codes: list[str]) -> dict:
    """Most frequent non-null description per stock code, deterministic."""
    out = {}
    sub = df[df.StockCode.isin(codes)].dropna(subset=["Description"])
    for code, grp in sub.groupby("StockCode"):
        counts = grp.Description.str.strip().value_counts()
        best = counts.sort_index(kind="mergesort").sort_values(
            ascending=False, kind="mergesort").index[0]
        out[code] = best
    return {c: out.get(c, c) for c in codes}


def fact_table(df: pd.DataFrame, top_codes: list[str], labels: dict) -> pd.DataFrame:
    """month x region x product-group revenue + units. This is the Excel Data sheet."""
    d = df.copy()
    d["product"] = d.StockCode.where(
        d.StockCode.isin(top_codes), other="ALL OTHER PRODUCTS"
    )
    d["product_name"] = d["product"].map(
        lambda c: labels.get(c, "All other products (4,884 SKUs)")
        if c != "ALL OTHER PRODUCTS" else "All other products"
    )
    g = (
        d.groupby(["month", "region", "product", "product_name"], observed=True)
        .agg(revenue=("revenue", "sum"),
             units=("Quantity", "sum"),
             orders=("Invoice", "nunique"))
        .reset_index()
    )
    g["month"] = g["month"].astype(str)
    g = g.sort_values(["month", "region", "product"], kind="mergesort").reset_index(drop=True)
    return g
