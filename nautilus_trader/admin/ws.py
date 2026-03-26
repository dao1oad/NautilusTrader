from __future__ import annotations

import asyncio
from collections.abc import Sequence

from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from nautilus_trader.admin.services.commands import drain_command_events


SUPPORTED_CHANNELS = {"overview", "commands"}


def _unsupported_channels(channels: Sequence[str]) -> list[str]:
    return [channel for channel in channels if channel not in SUPPORTED_CHANNELS]


async def handle_admin_events_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    subscribed_channels: set[str] = set()
    command_cursor = 0

    try:
        while True:
            try:
                payload = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
            except TimeoutError:
                if "commands" not in subscribed_channels:
                    continue

                command_cursor, events = drain_command_events(after=command_cursor)
                for event in events:
                    await websocket.send_json(event)
                continue

            if not isinstance(payload, dict):
                await websocket.send_json(
                    {
                        "type": "server.error",
                        "code": "invalid_payload",
                    },
                )
                continue

            channels = payload.get("channels", [])
            if not isinstance(channels, list) or any(
                not isinstance(channel, str) for channel in channels
            ):
                await websocket.send_json(
                    {
                        "type": "server.error",
                        "code": "invalid_payload",
                    },
                )
                continue

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

            subscribed_channels.update(channels)
            await websocket.send_json({"type": "subscribed", "channels": channels})
    except WebSocketDisconnect:
        return
