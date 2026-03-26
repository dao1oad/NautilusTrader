from __future__ import annotations

from datetime import UTC
from datetime import datetime
from typing import Any

from nautilus_trader.admin.schemas import CommandErrorCode
from nautilus_trader.admin.schemas import CommandFailure
from nautilus_trader.admin.schemas import CommandReceipt
from nautilus_trader.admin.schemas import CommandRequest


_RETRYABLE_ERROR_CODES = {
    CommandErrorCode.UNAVAILABLE,
    CommandErrorCode.INTERNAL_ERROR,
}


def build_command_failure(
    *,
    code: CommandErrorCode,
    message: str,
    details: dict[str, Any] | None = None,
) -> CommandFailure:
    return CommandFailure(
        code=code,
        message=message,
        retryable=code in _RETRYABLE_ERROR_CODES,
        details=dict(details or {}),
    )


def build_accepted_receipt(
    request: CommandRequest,
    *,
    message: str | None = None,
    recorded_at: datetime | None = None,
) -> CommandReceipt:
    return CommandReceipt(
        command_id=request.command_id,
        command=request.command,
        target=request.target,
        status="accepted",
        recorded_at=recorded_at or datetime.now(tz=UTC),
        message=message,
    )


def build_completed_receipt(
    request: CommandRequest,
    *,
    message: str | None = None,
    recorded_at: datetime | None = None,
) -> CommandReceipt:
    return CommandReceipt(
        command_id=request.command_id,
        command=request.command,
        target=request.target,
        status="completed",
        recorded_at=recorded_at or datetime.now(tz=UTC),
        message=message,
    )


def build_failed_receipt(
    request: CommandRequest,
    *,
    code: CommandErrorCode,
    message: str,
    details: dict[str, Any] | None = None,
    recorded_at: datetime | None = None,
) -> CommandReceipt:
    return CommandReceipt(
        command_id=request.command_id,
        command=request.command,
        target=request.target,
        status="failed",
        recorded_at=recorded_at or datetime.now(tz=UTC),
        message=message,
        failure=build_command_failure(code=code, message=message, details=details),
    )
