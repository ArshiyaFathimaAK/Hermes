"""Ids for places, things to do and stays.

The app and the database treat every id as plain text, store it, and send it back. Only the server
reads it. Live providers must prefix ids with their source, so two sources can't produce the same id
and the server knows where to look one up:

    google:ChIJO_PkYRozGQ0R0DaQ5L3rAAQ      viator:5678P2      booking:hotel-123

Mock data has no prefix. An id never changes meaning: if a source drops something, leave it out of
results (the app shows "No longer available") rather than reusing its id.
"""

from .errors import NotFound


def make_id(source: str, source_id: str) -> str:
    """`make_id("viator", "5678P2")` gives `"viator:5678P2"`."""
    if not source or ":" in source:
        raise ValueError(f"Bad source name: {source!r}")
    return f"{source}:{source_id}"


def split_id(item_id: str) -> tuple[str, str]:
    """`split_id("viator:5678P2")` gives `("viator", "5678P2")`.

    Ids without a prefix are sample data: `("sample", id)`.
    """
    source, separator, source_id = item_id.partition(":")
    if not separator:
        return "sample", item_id
    if not source or not source_id:
        raise NotFound("We could not find that.")
    return source, source_id
