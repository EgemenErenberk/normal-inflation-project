"""
Task 2.1 - Price loading pipeline.

Reads every daily CSV of the research repo (``InflationResearchStudy``) in place and
merges them into one long table: one row per date x source x product, with a
stable ``product_id``. The output is written as Parquet, one file per day, outside
both repos.

The selection and parsing rules are the ones of the official index
(``Inflations/Codes/turkey_inflation.py``): its helpers and constants are imported,
never copied or modified, so both stay in sync.

What this module does NOT do (on purpose):
  * modify or copy the raw CSVs (team rule: original data is never touched);
  * fill missing days (task 2.2, ``imputation.py``);
  * remove outliers (task 2.4) or convert units (task 2.5).

Command line (from the root of normal-inflation-project):

    python -m backend.app.pipeline.load_prices \
        --research-root ../InflationResearchStudy --out ../pipeline_output \
        --since 2026-10-01 --until 2026-11-16 --category 01 12

    # compare one day with the official loader of turkey_inflation.py
    python -m backend.app.pipeline.load_prices \
        --research-root ../InflationResearchStudy --out ../pipeline_output \
        --validate 2026-11-16

In Python:

    from backend.app.pipeline.load_prices import read_prices
    df = read_prices("../pipeline_output", since="2026-11-01", categories=["01"])

Specification: "Task 2.1 - Price loading pipeline: specification" (team doc).
"""
from __future__ import annotations

import argparse
import importlib
import json
import logging
import os
import re
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from types import ModuleType
from typing import Iterable

import pandas as pd

__version__ = "0.1.1"

logger = logging.getLogger("load_prices")

# --------------------------------------------------------------------------- #
# Output schema (see the specification, section "Output schema")
# --------------------------------------------------------------------------- #
PRICE_COLUMNS = [
    "date", "product_id", "price", "product_name", "store", "source_id",
    "category", "sector", "category_number", "sub_category_number",
    "in_index", "price_raw", "n_rows_merged", "source_file",
]
MANIFEST_COLUMNS = [
    "date", "source_id", "file", "status", "rows_read", "rows_kept", "rows_rejected",
    "detail",
]
REJECT_COLUMNS = ["date", "source_id", "file", "reason", "rows"]

# Manifest statuses
USED = "used"
IGNORED_SAME_DAY = "ignored_other_file_same_day"
IGNORED_HEADER = "ignored_no_name_or_price_column"
READ_ERROR = "read_error"
UNUSABLE_COLUMNS = "unusable_columns"

# Reject reasons
NO_NAME = "no_name"
EMPTY_PRICE = "empty_price"
NEGATIVE_PRICE = "negative_price"
ZERO_PRICE = "zero_price"
UNREADABLE_PRICE = "unreadable_price"
RENT_LISTING = "rent_listing"

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
MONTH_RE = re.compile(r"\d{4}-\d{2}")
CATEGORY_DIR_RE = re.compile(r"^\d{2}_")

TABLES = ("prices", "manifest", "rejects")


# --------------------------------------------------------------------------- #
# Official helpers
# --------------------------------------------------------------------------- #
def import_official(research_root: Path) -> ModuleType:
    """Import ``turkey_inflation`` from the research repo (read only)."""
    codes = Path(research_root) / "Inflations" / "Codes"
    if not (codes / "turkey_inflation.py").is_file():
        raise FileNotFoundError(
            f"turkey_inflation.py not found in {codes}. "
            "Check --research-root (it must point to the InflationResearchStudy clone)."
        )
    if str(codes) not in sys.path:
        sys.path.insert(0, str(codes))
    module = importlib.import_module("turkey_inflation")
    expected = Path(module.__file__).resolve().parent
    if expected != codes.resolve():
        raise ImportError(
            f"Another turkey_inflation module is already imported ({module.__file__})."
        )
    return module


