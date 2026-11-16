// Sharad Rangaraju: UC-03 Manage User Profile and UC-04 Search for Destination.
// AI-assisted draft; author review pending.
// Purpose: display profile and ranked sample-place results using shared helpers.
// The server validates and saves; fixed demo identity, no real Supabase Auth.
const {$, escapeText: esc, status, api} = window.hermes;
const profileFields = ['display_name', 'email', 'phone', 'address'];
let profileVersion = null, profileRequest = 0, profileDirty = false, searchRequest = 0;

function fillProfile(profile) {
  for (const field of profileFields) $('profile-' + field).value = profile[field];
  profileVersion = profile.version;
  profileDirty = false;
}
async function loadProfile() {
  const request = ++profileRequest;
  $('profile-fields').disabled = true; $('profile-reload').disabled = true;
  status('profile-status', 'Loading profile...');
  try {
    const {profile} = await api('/api/profile');
    if (request !== profileRequest) return;
    fillProfile(profile); status('profile-status', '');
  } catch (e) { if (request === profileRequest) status('profile-status', e.message, true); }
  finally {
    if (request === profileRequest) {
      $('profile-fields').disabled = profileVersion === null;
      $('profile-reload').disabled = false;
    }
  }
}
// Navigation loads the profile only once; returning to the page preserves a draft.
window.hermes.openProfile = () => { if (profileVersion === null && !$('profile-reload').disabled) loadProfile(); };
$('profile-form').addEventListener('input', () => { profileDirty = true; });
$('profile-reload').addEventListener('click', () => {
  if (profileDirty && !confirm('Discard unsaved profile changes and reload?')) return;
  loadProfile();
});
$('profile-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (profileVersion === null || $('profile-fields').disabled) return;
  const request = ++profileRequest;
  const data = Object.fromEntries(profileFields.map(field => [field, $('profile-' + field).value]));
  data.version = profileVersion;
  $('profile-fields').disabled = true; $('profile-reload').disabled = true;
  status('profile-status', 'Saving profile...');
  try {
    const result = await api('/api/profile', 'PUT', data);
    if (request !== profileRequest) return;
    fillProfile(result.profile); status('profile-status', result.message);
  } catch (e) {
    // Validation, conflict and network failures leave all entered values intact.
    if (request === profileRequest) status('profile-status', e.message, true);
  } finally {
    if (request === profileRequest) {
      $('profile-fields').disabled = false; $('profile-reload').disabled = false;
    }
  }
});

$('destination-search-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!window.hermes.navigate('search')) return;
  const request = ++searchRequest;
  const params = new URLSearchParams({q: $('destination-query').value});
  $('destination-results').replaceChildren(); status('destination-status', 'Searching...');
  try {
    const result = await api('/api/search?' + params);
    if (request !== searchRequest) return;
    status('destination-status', result.message);
    $('destination-results').innerHTML = result.results.map(p => `<article class="result">
      <span class="kind">${esc(p.category)} · ${esc(p.location)}</span><h3>${esc(p.name)}</h3>
      <p>${esc(p.rating)} / 5</p><p>${esc(p.snippet)}</p>
      <strong>${esc(p.price === 0 ? 'Free' : '$' + p.price + (p.category === 'lodging' ? ' / night' : ' estimated'))}</strong>
      <button class="secondary" data-search-place-id="${esc(p.id)}">View details</button></article>`).join('');
  } catch (e) { if (request === searchRequest) status('destination-status', e.message, true); }
});
$('destination-results').addEventListener('click', e => {
  const button = e.target.closest('[data-search-place-id]');
  if (button) window.hermes.openDetails(Number(button.dataset.searchPlaceId), 'search');
});
