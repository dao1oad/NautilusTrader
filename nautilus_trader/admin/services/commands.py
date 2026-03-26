from __future__ import annotations

from datetime import UTC
from datetime import datetime
from threading import Lock
from typing import Any

from nautilus_trader.admin.schemas import CommandErrorCode
from nautilus_trader.admin.schemas import CommandFailure
from nautilus_trader.admin.schemas import CommandReceipt
from nautilus_trader.admin.schemas import CommandRequest
from nautilus_trader.admin.services.audit import record_command_event


_RETRYABLE_ERROR_CODES = {
    CommandErrorCode.UNAVAILABLE,
    CommandErrorCode.INTERNAL_ERROR,
}

_SUPPORTED_COMMANDS = {
    "strategy.start",
    "strategy.stop",
    "adapter.connect",
    "adapter.disconnect",
    "subscription.subscribe",
    "subscription.unsubscribe",
}
_COMMAND_EVENTS: list[dict[str, Any]] = []
_COMMAND_EVENTS_LOCK = Lock()


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


def reset_command_event_stream() -> None:
    with _COMMAND_EVENTS_LOCK:
        _COMMAND_EVENTS.clear()


def drain_command_events(*, after: int = 0) -> tuple[int, list[dict[str, Any]]]:
    with _COMMAND_EVENTS_LOCK:
        next_cursor = len(_COMMAND_EVENTS)
        return next_cursor, list(_COMMAND_EVENTS[after:])


def _publish_command_receipt(receipt: CommandReceipt) -> None:
    event = {
        "type": f"command.{receipt.status}",
        "receipt": receipt.model_dump(mode="json"),
    }
    with _COMMAND_EVENTS_LOCK:
        _COMMAND_EVENTS.append(event)


def submit_command(request: CommandRequest) -> CommandReceipt:
    if request.command not in _SUPPORTED_COMMANDS:
        failed = build_failed_receipt(
            request,
            code=CommandErrorCode.NOT_SUPPORTED,
            message=f"Command '{request.command}' is not supported.",
        )
        record_command_event(
            request.command,
            request.payload,
            failed.status,
            command_id=request.command_id,
            target=request.target,
            error_code=CommandErrorCode.NOT_SUPPORTED,
            message=failed.message,
            recorded_at=failed.recorded_at,
        )
        _publish_command_receipt(failed)
        return failed

    accepted = build_accepted_receipt(
        request,
        message=f"Command queued for local {request.command}.",
    )
    completed = build_completed_receipt(
        request,
        message=f"Command completed for local {request.command}.",
    )

    record_command_event(
        request.command,
        request.payload,
        accepted.status,
        command_id=request.command_id,
        target=request.target,
        message=accepted.message,
        recorded_at=accepted.recorded_at,
    )
    record_command_event(
        request.command,
        request.payload,
        completed.status,
        command_id=request.command_id,
        target=request.target,
        message=completed.message,
        recorded_at=completed.recorded_at,
    )
    _publish_command_receipt(accepted)
    _publish_command_receipt(completed)

    return accepted