# --------------------------------------------------------------------------- #
# Source discovery
# --------------------------------------------------------------------------- #
@dataclass
class Source:
    """One store folder (or one store inside a "flat" folder)."""

    source_id: str              # path from Datas/ to the store, e.g. "01_Food/A101"
    store: str                  # store name as used by the official loader
    category: str               # 2-digit COICOP group, e.g. "01"
    sector: str                 # label from _SECTOR_CONFIG or sub-folder name
    granularity: str            # "daily" or "monthly"
    in_index: bool              # used by the official index
    files: dict[str, list[Path]] = field(default_factory=dict)  # period -> candidates

    def period_date(self, period: str) -> date:
        return date.fromisoformat(period if self.granularity == "daily" else period + "-01")


def _is_under(path: Path, parents: Iterable[Path]) -> bool:
    return any(path == p or p in path.parents for p in parents)


def _add_file(src: Source, f: Path, unmatched: list[dict], data_root: Path) -> None:
    if src.granularity == "monthly":
        periods = list(dict.fromkeys(MONTH_RE.findall(f.name)))
    else:
        periods = list(dict.fromkeys(DATE_RE.findall(f.name)))
    valid = []
    for p in periods:
        try:
            date.fromisoformat(p if len(p) == 10 else p + "-01")
            valid.append(p)
        except ValueError:
            pass
    if not valid:
        unmatched.append({
            "source_id": src.source_id,
            "file": f.relative_to(data_root).as_posix(),
            "reason": "no YYYY-MM-DD date in the file name (ignored, as by the official index)",
        })
        return
    for p in valid:
        src.files.setdefault(p, []).append(f)


def discover_sources(
    data_root: Path, ti: ModuleType, categories: Iterable[str] | None = None
) -> tuple[list[Source], list[dict]]:
    """Index every source folder once and group its files by period.

    Sectors of ``_SECTOR_CONFIG`` follow the official layout; every other folder
    that directly contains CSVs becomes a source with ``in_index = False``.
    """
    data_root = Path(data_root)
    cats = {c.zfill(2) for c in categories} if categories else None
    skip_lower = {s.lower() for s in ti._SKIP_SUBDIRS}
    sources: list[Source] = []
    unmatched: list[dict] = []
    configured_dirs: list[Path] = []

    # 1. Sectors used by the official index
    for sector_name, (tuik_code, label, gran) in ti._SECTOR_CONFIG.items():
        sector_dir = data_root / sector_name
        if not sector_dir.is_dir():
            logger.warning("Configured sector folder not found: %s", sector_name)
            continue
        configured_dirs.append(sector_dir)
        if cats and tuik_code not in cats:
            continue
        if gran == "flat_daily":
            by_store: dict[str, Source] = {}
            for f in sorted(sector_dir.glob("*.csv")):
                if not f.is_file():
                    continue
                days = list(dict.fromkeys(DATE_RE.findall(f.name)))
                if not days:
                    unmatched.append({"source_id": sector_name,
                                      "file": f.relative_to(data_root).as_posix(),
                                      "reason": "no YYYY-MM-DD date in the file name"})
                    continue
                for d in days:
                    store = f.stem.rsplit(f"_{d}", 1)[0]
                    src = by_store.setdefault(store, Source(
                        source_id=f"{sector_name}/{store}", store=store, category=tuik_code,
                        sector=label, granularity="daily", in_index=True))
                    src.files.setdefault(d, []).append(f)
            sources.extend(by_store.values())
            continue
        granularity = "monthly" if gran == "monthly" else "daily"
        for store_dir in sorted(p for p in sector_dir.iterdir() if p.is_dir()):
            src = Source(
                source_id=store_dir.relative_to(data_root).as_posix(), store=store_dir.name,
                category=tuik_code, sector=label, granularity=granularity,
                in_index=store_dir.name not in ti._SKIP_STORES)
            for f in sorted(store_dir.rglob("*.csv")):
                if not f.is_file():
                    continue
                if any(p in ti._SKIP_SUBDIRS for p in f.relative_to(store_dir).parts[:-1]):
                    continue
                _add_file(src, f, unmatched, data_root)
            if src.files:
                sources.append(src)

    # 2. Every other folder that directly contains CSV files
    for cat_dir in sorted(p for p in data_root.iterdir() if p.is_dir()):
        if not CATEGORY_DIR_RE.match(cat_dir.name):
            continue
        if cats and cat_dir.name[:2] not in cats:
            continue
        for d in [cat_dir] + sorted(p for p in cat_dir.rglob("*") if p.is_dir()):
            rel = d.relative_to(data_root)
            if any(part.lower() in skip_lower for part in rel.parts):
                continue
            if _is_under(d, configured_dirs):
                continue
            csvs = sorted(f for f in d.glob("*.csv") if f.is_file())
            if not csvs:
                continue
            sector = rel.parts[1] if len(rel.parts) >= 3 else cat_dir.name[3:]
            src = Source(source_id=rel.as_posix(), store=d.name, category=cat_dir.name[:2],
                         sector=sector, granularity="daily", in_index=False)
            for f in csvs:
                _add_file(src, f, unmatched, data_root)
            if src.files:
                sources.append(src)

    return sources, unmatched


