import pytest

from app.services.chat_service import _extract_requested_time


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("at 10 am", "10:00"),
        ("at 10:30 PM", "22:30"),
        ("at 12 am", "00:00"),
        ("at 12 pm", "12:00"),
        ("leave at 8:05", "08:05"),
        ("at 25:15", "25:15"),
        ("no time specified", None),
        ("at 48:00", None),
    ],
)
def test_extract_requested_time(message, expected):
    assert _extract_requested_time(message) == expected
