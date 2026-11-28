# Hermes server

Live data about real places for the Hermes app. See [AGENTS.md](AGENTS.md) for how to run it and add a
use case, and [../AGENTS.md](../AGENTS.md) for the whole project.

```bash
uv sync
uv run uvicorn hermes_api.main:app --reload --host 0.0.0.0 --port 8000
```

Then open http://localhost:8000/docs.
