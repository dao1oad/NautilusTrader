from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import AccountBalanceSummary
from nautilus_trader.admin.schemas import AccountExposureSummary
from nautilus_trader.admin.schemas import AccountsSnapshot
from nautilus_trader.admin.schemas import AccountsSummary
from nautilus_trader.admin.schemas import AccountSummary


ACCOUNTS_SUMMARY = AccountsSummary(
    active_accounts=2,
    total_equity="1842500.00",
    available_cash="905000.00",
    margin_used="612500.00",
    margin_available="1140000.00",
    gross_exposure="4280000.00",
    net_exposure="1525000.00",
)

ACCOUNT_ITEMS = [
    AccountSummary(
        account_id="BINANCE-UM-FUTURES",
        venue="BINANCE",
        account_type="margin",
        status="healthy",
        base_currency="USDT",
        total_equity="1250000.00",
        available_cash="620000.00",
        margin_used="430000.00",
        margin_available="820000.00",
        margin_ratio="0.34",
        gross_exposure="3000000.00",
        net_exposure="950000.00",
        updated_at=datetime(2026, 3, 27, 8, 58, tzinfo=UTC),
        balances=[
            AccountBalanceSummary(
                asset="USDT",
                total="900000.00",
                available="620000.00",
                locked="280000.00",
            ),
            AccountBalanceSummary(
                asset="BTC",
                total="18.40",
                available="18.10",
                locked="0.30",
            ),
        ],
        exposures=[
            AccountExposureSummary(
                instrument_id="BTCUSDT-PERP.BINANCE",
                side="long",
                net_quantity="12.0",
                notional="780000.00",
                leverage="2.4",
            ),
        ],
        alerts=["Margin buffer below target threshold."],
    ),
    AccountSummary(
        account_id="IB-PRIME",
        venue="IB",
        account_type="portfolio",
        status="monitoring",
        base_currency="USD",
        total_equity="592500.00",
        available_cash="285000.00",
        margin_used="182500.00",
        margin_available="320000.00",
        margin_ratio="0.31",
        gross_exposure="1280000.00",
        net_exposure="575000.00",
        updated_at=datetime(2026, 3, 27, 8, 56, tzinfo=UTC),
        balances=[
            AccountBalanceSummary(
                asset="USD",
                total="410000.00",
                available="285000.00",
                locked="125000.00",
            ),
            AccountBalanceSummary(
                asset="EUR",
                total="165000.00",
                available="158000.00",
                locked="7000.00",
            ),
        ],
        exposures=[
            AccountExposureSummary(
                instrument_id="ESM6.GLBX",
                side="long",
                net_quantity="9",
                notional="365000.00",
                leverage="1.6",
            ),
            AccountExposureSummary(
                instrument_id="NQM6.GLBX",
                side="short",
                net_quantity="4",
                notional="210000.00",
                leverage="1.2",
            ),
        ],
        alerts=["Equity transfer pending settlement."],
    ),
]


def build_accounts_snapshot(*, limit: int) -> AccountsSnapshot:
    return AccountsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
        summary=ACCOUNTS_SUMMARY,
        items=ACCOUNT_ITEMS[:limit],
    )
