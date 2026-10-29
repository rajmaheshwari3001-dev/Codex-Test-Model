"""
Delay service – manages simulated delay information.

In V1, delays are manually set by an operator (or test) rather than
received from a live feed.  Every delay clearly indicates that it is
simulated.
"""

from __future__ import annotations

from typing import Dict


class DelayService:
    """
    In-memory store for active trip delays.

    Delays are stored as trip_id -> additional minutes.
    """

    def __init__(self) -> None:
        self._delays: Dict[str, int] = {}

    def set_delay(self, trip_id: str, minutes: int) -> None:
        """Set a simulated delay for a trip (0 clears it)."""
        if minutes <= 0:
            self._delays.pop(trip_id, None)
        else:
            self._delays[trip_id] = minutes

    def get_delay(self, trip_id: str) -> int:
        """Return the current delay for a trip (0 = on time)."""
        return self._delays.get(trip_id, 0)

    def get_all_delays(self) -> Dict[str, int]:
        """Return a copy of all current delays."""
        return dict(self._delays)

    def clear_all(self) -> None:
        """Remove all simulated delays."""
        self._delays.clear()
