"""
Tests for backend/app/pipeline/load_prices.py (task 2.1).

The tests use the REAL rules of the research repo: they copy turkey_inflation.py and
tuik_config.py from your InflationResearchStudy clone into a temporary folder,
next to small synthetic CSVs. Set the clone path with the environment variable
INFLATION_RESEARCH_ROOT (default: ../InflationResearchStudy, relative to this repo).
The tests are skipped if the clone is not found.

Run from the root of normal-inflation-project:
    python -m pytest backend/tests/test_load_prices.py -q
"""
from __future__ import annotations

import hashlib
import os
import shutil
from datetime import date
from pathlib import Path

import pandas as pd
import pytest

from backend.app.pipeline import load_prices as lp

REPO_ROOT = Path(__file__).resolve().parents[2]
RESEARCH = Path(os.environ.get("INFLATION_RESEARCH_ROOT",
                               REPO_ROOT.parent / "InflationResearchStudy"))
OFFICIAL = RESEARCH / "Inflations" / "Codes"

pytestmark = pytest.mark.skipif(
    not (OFFICIAL / "turkey_inflation.py").is_file(),
    reason=f"research repo not found at {RESEARCH} (set INFLATION_RESEARCH_ROOT)",
)

STD = "product_name,price,category_number,sub_category_number\n"


def _write(root: Path, rel: str, text: str) -> None:
    p = root / "InflationItems" / "Datas" / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


@pytest.fixture(scope="session")
def research(tmp_path_factory) -> Path:
    root = tmp_path_factory.mktemp("research")
    codes = root / "Inflations" / "Codes"
    codes.mkdir(parents=True)
    for name in ("turkey_inflation.py", "tuik_config.py"):
        shutil.copy(OFFICIAL / name, codes / name)

    # Configured, daily sector
    _write(root, "01_Food/StoreA/storea_2026-11-01.csv", STD + "\n".join([
        'Süt 1 L,"39,50",01,0114101',
        'SÜT  1 l,"40,50",01,0114101',          # same product after normalisation -> mean
        'Ekmek,"1.234,50 TL",01,0111301',       # Turkish thousands
        'Bedava,0,01,0111301',                  # zero
        'Eksi,-5,01,0111301',                   # negative
        'Bozuk,abc,01,0111301',                 # unreadable
        ',10,01,0111301',                       # no name
        'Boş,,01,0111301',                      # empty price
    ]) + "\n")
    _write(root, "01_Food/StoreA/storea_extra_2026-11-01.csv", STD + "Çay,50,01,0123101\n")
    _write(root, "01_Food/StoreA/storea_2026-11-02.csv", STD + "Süt 1 L,41,01,0114101\n")
    _write(root, "01_Food/StoreA/products10-1.csv", STD + "Süt 1 L,38,01,0114101\n")
    _write(root, "01_Food/StoreA/InflationData/storea_inflation_2026-11-01.csv",
           STD + "should not be read,1,01,0\n")
    _write(root, "01_Food/StoreB/storeb_2026-11-01.csv",
           "product_name;price\nPeynir;100\n")                       # not a comma header
    # Store excluded from the official index
    _write(root, "05_Furnishings/HomeGoods/EnglishHome/eh_2026-11-01.csv",
           STD + "Yastık,250,05,0520101\n")
    # Monthly sector
    _write(root, "06_Health/Clinic/clinic_2026-11-03.csv", STD + "Muayene,1500,06,0623101\n")
    _write(root, "06_Health/Clinic/clinic_2026-11-10.csv", STD + "Muayene,1600,06,0623101\n")
    # Rent listings are left out
    _write(root, "04_Housing/Rent/rent_2026-11-01.csv",
           STD + "Daire Kadıköy,30000,04,0411001\nBoya,500,04,0431001\n")
    # Not configured (in_index = False), same store name in two folders
    _write(root, "12_Insurance/HomeInsurance/Akbank/akbank_home_insurance_2026-11-01.csv",
           STD + "Konut sigortası,2000,12,\n")
    _write(root, "12_Insurance/MoneyTransferFees/Akbank/akbank_eft_havale_2026-11-01.csv",
           STD + "Konut sigortası,15,12,\n")
    _write(root, "12_Insurance/MoneyTransferFees/DenizBank/denizbank_eft_havale_2026-11-01.csv",
           "bank,transfer_type,fee_tl\nDenizBank,EFT,12.5\n")
    # Archive folders are skipped
    _write(root, "11_Restaurants/Archive/Old/old_2026-11-01.csv", STD + "Pizza,300,11,1111\n")
    return root


def _datas_hash(root: Path) -> str:
    h = hashlib.sha256()
    for f in sorted((root / "InflationItems" / "Datas").rglob("*")):
        if f.is_file():
            h.update(f.relative_to(root).as_posix().encode())
            h.update(f.read_bytes())
    return h.hexdigest()


