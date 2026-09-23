"""
OHFS market data builder
========================

Turns a raw MLS sold export (one row per sale) into one small JSON file per
neighborhood page, for the OHFSChart() dashboard.

Two commands:

  python pipeline/build_market_data.py inventory sold.csv
      Writes subdivision-inventory.csv: every MLS subdivision name (normalized),
      its raw spellings, and sales per year. Use it to fill in neighborhoods.csv.

  python pipeline/build_market_data.py build sold.csv
      Reads pipeline/neighborhoods.csv, writes data/<slug>.json (repo root) for
      each neighborhood, writes data/index.json (page path -> slug), and prints
      a report.

The raw MLS export stays on your computer. Never commit it: .gitignore blocks
*.csv outside pipeline/.

Requires: pandas  (pip install pandas)
"""

import json
import sys
from datetime import date
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

# Property subtypes counted as neighborhood home sales
INCLUDE_SUBTYPES = {
    "Single Family Residence",
    "Townhouse",
    "Villa/Patio Home",
    "Condominium",
}

# Sales below this are treated as data errors or non-arm's-length and dropped
MIN_SOLD_PRICE = 50_000

# Years shown on the charts
YEARS = [2022, 2023, 2024, 2025]

SOURCE_LINE = "Source: MLS closed sales, compiled by Ryan Renner."

HERE = Path(__file__).parent
NEIGHBORHOODS_CSV = HERE / "neighborhoods.csv"
DATA_DIR = HERE.parent / "data"   # served by jsDelivr next to ohfs-chart-config.js


# ---------------------------------------------------------------------------
# Load and clean
# ---------------------------------------------------------------------------

def money(series):
    return pd.to_numeric(series.str.replace(r"[\$,\s]", "", regex=True), errors="coerce")


def normalize_name(series):
    return series.fillna("").str.strip().str.lower().str.replace(r"\s+", " ", regex=True)


def load_sales(csv_path):
    raw = pd.read_csv(csv_path, dtype=str)
    report = {"raw_rows": len(raw)}

    df = raw.drop_duplicates()
    report["exact_duplicates_removed"] = len(raw) - len(df)

    before = len(df)
    df = df.drop_duplicates(subset=["MLS #"], keep="last")
    report["mls_number_duplicates_removed"] = before - len(df)

    df = df.assign(
        sold_price=money(df["Sold Price"]),
        close_date=pd.to_datetime(df["Closing Date"], format="%m/%d/%y", errors="coerce"),
        subdivision_key=normalize_name(df["Subdivision"]),
    )
    df["year"] = df["close_date"].dt.year

    before = len(df)
    df = df[df["Property Subtype"].isin(INCLUDE_SUBTYPES)]
    report["excluded_by_subtype"] = before - len(df)

    before = len(df)
    df = df[df["sold_price"] >= MIN_SOLD_PRICE]
    report["excluded_below_min_price"] = before - len(df)

    before = len(df)
    df = df[df["year"].isin(YEARS) & (df["subdivision_key"] != "")]
    report["excluded_bad_date_or_no_subdivision"] = before - len(df)

    report["clean_rows"] = len(df)
    return df, report


# ---------------------------------------------------------------------------
# inventory
# ---------------------------------------------------------------------------

def cmd_inventory(csv_path):
    df, report = load_sales(csv_path)
    counts = df.pivot_table(index="subdivision_key", columns="year", values="sold_price",
                            aggfunc="count", fill_value=0)
    counts.columns = [f"sales_{y}" for y in counts.columns]
    counts["sales_total"] = counts.sum(axis=1)
    spellings = df.groupby("subdivision_key")["Subdivision"].agg(
        lambda s: " | ".join(sorted(set(s.str.strip()))))
    out = counts.join(spellings.rename("raw_spellings")).sort_values("sales_total", ascending=False)
    out.index.name = "subdivision_key"
    path = HERE / "subdivision-inventory.csv"
    out.to_csv(path)
    print_report(report)
    print(f"\nWrote {path.name}: {len(out)} subdivision names")


# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------

def load_neighborhoods():
    nb = pd.read_csv(NEIGHBORHOODS_CSV, dtype=str).fillna("")
    required = {"slug", "name", "page_path", "mls_subdivisions"}
    missing = required - set(nb.columns)
    if missing:
        sys.exit(f"neighborhoods.csv is missing columns: {', '.join(sorted(missing))}")
    return nb


def summarize(sales):
    years, sold, avg, low, high, median = [], [], [], [], [], []
    for y in YEARS:
        s = sales.loc[sales["year"] == y, "sold_price"]
        years.append(str(y))
        sold.append(int(s.count()))
        avg.append(int(round(s.mean())) if len(s) else None)
        low.append(int(s.min()) if len(s) else None)
        high.append(int(s.max()) if len(s) else None)
        median.append(int(round(s.median())) if len(s) else None)
    return {"years": years, "sold": sold, "avgPrice": avg, "lowPrice": low,
            "highPrice": high, "medianPrice": median}


def cmd_build(csv_path):
    df, report = load_sales(csv_path)
    nb = load_neighborhoods()
    DATA_DIR.mkdir(exist_ok=True)

    known_keys = set(df["subdivision_key"].unique())
    index, warnings = {}, []

    for row in nb.itertuples(index=False):
        keys = [k.strip().lower() for k in row.mls_subdivisions.split("|") if k.strip()]
        unknown = [k for k in keys if k not in known_keys]
        if unknown:
            warnings.append(f"{row.slug}: no sales found for {', '.join(unknown)}")

        stats = summarize(df[df["subdivision_key"].isin(keys)])
        payload = {
            "slug": row.slug,
            "name": row.name,
            "updated": date.today().isoformat(),
            "source": SOURCE_LINE,
            **stats,
        }
        if 0 in stats["sold"]:
            warnings.append(f"{row.slug}: a year has zero sales {stats['sold']}")

        (DATA_DIR / f"{row.slug}.json").write_text(json.dumps(payload, indent=2))
        index[row.page_path.strip()] = row.slug

    (DATA_DIR / "index.json").write_text(json.dumps(index, indent=2, sort_keys=True))

    print_report(report)
    print(f"\nWrote {len(nb)} neighborhood files + data/index.json")
    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print("  - " + w)


def print_report(r):
    print("Cleaning report")
    for k, v in r.items():
        print(f"  {k.replace('_', ' ')}: {v:,}")


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"inventory", "build"}:
        sys.exit(__doc__)
    {"inventory": cmd_inventory, "build": cmd_build}[sys.argv[1]](sys.argv[2])
