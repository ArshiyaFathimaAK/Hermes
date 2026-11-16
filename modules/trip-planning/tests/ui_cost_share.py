"""Browser check for UC-11 (cost panel) and UC-12 (share link + read-only view).
Spenser Saunders, Assignment 4. Drafted with AI assistance (Claude), reviewed and run.

Optional: needs `pip install playwright` and `python -m playwright install chromium`.
Run from modules/trip-planning:  python tests/ui_cost_share.py
Uses a temporary database. Saves screenshots to evidence/ for the presentation.
"""
import json
import sys
import tempfile
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from hermes.api import make_server
from playwright.sync_api import sync_playwright, expect

EVIDENCE = Path(__file__).resolve().parents[1] / 'evidence'
results = []


def check(test_id, expected, actual_fn):
    """Run one UI assertion and record Pass/Fail with the actual result."""
    try:
        actual = actual_fn()
        results.append(dict(id=test_id, status='Pass', expected=expected, actual=actual))
    except AssertionError as error:
        results.append(dict(id=test_id, status='Fail', expected=expected, actual=str(error).splitlines()[0]))


with tempfile.TemporaryDirectory() as folder:
    server = make_server(Path(folder) / 'ui.db', 0)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={'width': 1280, 'height': 900}, device_scale_factor=2)
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(base)
            expect(page.locator('#results .result')).to_have_count(8)

            # Create a trip through the UI (UC-08, Arshiya's screen).
            page.click('#nav-create')
            page.fill('#trip-name', 'Austin weekend')
            page.check('input[name=destination][value=Austin]')
            page.fill('#start-date', '2026-11-20')
            page.fill('#end-date', '2026-11-22')
            page.click('#create-button')
            page.click('#confirm-trip')
            expect(page.locator('#itinerary-title')).to_have_text('Austin weekend')

            def empty_estimate():
                expect(page.locator('#cost-total')).to_have_text('$0')
                expect(page.locator('#cost-status')).to_have_text('Add stops to your itinerary to see an estimated cost.')
                return '$0 and the add-stops message'
            check('UI-UC11-01', 'New trip shows $0 and "Add stops to your itinerary to see an estimated cost."', empty_estimate)

            # Add Lakeside House (day 1), South Congress (day 1), Lakeside House (day 2).
            for place, day in (('1', '2026-11-20'), ('4', '2026-11-20'), ('1', '2026-11-21')):
                page.click(f'#day-tabs button[data-day="{day}"]')
                page.select_option('#place-picker', place)
                page.click('#add-form button[type=submit]')

            def stale_note():
                expect(page.locator('#cost-status')).to_have_text('Unsaved changes are not in this estimate. Save your itinerary to update it.')
                expect(page.locator('#cost-total')).to_have_text('$0')
                return 'Stale note shown; total still $0 before save'
            check('UI-UC11-02', 'Unsaved stops do not change the total; stale-estimate note appears', stale_note)

            page.click('#save-itinerary')

            def saved_estimate():
                expect(page.locator('#cost-total')).to_have_text('$318')
                expect(page.locator('#cost-split')).to_have_text('Lodging $290 (2 nights) · Activities $28')
                expect(page.locator('#cost-days li')).to_have_count(2)
                return page.locator('#cost-panel').inner_text().replace('\n', ' | ')
            check('UI-UC11-03', 'After save: $318; Lodging $290 (2 nights) · Activities $28; two day rows', saved_estimate)

            page.click('#share-trip')
            expect(page.locator('#share-url')).to_be_visible()
            link = page.input_value('#share-url')

            def link_ready():
                assert link.startswith(base + '/?share='), link
                expect(page.locator('#share-status')).to_have_text('Share link ready. Anyone with this link can view this trip.')
                return link.replace(base, '<server>')
            check('UI-UC12-01', 'Share link shown with the ready message', link_ready)
            page.locator('aside').filter(has=page.locator('#cost-panel')).screenshot(path=str(EVIDENCE / 'spenser_ui_cost_share_panel.png'))

            # Recipient opens the link in a separate browser context (no shared state).
            recipient = browser.new_context(viewport={'width': 1280, 'height': 900}, device_scale_factor=2).new_page()
            recipient.goto(link)

            def shared_view():
                expect(recipient.locator('#shared-title')).to_have_text('Austin weekend')
                expect(recipient.locator('#shared-days li.stop')).to_have_count(3)
                assert recipient.locator('#shared button').count() == 0, 'shared view has buttons'
                return recipient.locator('#shared-summary').inner_text() + '; 3 stops; no edit buttons'
            check('UI-UC12-02', 'Recipient sees the trip name, 3 stops, and no edit controls', shared_view)
            recipient.locator('#shared').screenshot(path=str(EVIDENCE / 'spenser_ui_shared_view.png'))

            recipient.goto(base + '/?share=not-a-real-token-xyz')

            def invalid_link():
                expect(recipient.locator('#shared-status')).to_have_text('This share link is not valid.')
                return recipient.locator('#shared-status').inner_text()
            check('UI-UC12-03', 'Unknown link shows "This share link is not valid."', invalid_link)

            def no_script_errors():
                assert not errors, errors
                return 'No JavaScript errors'
            check('UI-UC11-UC12-04', 'No JavaScript errors during the run', no_script_errors)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

(EVIDENCE / 'spenser_ui_results.json').write_text(json.dumps(results, indent=2))
for r in results:
    print(f"{r['id']}: {r['status']} | {r['actual']}")
sys.exit(0 if all(r['status'] == 'Pass' for r in results) else 1)