@pytest.fixture(scope="session")
def built(research, tmp_path_factory):
    out = tmp_path_factory.mktemp("out")
    before = _datas_hash(research)
    summary = lp.build(research, out)
    assert _datas_hash(research) == before, "raw data must never be modified"
    return out, summary


def test_days_written(built):
    out, summary = built
    days = sorted(p.parent.name for p in (out / "prices").glob("date=*/part-0.parquet"))
    assert days == ["date=2026-11-01", "date=2026-11-02"]
    assert summary["days_written"] == 2


def test_prices_parsing_and_duplicates(built):
    out, _ = built
    df = lp.read_prices(out, since="2026-11-01", until="2026-11-01")
    a = df[df["source_id"] == "01_Food/StoreA"].set_index("product_name")
    assert a.loc["Süt 1 L", "price"] == pytest.approx(40.0)          # mean of 39.5 and 40.5
    assert a.loc["Süt 1 L", "n_rows_merged"] == 2
    assert a.loc["Ekmek", "price"] == pytest.approx(1234.5)
    assert a.loc["Ekmek", "price_raw"] == "1.234,50 TL"
    assert set(a.index) == {"Süt 1 L", "Ekmek"}
    assert not df.duplicated(["date", "product_id"]).any()


def test_rejects(built):
    out, _ = built
    rej = lp.read_rejects(out)
    a = rej[rej["source_id"] == "01_Food/StoreA"].set_index("reason")["rows"].to_dict()
    assert a == {"zero_price": 1, "negative_price": 1, "unreadable_price": 1,
                 "no_name": 1, "empty_price": 1}
    rent = rej[rej["source_id"] == "04_Housing/Rent"].set_index("reason")["rows"].to_dict()
    assert rent == {"rent_listing": 1}


def test_file_selection(built):
    out, _ = built
    man = lp.read_manifest(out)
    status = dict(zip(man["file"].str.rsplit("/", n=1).str[-1], man["status"]))
    assert status["storea_2026-11-01.csv"] == lp.USED
    assert status["storea_extra_2026-11-01.csv"] == lp.IGNORED_SAME_DAY
    assert status["storeb_2026-11-01.csv"] == lp.IGNORED_HEADER
    assert status["denizbank_eft_havale_2026-11-01.csv"] == lp.IGNORED_HEADER
    assert "storea_inflation_2026-11-01.csv" not in status       # InflationData skipped
    assert "old_2026-11-01.csv" not in status                    # Archive skipped
    unmatched = pd.read_parquet(out / "unmatched_files.parquet")
    assert unmatched["file"].str.endswith("products10-1.csv").any()


def test_in_index_and_product_ids(built):
    out, _ = built
    df = lp.read_prices(out)
    flags = df.groupby("source_id")["in_index"].first().to_dict()
    assert flags["01_Food/StoreA"]
    assert not flags["05_Furnishings/HomeGoods/EnglishHome"]
    assert not flags["12_Insurance/HomeInsurance/Akbank"]
    ak = df[df["store"] == "Akbank"]["product_id"]
    assert ak.nunique() == 2                       # same name, two different sources
    assert set(df[df["source_id"] == "04_Housing/Rent"]["product_name"]) == {"Boya"}


def test_monthly_sector(built):
    out, _ = built
    df = lp.read_prices(out)
    clinic = df[df["source_id"] == "06_Health/Clinic"]
    assert list(clinic["date"].dt.date) == [date(2026, 11, 1)]
    assert clinic["price"].iloc[0] == pytest.approx(1500)       # first file of the month


def test_incremental_and_overwrite(research, built):
    out, _ = built
    again = lp.build(research, out, refresh_last=0)
    assert again["days_written"] == 0 and again["days_skipped_already_built"] == 2
    forced = lp.build(research, out, overwrite=True)
    assert forced["days_written"] == 2


def test_read_prices_filters(built):
    out, _ = built
    df = lp.read_prices(out, categories=["12"], columns=["date", "product_id", "price"])
    assert list(df.columns) == ["date", "product_id", "price"]
    assert len(df) == 2


def test_validation_matches_official(research, built):
    out, _ = built
    info_before = (out / "run_info.json").read_text(encoding="utf-8")
    result = lp.validate_against_official(research, out, "2026-11-01")
    assert result["ok"], result
    # validation must not overwrite the summary of the last real build
    assert (out / "run_info.json").read_text(encoding="utf-8") == info_before


def test_run_history(research, tmp_path):
    lp.build(research, tmp_path / "o")
    lp.build(research, tmp_path / "o")
    lines = (tmp_path / "o" / "run_history.jsonl").read_text(encoding="utf-8").splitlines()
    assert len(lines) == 2


def test_works_with_imputation(built):
    from backend.app.pipeline.imputation import process_missing_data
    out, _ = built
    df = lp.read_prices(out, categories=["01"])
    filled = process_missing_data(df)
    assert {"date", "product_id", "price"} <= set(filled.columns)


def test_out_inside_research_is_refused(research):
    with pytest.raises(ValueError):
        lp.build(research, research / "output")
