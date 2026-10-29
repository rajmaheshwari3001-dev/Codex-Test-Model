from app.services import chat_service


def test_chat_uses_deterministic_reply_without_xai_key(monkeypatch):
    expected = {"intent": "help", "reply": "Grounded reply", "data": None}
    monkeypatch.setattr(chat_service.settings, "xai_api_key", "")
    monkeypatch.setattr(
        chat_service,
        "_handle_with_rules",
        lambda *args: expected.copy(),
    )

    response = chat_service.handle_message("hello", None, None, None)

    assert response == expected


def test_chat_uses_xai_to_phrase_grounded_reply(monkeypatch):
    expected = {"intent": "help", "reply": "Grounded reply", "data": None}
    request = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"choices": [{"message": {"content": "Grok reply"}}]}

    class FakeClient:
        def __init__(self, timeout):
            assert timeout == 20.0

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def post(self, url, headers, json):
            request.update(url=url, headers=headers, payload=json)
            return FakeResponse()

    monkeypatch.setattr(chat_service.settings, "xai_api_key", "test-key")
    monkeypatch.setattr(chat_service.settings, "xai_model", "grok-test")
    monkeypatch.setattr(
        chat_service,
        "_handle_with_rules",
        lambda *args: expected.copy(),
    )
    monkeypatch.setattr(chat_service.httpx, "Client", FakeClient)

    response = chat_service.handle_message("hello", None, None, None)

    assert response["reply"] == "Grok reply"
    assert response["data"] is None
    assert request["url"] == "https://api.x.ai/v1/chat/completions"
    assert request["headers"]["Authorization"] == "Bearer test-key"
    assert request["payload"]["model"] == "grok-test"
    assert "Grounded reply" in request["payload"]["messages"][1]["content"]
