// Reynard Landreneau: UC-06 View Destination/Lodging details and UC-07 View Weather. AI-assisted draft, reviewed by author.
// Loaded after app.js and reuses its navigation through window.hermes. The server owns validation; this file only displays.
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function status(id, message, error = false) { $(id).textContent = message; $(id).className = error ? 'error' : 'success'; }
async function get(path) {
  let response;
  try { response = await fetch(path); }
  catch { throw new Error('Connection unavailable. Please retry.'); }
  let body = {};
  try { body = await response.json(); } catch { /* non-JSON error page */ }
  if (!response.ok) throw new Error(body.error || 'Request failed. Please retry.');
  return body;
}

// ---------- UC-06: details ----------
let detailsRequest = 0, lastView = 'explore';
async function openDetails(id, from) {
  const request = ++detailsRequest;
  lastView = from;
  if (!window.hermes.navigate('details')) return;
  $('details-body').hidden = true; $('details-title').textContent = 'Details'; $('details-kind').textContent = '';
  status('details-status', 'Loading details...');
  try {
    const {place: p} = await get('/api/places/' + id);
    if (request !== detailsRequest) return;
    $('details-kind').textContent = `${p.category} · ${p.location}`.toUpperCase();
    $('details-title').textContent = p.name;
    $('details-body').innerHTML = `<p>${esc(p.description)}</p><dl>
      <dt>Price</dt><dd>${esc(p.price_label)}</dd><dt>Rating</dt><dd>${esc(p.rating)} / 5</dd>
      <dt>${p.category === 'lodging' ? 'Stay times' : 'Hours'}</dt><dd>${esc(p.schedule)}</dd>
      <dt>Address</dt><dd>${esc(p.address)}</dd>
      <dt>Amenities</dt><dd>${p.amenities.length ? p.amenities.map(esc).join(', ') : 'None listed'}</dd>
      <dt>Listing</dt><dd><a href="${esc(p.provider.url)}" target="_blank" rel="noopener noreferrer">${esc(p.provider.name)} (sample link)</a></dd></dl>
      <button id="details-weather" class="secondary" data-location="${esc(p.location)}">See weather in ${esc(p.location)}</button>`;
    $('details-body').hidden = false; status('details-status', '');
    $('details-weather').addEventListener('click', e => openWeather(e.currentTarget.dataset.location));
    $('details-title').focus();
  } catch (e) { if (request === detailsRequest) status('details-status', e.message, true); }
}
window.hermes.openDetails = openDetails; /* Sharad: UC-04 reuse Reynard's details page from ranked results. */
$('results').addEventListener('click', e => {
  const button = e.target.closest('[data-place-id]');
  if (button) openDetails(Number(button.dataset.placeId), 'explore');
});
$('details-back').addEventListener('click', () => window.hermes.navigate(lastView));

// ---------- UC-07: weather ----------
let weatherRequest = 0;
const LOCATION_SELECT = $('weather-location');
async function loadLocations() {
  try {
    const config = await get('/api/config');
    for (const name of config.locations) LOCATION_SELECT.add(new Option(name, name));
  } catch (e) { status('weather-status', e.message, true); }
}
function openWeather(location, start, end) {
  if (!window.hermes.navigate('weather')) return;
  if (location) LOCATION_SELECT.value = location;
  if (start) $('weather-start').value = start;
  if (end) $('weather-end').value = end;
  $('weather-results').replaceChildren(); status('weather-status', '');
  if (location && start && end) showWeather();
}
async function showWeather() {
  const request = ++weatherRequest;
  const params = new URLSearchParams({location: LOCATION_SELECT.value, start_date: $('weather-start').value, end_date: $('weather-end').value});
  $('weather-results').replaceChildren(); status('weather-status', 'Loading forecast...');
  $('weather-submit').disabled = true;
  try {
    const data = await get('/api/weather?' + params);
    if (request !== weatherRequest) return;
    status('weather-status', `${data.days.length}-day sample forecast for ${data.location}.`);
    $('weather-results').innerHTML = data.days.map(d => `<article class="result weather-day"><span class="kind">${esc(d.date)}</span><h3>${esc(d.condition)}</h3>
      <p class="temps">${esc(d.high_f)}°F / ${esc(d.low_f)}°F</p><p>${esc(d.precip_chance)}% chance of precipitation</p></article>`).join('');
  } catch (e) { if (request === weatherRequest) status('weather-status', e.message, true); }  // no forecast is drawn on failure
  finally { if (request === weatherRequest) $('weather-submit').disabled = false; }
}
$('weather-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!LOCATION_SELECT.value) return status('weather-status', 'Choose a supported location.', true);
  if (!$('weather-start').value || !$('weather-end').value) return status('weather-status', 'Enter valid dates in YYYY-MM-DD format.', true);
  showWeather();
});
$('trip-weather').addEventListener('click', () => {
  const trip = window.hermes.currentTrip();
  if (!trip) return;
  // Multi-destination trips use the first destination; the user can switch city on the weather page.
  const end = new Date(trip.start_date + 'T12:00:00Z'); end.setUTCDate(end.getUTCDate() + 15);
  const capped = trip.end_date < end.toISOString().slice(0, 10) ? trip.end_date : end.toISOString().slice(0, 10);
  openWeather(trip.destinations[0], trip.start_date, capped);
});
loadLocations();
