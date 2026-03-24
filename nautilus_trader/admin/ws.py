from __future__ import annotations

from collections.abc import Sequence

from fastapi import WebSocket
from fastapi import WebSocketDisconnect


SUPPORTED_CHANNELS = {"overview"}


def _unsupported_channels(channels: Sequence[str]) -> list[str]:
    return [channel for channel in channels if channel not in SUPPORTED_CHANNELS]


async def handle_admin_events_socket(websocket: WebSocket) -> None:
    await websocket.accept()

    try:
        while True:
            payload = await websocket.receive_json()
            if not isinstance(payload, dict):
                await websocket.send_json(
                    {
                        "type": "server.error",
                        "code": "invalid_payload",
                    },
                )
                continue

            channels = payload.get("channels", [])

            unsupported = _unsupported_channels(channels)
            if payload.get("type") != "subscribe" or unsupported:
                await websocket.send_json(
                    {
                        "type": "server.error",
                        "code": "unsupported_channel",
                        "channels": unsupported or channels,
                    },
                )
                continue

            await websocket.send_json({"type": "subscribed", "channels": channels})
    except WebSocketDisconnect:
        return
