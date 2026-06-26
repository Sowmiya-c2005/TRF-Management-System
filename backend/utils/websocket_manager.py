import asyncio
from fastapi import WebSocket
from backend.utils.logging_config import get_logger

logger = get_logger("websocket_manager")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection accepted. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        logger.info(f"Broadcasting real-time notification to {len(self.active_connections)} client(s).")
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message over WebSocket, disconnecting client: {str(e)}")
                self.disconnect(connection)


# Global singleton instance
manager = ConnectionManager()
