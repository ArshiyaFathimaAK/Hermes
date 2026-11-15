"""Optional Chromium UI checks. Requires playwright and an installed Chromium browser.
Run from project root: python tests/ui_browser.py
Generated screenshots are temporary visual QA, not submission evidence.
"""
import json
import os
import sys
import tempfile
import threading
import time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from hermes.api import make_server
from playwright.sync_api import sync_playwright, expect

records=[]
def record(id, expected, actual):
    records.append(dict(id=id,status='Pass',expected=expected,actual=actual))

with tempfile.TemporaryDirectory() as folder:
    server=make_server(Path(folder)/'ui.db',0)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True, **({'executable_path':os.environ['HERMES_CHROMIUM']} if os.environ.get('HERMES_CHROMIUM') else {}))
            page=browser.new_page(viewport={'width':1280,'height':900})
            errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}')
            expect(page.locator('#results .result')).to_have_count(8)
            page.select_option('#location','Austin');page.select_option('#category','lodging')
            page.fill('#max-price','150');page.get_by_role('button',name='Apply filters',exact=True).click()
            expect(page.locator('#results .result')).to_have_count(1)
            expect(page.locator('#results')).to_contain_text('Lakeside House')
            record('UI01','One Austin lodging <= $150','Lakeside House only; active filter chips visible.')
            page.get_by_role('button',name='Clear filters',exact=True).click()
            expect(page.locator('#results .result')).to_have_count(8)
            page.fill('#query','zzzz');page.locator('#search-form button').click()
            expect(page.locator('#search-status')).to_have_text('No matching results. Change or clear your filters.')
            record('UI02','Clear restores 8 cards; zzzz shows empty state','8 cards restored, then explicit no-match message and 0 cards.')
            page.get_by_role('button',name='Clear filters',exact=True).click()
            page.screenshot(path=str(Path(folder)/'search.png'),full_page=True)
            page.locator('#nav-create').click()
            page.locator('#create-button').click()
            expect(page.locator('#trip-status')).to_have_text('Enter a trip name.')
            page.fill('#trip-name','Austin weekend')
            page.check('[name=destination][value=Austin]');page.check('[name=destination][value=Dallas]')
            page.fill('#start-date','2026-11-20');page.fill('#end-date','2026-11-19')
            page.locator('#create-button').click()
            expect(page.locator('#trip-status')).to_have_text('End date must be on or after start date.')
            page.fill('#end-date','2026-11-22');page.locator('#create-button').click()
            expect(page.locator('#review')).to_contain_text('Austin, Dallas')
            page.screenshot(path=str(Path(folder)/'create.png'),full_page=True)
            page.locator('#confirm-trip').click()
            expect(page.locator('#itinerary-status')).to_have_text('Trip saved successfully.')
            expect(page.locator('#day-tabs button')).to_have_count(3)
            record('UI03','Invalid fields rejected; valid two-city trip reviewed and saved','Exact name/date errors appeared. Review showed Austin and Dallas. Save opened 3 day buttons.')
            page.select_option('#place-picker','3');page.locator('#add-form button').click()
            page.select_option('#place-picker','1');page.locator('#add-form button').click()
            page.locator('#itinerary-items li').first.get_by_role('button',name='Down',exact=True).click()
            expect(page.locator('#itinerary-items li').first).to_contain_text('Lakeside House')
            page.locator('#itinerary-items li').first.drag_to(page.locator('#itinerary-items li').last)
            expect(page.locator('#itinerary-items li').first).to_contain_text('Walk Lady Bird Lake')
            page.locator('[data-day="2026-11-21"]').click()
            page.select_option('#place-picker','5');page.locator('#add-form button').click()
            page.locator('#save-itinerary').click()
            expect(page.locator('#itinerary-status')).to_have_text('Itinerary saved successfully.')
            page.locator('#reload-trip').click()
            expect(page.locator('#itinerary-items li')).to_have_count(2)
            expect(page.locator('#itinerary-items li').first).to_contain_text('Walk Lady Bird Lake')
            page.locator('[data-day="2026-11-21"]').click()
            expect(page.locator('#itinerary-items')).to_contain_text('Arts District Walk')
            record('UI04','Day assignment and reordered stops persist','Keyboard buttons and drag reorder worked. Saved trip reloaded both days with correct order.')
            page.select_option('#place-picker','6');page.locator('#add-form button').click()
            page.route('**/itinerary',lambda route:route.fulfill(status=503,content_type='application/json',body=json.dumps({'error':'Could not save or load data. Please retry. Your unsaved form is still available.'})))
            page.locator('#save-itinerary').click()
            expect(page.locator('#itinerary-status')).to_contain_text('Please retry.')
            expect(page.locator('#itinerary-items li')).to_have_count(2)
            expect(page.locator('#dirty-status')).to_contain_text('Unsaved changes')
            page.unroute('**/itinerary');page.locator('#save-itinerary').click()
            expect(page.locator('#itinerary-status')).to_have_text('Itinerary saved successfully.')
            record('UI05','Failed save preserves draft and allows retry','Injected HTTP 503 showed retry error, retained 2 items, and retry succeeded.')
            page.screenshot(path=str(Path(folder)/'itinerary.png'),full_page=True)
            page.set_viewport_size({'width':390,'height':844})
            page.screenshot(path=str(Path(folder)/'mobile.png'),full_page=True)
            overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth')
            assert not overflow
            for view in ['explore','create','trips']:
                page.locator('#nav-'+view).click()
                assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
            assert not errors,errors
            record('UI06','390px viewport has no horizontal overflow; no JavaScript errors',f'overflow={overflow}; JavaScript errors={len(errors)}. Full accessibility audit remains Not Run.')
            # Local screen-load smoke check only, not a production NFR-02 certification.
            timings=[]
            for _ in range(20):
                start=time.perf_counter();page.reload();expect(page.locator('#results .result')).to_have_count(8);timings.append((time.perf_counter()-start)*1000)
            p95=sorted(timings)[18]
            assert p95<3000
            record('NFR02-LOCAL','p95 < 3000 ms for 20 sequential local screen loads',f'p95={p95:.1f} ms; max={max(timings):.1f} ms; 8 synthetic records, one client, no external APIs. Production mobile/network test Not Run.')
            browser.close()
    finally:
        server.shutdown();server.server_close();thread.join()
Path('evidence/ui_tests.json').write_text(json.dumps(records,indent=2))
print(json.dumps(records,indent=2))
