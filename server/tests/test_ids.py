import pytest

from hermes_api.errors import NotFound
from hermes_api.ids import make_id, split_id


def test_prefixes_with_the_source():
    assert make_id("viator", "5678P2") == "viator:5678P2"
    assert split_id("viator:5678P2") == ("viator", "5678P2")


def test_keeps_colons_inside_the_source_id():
    assert split_id(make_id("google", "a:b")) == ("google", "a:b")


def test_sample_ids_have_no_prefix():
    assert split_id("belem") == ("sample", "belem")


def test_rejects_ids_that_cannot_be_looked_up():
    for bad in (":x", "google:"):
        with pytest.raises(NotFound):
            split_id(bad)


def test_rejects_bad_source_names():
    with pytest.raises(ValueError):
        make_id("goo:gle", "x")
