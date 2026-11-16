"""
conftest.py
===========
Purpose : Shared fixtures plus a tiny reporting plugin that writes
          test_results.md (Test Case ID, outcome, actual result) so the
          Pass / Fail / Not Run table for the SE Document can be pasted
          straight in.

Tag each test with @pytest.mark.tc("TC-F-01") to give it a Test Case ID.
"""
import pytest

from trip_manager import TripService

_results = {}

# Use case coverage per test case (feeds the RTM).
# TC-F-01..10 -> UC-09 View Saved Trips; TC-F-11..22 -> UC-10 Manage Trip;
# non-functional tests apply to both use cases.
USE_CASE_BY_TC = {f"TC-F-{n:02d}": "UC-09" for n in range(1, 11)}
USE_CASE_BY_TC.update({f"TC-F-{n:02d}": "UC-10" for n in range(11, 23)})
USE_CASE_BY_TC.update({f"TC-N-{n:02d}": "UC-09, UC-10" for n in range(1, 6)})


@pytest.fixture
def service():
    """Fresh in-memory service for every test (isolated state)."""
    return TripService()


@pytest.fixture
def seeded(service):
    """User 'alice' with three saved trips (the first mirrors the 'Austin
    weekend' mock-up screens) and one trip belonging to 'bob'.
    Stops are added out of order on purpose to test chronological display."""
    austin = service.save_trip("alice", "Austin weekend",
                               "Austin, Texas, United States",
                               "2026-11-20", "2026-11-22")
    aid = austin.trip_id
    service.add_stop("alice", aid, "Check in at Lakeside House", "2026-11-20",
                     "15:00", "16:00", "Lodging", est_cost=145, nights=1)
    service.add_stop("alice", aid, "Walk Lady Bird Lake", "2026-11-20",
                     "09:00", "10:30", "Destination")
    service.add_stop("alice", aid, "Lunch on South Congress", "2026-11-20",
                     "12:00", "13:00", "Activity", est_cost=28)
    service.add_stop("alice", aid, "Walk Lady Bird Lake", "2026-11-21",
                     "09:00", "10:30", "Destination")
    austin = service.get_trip_details("alice", aid)

    paris = service.save_trip("alice", "Paris getaway", "Paris, France",
                              "2027-03-10", "2027-03-17")
    tokyo = service.save_trip("alice", "Tokyo spring", "Tokyo, Japan",
                              "2027-04-01", "2027-04-10")
    bob = service.save_trip("bob", "Bob's trip", "Rome, Italy",
                            "2027-05-01", "2027-05-05")
    return {"service": service, "austin": austin, "paris": paris,
            "tokyo": tokyo, "bob": bob}


def pytest_configure(config):
    config.addinivalue_line("markers", "tc(id): Test Case ID for the RTM")


def pytest_runtest_logreport(report):
    if report.when == "call" or (report.when == "setup" and report.skipped):
        _results[report.nodeid] = report


def pytest_sessionfinish(session, exitstatus):
    rows = []
    for item in session.items:
        marker = item.get_closest_marker("tc")
        tc_id = marker.args[0] if marker else "-"
        rep = _results.get(item.nodeid)
        if rep is None:
            outcome, actual = "Not Run", "Test did not execute."
        elif rep.passed:
            outcome, actual = "Pass", "Matched expected result."
        elif rep.skipped:
            outcome, actual = "Not Run", "Skipped."
        else:
            msg = (rep.longreprtext.strip().splitlines() or ["failed"])[-1]
            outcome, actual = "Fail", msg.replace("|", "/")
        rows.append((tc_id, USE_CASE_BY_TC.get(tc_id, "-"), item.name,
                     outcome, actual))

    rows.sort(key=lambda r: r[0])
    lines = ["# Test Results", "",
             "| Test Case ID | Use Case | Test Function | Result | Actual Result |",
             "|---|---|---|---|---|"]
    lines += [f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in rows]
    passed = sum(1 for r in rows if r[3] == "Pass")
    lines += ["", f"**Summary:** {passed} Pass / "
                  f"{sum(1 for r in rows if r[3] == 'Fail')} Fail / "
                  f"{sum(1 for r in rows if r[3] == 'Not Run')} Not Run "
                  f"(total {len(rows)})"]
    with open("test_results.md", "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
