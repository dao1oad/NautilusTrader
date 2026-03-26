from nautilus_trader.admin.schemas import CommandErrorCode
from nautilus_trader.admin.services.audit import InMemoryAuditSink
from nautilus_trader.admin.services.audit import record_command_event


def test_record_command_event_returns_audit_record():
    sink = InMemoryAuditSink()

    record = record_command_event(
        "strategy.start",
        {"strategy_id": "demo"},
        "accepted",
        sink=sink,
        command_id="cmd-001",
        target="strategies/demo",
    )

    assert record.sequence_id == 1
    assert record.command_id == "cmd-001"
    assert record.command == "strategy.start"
    assert record.target == "strategies/demo"
    assert record.status == "accepted"
    assert record.payload == {"strategy_id": "demo"}
    assert record.recorded_at.tzinfo is not None
    assert list(sink.read_records()) == [record]


def test_audit_sink_appends_failed_events_without_rewriting_history():
    sink = InMemoryAuditSink()

    record_command_event(
        "strategy.start",
        {"strategy_id": "demo"},
        "accepted",
        sink=sink,
        command_id="cmd-001",
        target="strategies/demo",
    )
    record_command_event(
        "strategy.start",
        {"strategy_id": "demo"},
        "failed",
        sink=sink,
        command_id="cmd-001",
        target="strategies/demo",
        error_code=CommandErrorCode.CONFLICT,
        message="Strategy 'demo' is already running.",
    )

    records = list(sink.read_records())

    assert [record.sequence_id for record in records] == [1, 2]
    assert [record.status for record in records] == ["accepted", "failed"]
    assert records[0].message is None
    assert records[1].message == "Strategy 'demo' is already running."
    assert records[1].failure is not None
    assert records[1].failure.code == CommandErrorCode.CONFLICT
