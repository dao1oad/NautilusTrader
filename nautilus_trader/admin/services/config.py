from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import ConfigDiffEntry
from nautilus_trader.admin.schemas import ConfigDiffSnapshot
from nautilus_trader.admin.schemas import RecoveryRunbook


def build_config_diff_snapshot() -> ConfigDiffSnapshot:
    return ConfigDiffSnapshot(
        generated_at=datetime.now(tz=UTC),
        items=[
            ConfigDiffEntry(
                key="command.confirmation.required",
                summary="All low-risk commands require an explicit UI confirmation step.",
                desired="enabled",
                actual="enabled",
                status="in_sync",
            ),
            ConfigDiffEntry(
                key="high_risk_commands.enabled",
                summary="High-risk trading commands stay disabled in Phase 2.",
                desired="disabled",
                actual="disabled",
                status="in_sync",
                runbook_id="verify-command-guardrails",
            ),
        ],
        runbooks=[
            RecoveryRunbook(
                runbook_id="verify-command-guardrails",
                title="Verify command guardrails",
                summary="Confirm the local admin control plane still requires confirmation and blocks high-risk actions.",
                steps=[
                    "Check the config diff entries for confirmation and high-risk guardrails.",
                    "Confirm the audit timeline shows the latest low-risk receipts before retrying a command.",
                ],
            ),
        ],
    )