# --------------------------------------------------------------------------- #
# Reading one file
# --------------------------------------------------------------------------- #
def _classify_price(raw, ti: ModuleType) -> tuple[float | None, str | None]:
    """Same rule as the official loader, plus the reason when a price is left out."""
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None, EMPTY_PRICE
    s = str(raw).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None, EMPTY_PRICE
    if s.startswith("-"):
        return None, NEGATIVE_PRICE
    value = ti._parse_price(raw)
    if value is None:
        digits = re.sub(r"\D", "", s)
        if digits and set(digits) == {"0"}:
            return None, ZERO_PRICE
        return None, UNREADABLE_PRICE
    return value, None


def _find_column(columns: list[str], exact: str, aliases: Iterable[str]) -> str | None:
    """Official alias rule: exact name first, then case-insensitive aliases."""
    if exact in columns:
        return exact
    lower = {c.lower(): c for c in columns}
    for alias in aliases:
        if alias in lower:
            return lower[alias]
    return None


def read_source_file(
    path: Path, src: Source, ti: ModuleType
) -> tuple[pd.DataFrame | None, Counter, int, str | None]:
    """Read one CSV and return (rows, reject counts, rows read, error)."""
    try:
        df = pd.read_csv(path, dtype=str, on_bad_lines="skip")
    except Exception as exc:  # same tolerance as the official loader
        return None, Counter(), 0, f"{type(exc).__name__}: {str(exc).splitlines()[0][:200]}"
    df.columns = [str(c).lstrip("﻿").strip() for c in df.columns]
    cols = list(df.columns)
    name_col = _find_column(cols, "product_name", ("product name", "isim"))
    price_col = _find_column(cols, "price", ("product cost", "fiyat"))
    if name_col is None or price_col is None:
        return None, Counter(), len(df), "columns: name or price column not found after alias mapping"

    lower = {c.lower(): c for c in cols}
    cat_col = lower.get("category_number")
    sub_col = next((lower[c] for c in ("sub_category_number", "subcategory_number")
                    if c in lower), None)

    names = df[name_col]
    raw = df[price_col]
    name_ok = names.notna() & (names.astype(str).str.strip() != "")

    cache: dict = {}
    def classify(x):
        key = "__NA__" if (x is None or (isinstance(x, float) and pd.isna(x))) else x
        if key not in cache:
            cache[key] = _classify_price(x, ti)
        return cache[key]
    parsed = [classify(x) for x in raw.tolist()]
    prices = pd.Series([p[0] for p in parsed], index=df.index, dtype="float64")
    reasons = pd.Series([p[1] for p in parsed], index=df.index, dtype="object")

    rejects: Counter = Counter()
    rejects[NO_NAME] += int((~name_ok).sum())
    price_bad = name_ok & reasons.notna()
    for reason, n in reasons[price_bad].value_counts().items():
        rejects[reason] += int(n)
    keep = name_ok & reasons.isna()

    sub_values = (df[sub_col].fillna("").astype(str).str.strip() if sub_col
                  else pd.Series("", index=df.index))
    if src.category == "04":
        rent = keep & sub_values.str.startswith(ti._RENT_PREFIX)
        rejects[RENT_LISTING] += int(rent.sum())
        keep &= ~rent

    kept = pd.DataFrame({
        "product_name": names[keep].astype(str).str.strip(),
        "price": prices[keep],
        "price_raw": raw[keep].astype(str),
        "category_number": (df.loc[keep, cat_col].fillna("").astype(str).str.strip()
                            if cat_col else ""),
        "sub_category_number": sub_values[keep],
    })
    kept["canonical"] = kept["product_name"].map(ti._norm)
    empty_key = kept["canonical"] == ""
    if empty_key.any():
        rejects[NO_NAME] += int(empty_key.sum())
        kept = kept[~empty_key]

    rejects = Counter({k: v for k, v in rejects.items() if v})
    if kept.empty:
        return kept.iloc[0:0], rejects, len(df), None

    merged = (
        kept.groupby("canonical", sort=False)
        .agg(product_name=("product_name", "first"), price=("price", "mean"),
             price_raw=("price_raw", "first"), category_number=("category_number", "first"),
             sub_category_number=("sub_category_number", "first"),
             n_rows_merged=("price", "size"))
        .reset_index()
    )
    return merged, rejects, len(df), None


