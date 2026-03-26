from __future__ import annotations

from datetime import UTC
from datetime import datetime
from typing import Any

from nautilus_trader.admin.schemas import AuditSnapshot
from nautilus_trader.admin.schemas import AuditRecord
from nautilus_trader.admin.schemas import CommandErrorCode
from nautilus_trader.admin.schemas import CommandFailure


_RETRYABLE_ERROR_CODES = {
    CommandErrorCode.UNAVAILABLE,
    CommandErrorCode.INTERNAL_ERROR,
}


class InMemoryAuditSink:
    def __init__(self) -> None:
        self._records: list[AuditRecord] = []
        self._next_sequence_id = 1

    def record(
        self,
        *,
        command_id: str,
        command: str,
        target: str | None,
        status: str,
        payload: dict[str, Any],
        message: str | None = None,
        failure: CommandFailure | None = None,
        recorded_at: datetime | None = None,
    ) -> AuditRecord:
        record = AuditRecord(
            sequence_id=self._next_sequence_id,
            command_id=command_id,
            command=command,
            target=target,
            status=status,
            payload=dict(payload),
            recorded_at=recorded_at or datetime.now(tz=UTC),
            message=message,
            failure=failure,
        )
        self._records.append(record)
        self._next_sequence_id += 1
        return record

    def read_records(self) -> tuple[AuditRecord, ...]:
        return tuple(self._records)

    def reset(self) -> None:
        self._records.clear()
        self._next_sequence_id = 1


_DEFAULT_AUDIT_SINK = InMemoryAuditSink()


def record_command_event(
    command: str,
    payload: dict[str, Any],
    status: str,
    *,
    sink: InMemoryAuditSink | None = None,
    command_id: str,
    target: str | None = None,
    error_code: CommandErrorCode | None = None,
    message: str | None = None,
    details: dict[str, Any] | None = None,
    recorded_at: datetime | None = None,
) -> AuditRecord:
    failure = None
    if error_code is not None:
        failure = CommandFailure(
            code=error_code,
            message=message or "",
            retryable=error_code in _RETRYABLE_ERROR_CODES,
            details=dict(details or {}),
        )

    return (sink or _DEFAULT_AUDIT_SINK).record(
        command_id=command_id,
        command=command,
        target=target,
        status=status,
        payload=payload,
        recorded_at=recorded_at,
        message=message,
        failure=failure,
    )


def reset_audit_sink() -> None:
    _DEFAULT_AUDIT_SINK.reset()


def read_audit_records(*, sink: InMemoryAuditSink | None = None) -> tuple[AuditRecord, ...]:
    return (sink or _DEFAULT_AUDIT_SINK).read_records()


def build_audit_snapshot(*, sink: InMemoryAuditSink | None = None) -> AuditSnapshot:
    records = list(read_audit_records(sink=sink))
    records.reverse()
    return AuditSnapshot(
        generated_at=datetime.now(tz=UTC),
        items=records,
    )
