"""Sample data for every mock, shared with the app: hermes/src/services/sample-data.json.

One file, so the app's mocks and the server's mocks always agree on ids. Change sample data there.
Each mock turns its part into models, which also checks that the file still matches them.
"""

import json
from functools import cache
from pathlib import Path
from typing import Any

SAMPLE_DATA = (
    Path(__file__).resolve().parents[2] / "hermes" / "src" / "services" / "sample-data.json"
)


@cache
def sample_data() -> dict[str, Any]:
    if not SAMPLE_DATA.exists():
        raise RuntimeError(
            f"Sample data not found at {SAMPLE_DATA}. The mocks need the whole repository, "
            "not only the server folder."
        )
    return json.loads(SAMPLE_DATA.read_text(encoding="utf-8"))
