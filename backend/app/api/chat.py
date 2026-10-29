"""
API routes – chat assistant endpoint.

Endpoint:
  POST /api/chat  – send a message, get a transport-grounded reply
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi import HTTPException
from pydantic import BaseModel

from app.services import chat_service

router = APIRouter(prefix="/api", tags=["chat"])

_td = None
_routing_service = None
_delay_service = None


def init(td, routing_service, delay_service):
    global _td, _routing_service, _delay_service
    _td = td
    _routing_service = routing_service
    _delay_service = delay_service


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
def chat(req: ChatRequest):
    """
    Process a conversational user message.

    The chat service uses intent detection to understand the question
    and calls real backend services for data.  It never fabricates
    transport information.
    """
    if not req.message.strip():
        return {"intent": "help", "reply": "Please type a question.", "data": None}

    try:
        return chat_service.handle_message(
            req.message,
            td=_td,
            routing_service=_routing_service,
            delay_service=_delay_service,
        )
    except chat_service.GrokChatError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
