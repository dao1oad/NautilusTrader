from nautilus_trader.admin.schemas import CommandErrorCode
from nautilus_trader.admin.schemas import CommandRequest
from nautilus_trader.admin.services.commands import build_accepted_receipt
from nautilus_trader.admin.services.commands import build_failed_receipt


def test_command_request_defaults_to_local_single_operator_mode():
    request = CommandRequest(
        command="strategy.start",
        target="strategies/demo",
        payload={"strategy_id": "demo"},
    )

    assert request.command == "strategy.start"
    assert request.target == "strategies/demo"
    assert request.payload == {"strategy_id": "demo"}
    assert request.requested_by == "local-operator"
    assert request.command_id
    assert request.requested_at.tzinfo is not None


def test_accepted_receipt_preserves_request_identity():
    request = CommandRequest(
        command="strategy.start",
        target="strategies/demo",
        payload={"strategy_id": "demo"},
    )

    receipt = build_accepted_receipt(
        request,
        message="Command queued for local execution.",
    )

    assert receipt.command_id == request.command_id
    assert receipt.command == "strategy.start"
    assert receipt.target == "strategies/demo"
    assert receipt.status == "accepted"
    assert receipt.message == "Command queued for local execution."
    assert receipt.failure is None
    assert receipt.recorded_at.tzinfo is not None


def test_failed_receipt_wraps_catalogued_error_details():
    request = CommandRequest(
        command="adapter.connect",
        target="adapters/ib",
        payload={"adapter_id": "ib"},
    )

    receipt = build_failed_receipt(
        request,
        code=CommandErrorCode.NOT_FOUND,
        message="Adapter 'ib' was not found.",
    )

    assert receipt.status == "failed"
    assert receipt.failure is not None
    assert receipt.failure.code == CommandErrorCode.NOT_FOUND
    assert receipt.failure.message == "Adapter 'ib' was not found."
    assert receipt.failure.retryable is False
    assert receipt.failure.details == {}