# --------------------------------------------------------------------------- #
# Build
# --------------------------------------------------------------------------- #
def _part_path(out: Path, table: str, day: date) -> Path:
    return Path(out) / table / f"date={day.isoformat()}" / "part-0.parquet"


def _write_parquet(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    df.to_parquet(tmp, index=False)
    os.replace(tmp, path)


def _empty(columns: list[str]) -> pd.DataFrame:
    return pd.DataFrame({c: pd.Series(dtype="object") for c in columns})


def _research_commit(research_root: Path) -> str | None:
    git = Path(research_root) / ".git"
    try:
        head = (git / "HEAD").read_text().strip()
        if not head.startswith("ref:"):
            return head
        ref = head.split(" ", 1)[1]
        ref_file = git / ref
        if ref_file.is_file():
            return ref_file.read_text().strip()
        packed = git / "packed-refs"
        if packed.is_file():
            for line in packed.read_text().splitlines():
                if line.endswith(" " + ref):
                    return line.split(" ", 1)[0]
    except OSError:
        pass
    return None


def process_day(
    day: date, items: list[tuple[Source, str]], ti: ModuleType, research_root: Path
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Build the prices, manifest and rejects tables of one day."""
    frames, manifest, rejects = [], [], []
    for src, period in items:
        chosen = None
        for f in src.files[period]:
            rel_file = f.relative_to(research_root).as_posix()
            row = {"date": day, "source_id": src.source_id, "file": rel_file,
                   "rows_read": 0, "rows_kept": 0, "rows_rejected": 0, "detail": ""}
            if chosen is not None:
                if ti._has_standard_header(f):
                    row["status"] = IGNORED_SAME_DAY
                    row["detail"] = f"kept {chosen.name}"
                else:
                    row["status"] = IGNORED_HEADER
                manifest.append(row)
                continue
            if not ti._has_standard_header(f):
                row["status"] = IGNORED_HEADER
                manifest.append(row)
                continue
            chosen = f
            data, rej, n_read, error = read_source_file(f, src, ti)
            row["rows_read"] = n_read
            if error is not None:
                row["status"] = UNUSABLE_COLUMNS if error.startswith("columns:") else READ_ERROR
                row["detail"] = error
                manifest.append(row)
                continue
            row["status"] = USED
            row["rows_kept"] = len(data)
            row["rows_rejected"] = sum(rej.values())
            manifest.append(row)
            for reason, n in rej.items():
                rejects.append({"date": day, "source_id": src.source_id, "file": rel_file,
                                "reason": reason, "rows": n})
            if data.empty:
                continue
            data.insert(0, "product_id", src.source_id + "::" + data.pop("canonical"))
            data["date"] = pd.Timestamp(day)
            data["store"] = src.store
            data["source_id"] = src.source_id
            data["category"] = src.category
            data["sector"] = src.sector
            data["in_index"] = src.in_index
            data["source_file"] = rel_file
            frames.append(data)

    prices = (pd.concat(frames, ignore_index=True)[PRICE_COLUMNS] if frames
              else _empty(PRICE_COLUMNS))
    if frames:
        prices["n_rows_merged"] = prices["n_rows_merged"].astype("int32")
        prices["in_index"] = prices["in_index"].astype(bool)
        prices["price"] = prices["price"].astype("float64")
        for c in ("product_id", "product_name", "store", "source_id", "category", "sector",
                  "category_number", "sub_category_number", "price_raw", "source_file"):
            prices[c] = prices[c].astype(str)
    man = pd.DataFrame(manifest, columns=MANIFEST_COLUMNS) if manifest else _empty(MANIFEST_COLUMNS)
    rej = pd.DataFrame(rejects, columns=REJECT_COLUMNS) if rejects else _empty(REJECT_COLUMNS)
    for t in (man, rej):
        if len(t):
            t["date"] = pd.to_datetime(t["date"])
    return prices, man, rej


def build(
    research_root: str | Path,
    out: str | Path,
    since: str | date | None = None,
    until: str | date | None = None,
    categories: Iterable[str] | None = None,
    overwrite: bool = False,
    refresh_last: int = 7,
    record_run: bool = True,
) -> dict:
    """Build (or update) the output folder. Returns a summary dict.

    ``refresh_last``: the last N days are always rebuilt, because some categories are
    pushed to the research repo several days late (default 7).
    ``record_run``: write ``run_info.json`` and append to ``run_history.jsonl``
    (False for the internal builds made by ``validate_against_official``).
    """
    t0 = time.time()
    research_root = Path(research_root).resolve()
    out = Path(out).resolve()
    if out == research_root or research_root in out.parents:
        raise ValueError("--out must be outside the research repo (its data is never modified).")
    data_root = research_root / "InflationItems" / "Datas"
    if not data_root.is_dir():
        raise FileNotFoundError(f"Data folder not found: {data_root}")
    since_d = date.fromisoformat(str(since)) if since else None
    until_d = date.fromisoformat(str(until)) if until else None

    ti = import_official(research_root)
    sources, unmatched = discover_sources(data_root, ti, categories)
    logger.info("%d sources found (%d used by the official index)",
                len(sources), sum(s.in_index for s in sources))

    by_day: dict[date, list[tuple[Source, str]]] = defaultdict(list)
    for src in sources:
        for period in src.files:
            d = src.period_date(period)
            if (since_d and d < since_d) or (until_d and d > until_d):
                continue
            by_day[d].append((src, period))

    days = sorted(by_day)
    refresh_from = days[-1] - timedelta(days=refresh_last - 1) if days and refresh_last > 0 else None
    written, skipped, total_rows = 0, 0, 0
    status_counts: Counter = Counter()
    for day in days:
        exists = all(_part_path(out, t, day).exists() for t in TABLES)
        if exists and not overwrite and not (refresh_from and day >= refresh_from):
            skipped += 1
            continue
        t1 = time.time()
        prices, man, rej = process_day(day, by_day[day], ti, research_root)
        _write_parquet(man, _part_path(out, "manifest", day))
        _write_parquet(rej, _part_path(out, "rejects", day))
        _write_parquet(prices, _part_path(out, "prices", day))  # last: marks the day as done
        written += 1
        total_rows += len(prices)
        status_counts.update(man["status"].tolist() if len(man) else [])
        logger.info("%s  %4d sources  %8d rows  %.1fs", day, len(by_day[day]), len(prices),
                    time.time() - t1)

    out.mkdir(parents=True, exist_ok=True)
    unmatched_df = (pd.DataFrame(unmatched) if unmatched
                    else _empty(["source_id", "file", "reason"]))
    _write_parquet(unmatched_df, out / "unmatched_files.parquet")
    summary = {
        "pipeline_version": __version__,
        "run_at": datetime.now().isoformat(timespec="seconds"),
        "research_root": str(research_root),
        "research_commit": _research_commit(research_root),
        "since": since_d.isoformat() if since_d else None,
        "until": until_d.isoformat() if until_d else None,
        "categories": sorted(categories) if categories else None,
        "sources": len(sources),
        "sources_in_index": sum(s.in_index for s in sources),
        "days_written": written,
        "days_skipped_already_built": skipped,
        "rows_written": total_rows,
        "file_status_counts": dict(status_counts),
        "files_without_date": len(unmatched),
        "seconds": round(time.time() - t0, 1),
    }
    if record_run:
        (out / "run_info.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False),
                                           encoding="utf-8")
        with open(out / "run_history.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(summary, ensure_ascii=False) + "\n")
    return summary


# --------------------------------------------------------------------------- #
# Reading the output back
# --------------------------------------------------------------------------- #
def _read_table(out, table, since=None, until=None, columns=None) -> list[pd.DataFrame]:
    base = Path(out) / table
    since_d = date.fromisoformat(str(since)) if since else None
    until_d = date.fromisoformat(str(until)) if until else None
    frames = []
    for part in sorted(base.glob("date=*/part-0.parquet")):
        d = date.fromisoformat(part.parent.name.split("=", 1)[1])
        if (since_d and d < since_d) or (until_d and d > until_d):
            continue
        frames.append(pd.read_parquet(part, columns=columns))
    return frames


def read_prices(
    out: str | Path,
    since: str | date | None = None,
    until: str | date | None = None,
    categories: Iterable[str] | None = None,
    columns: list[str] | None = None,
    in_index_only: bool = False,
) -> pd.DataFrame:
    """Load the merged price table (optionally a date range and some categories)."""
    need = None
    if columns is not None:
        need = list(dict.fromkeys(list(columns) + ["category", "in_index"]))
    frames = [f for f in _read_table(out, "prices", since, until, need) if len(f)]
    if not frames:
        return _empty(columns or PRICE_COLUMNS)
    df = pd.concat(frames, ignore_index=True)
    if categories:
        df = df[df["category"].isin({c.zfill(2) for c in categories})]
    if in_index_only:
        df = df[df["in_index"]]
    if columns is not None:
        df = df[list(columns)]
    return df.reset_index(drop=True)


def read_manifest(out, since=None, until=None) -> pd.DataFrame:
    frames = [f for f in _read_table(out, "manifest", since, until) if len(f)]
    return pd.concat(frames, ignore_index=True) if frames else _empty(MANIFEST_COLUMNS)


def read_rejects(out, since=None, until=None) -> pd.DataFrame:
    frames = [f for f in _read_table(out, "rejects", since, until) if len(f)]
    return pd.concat(frames, ignore_index=True) if frames else _empty(REJECT_COLUMNS)


# --------------------------------------------------------------------------- #
# Validation against the official loader
# --------------------------------------------------------------------------- #
def validate_against_official(research_root: str | Path, out: str | Path, day: str) -> dict:
    """Compare our in-index rows of one day with ``_load_all_stores(day)``.

    Known, intended difference: the official loader keeps rows without a product
    name under the name "nan"; we leave them out (reason ``no_name``).
    """
    research_root = Path(research_root).resolve()
    ti = import_official(research_root)
    d = date.fromisoformat(day)
    month_first = d.replace(day=1)

    # Make sure the needed days exist in the output
    build(research_root, out, since=d, until=d, refresh_last=0, record_run=False)
    monthly_labels = {lab for (_, lab, g) in ti._SECTOR_CONFIG.values() if g == "monthly"}
    if monthly_labels and month_first != d:
        build(research_root, out, since=month_first, until=month_first, refresh_last=0,
              record_run=False)

    ours = read_prices(out, since=min(d, month_first), until=d, in_index_only=True)
    if len(ours):
        ours_day = ours["date"].dt.date
        is_monthly = ours["sector"].isin(monthly_labels)
        ours = ours[(~is_monthly & (ours_day == d)) | (is_monthly & (ours_day == month_first))]
    ours = ours.assign(canonical_key=ours["product_id"].str.split("::", n=1).str[1])
    ours = ours.rename(columns={"category": "tuik_category"})

    official, _, _ = ti._load_all_stores(day)
    official = official[official["canonical_key"] != "nan"]

    keys = ["store", "canonical_key", "tuik_category", "sector"]
    m = official[keys + ["price"]].merge(ours[keys + ["price"]], on=keys, how="outer",
                                         suffixes=("_official", "_ours"), indicator=True)
    both = m[m["_merge"] == "both"]
    diff = (both["price_official"] - both["price_ours"]).abs()
    tol = 1e-6 * both["price_official"].abs().clip(lower=1)
    mismatch = both[diff > tol]
    result = {
        "date": day,
        "official_rows": int(len(official)),
        "our_rows": int(len(ours)),
        "matched": int(len(both)),
        "only_official": int((m["_merge"] == "left_only").sum()),
        "only_ours": int((m["_merge"] == "right_only").sum()),
        "price_mismatches": int(len(mismatch)),
        "ok": bool((m["_merge"] != "both").sum() == 0 and len(mismatch) == 0),
    }
    if not result["ok"]:
        result["examples_only_official"] = (
            m[m["_merge"] == "left_only"][keys].head(10).to_dict("records"))
        result["examples_only_ours"] = (
            m[m["_merge"] == "right_only"][keys].head(10).to_dict("records"))
        result["examples_price_mismatch"] = mismatch[keys + ["price_official", "price_ours"]] \
            .head(10).to_dict("records")
    return result


# --------------------------------------------------------------------------- #
# Command line
# --------------------------------------------------------------------------- #
def _parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="python -m backend.app.pipeline.load_prices",
        description="Merge the research repo daily CSVs into one Parquet table per day.")
    p.add_argument("--research-root", required=True,
                   help="path of the InflationResearchStudy clone (read only)")
    p.add_argument("--out", required=True, help="output folder, outside both repos")
    p.add_argument("--since", help="first day, YYYY-MM-DD (default: all)")
    p.add_argument("--until", help="last day, YYYY-MM-DD (default: all)")
    p.add_argument("--category", nargs="+", metavar="NN",
                   help="COICOP groups to load, e.g. 01 12 (default: all)")
    p.add_argument("--overwrite", action="store_true", help="rebuild days already in --out")
    p.add_argument("--refresh-last", type=int, default=7, metavar="N",
                   help="always rebuild the last N days, for late pushes (default: 7)")
    p.add_argument("--validate", metavar="YYYY-MM-DD",
                   help="compare one day with the official loader and exit")
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = _parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")
    logging.getLogger("turkey_inflation").setLevel(logging.ERROR)
    if args.validate:
        result = validate_against_official(args.research_root, args.out, args.validate)
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
        return 0 if result["ok"] else 1
    summary = build(args.research_root, args.out, args.since, args.until, args.category,
                    args.overwrite, args.refresh_last)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
