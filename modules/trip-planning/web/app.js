// Arshiya Fathima: UC-05 filters, UC-08 trip form, UC-10 itinerary. AI-assisted draft.
// The server owns validation and persistence. UI drafts remain local until save succeeds.
const $ = id => document.getElementById(id);
let catalog = [], trip = null, items = [], selectedDay = '', dirty = false, reviewData = null;
let searchRequest = 0;
const escapeText = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function status(id, message, error = false) { $(id).textContent = message; $(id).className = error ? 'error' : 'success'; }
async function api(path, method = 'GET', data) {
  let response;
  try { response = await fetch(path, {method, headers:{'Content-Type':'application/json'}, ...(data === undefined ? {} : {body:JSON.stringify(data)})}); }
  catch { throw new Error('Connection unavailable. Your unsaved entries are still here. Please retry.'); }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed. Please retry.');
  return body;
}
function navigate(view) {
  if (dirty && view !== 'itinerary' && !confirm('Leave without saving itinerary changes?')) return false;
  if (view !== 'itinerary') dirty = false;
  for (const name of ['explore','create','trips','itinerary']) $(name).hidden = name !== view;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'trips') loadTrips();
  return true;
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.view)));
document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); navigate('explore'); });
window.addEventListener('beforeunload', e => { if (dirty) {e.preventDefault(); e.returnValue = '';} });
function searchParams() {
  const values = {q:$('query').value,location:$('location').value,category:$('category').value,min_price:$('min-price').value,max_price:$('max-price').value,rating:$('rating').value,amenities:[...document.querySelectorAll('[name=amenity]:checked')].map(x=>x.value).join(',')};
  return Object.fromEntries(Object.entries(values).filter(([,v])=>v !== ''));
}
async function search() {
  const request = ++searchRequest;
  status('search-status','Searching...'); $('results').replaceChildren();
  const params = searchParams();
  $('active-filters').innerHTML = Object.entries(params).map(([k,v])=>`<span class="chip">${escapeText(k.replace('_',' '))}: ${escapeText(v)}</span>`).join('');
  try {
    const {results} = await api('/api/catalog?' + new URLSearchParams(params));
    if (request !== searchRequest) return;
    status('search-status',results.length ? `${results.length} sample places found.` : 'No matching results. Change or clear your filters.');
    $('results').innerHTML = results.map(p=>`<article class="result"><span class="kind">${escapeText(p.category)} · ${escapeText(p.location)}</span><h3>${escapeText(p.name)}</h3><p>${p.rating} / 5 · ${p.amenities.map(escapeText).join(', ') || 'Explore at your own pace'}</p><strong>${p.price === 0 ? 'Free' : '$'+p.price+(p.category === 'lodging' ? ' / night' : ' estimated')}</strong></article>`).join('');
  } catch (e) { if (request === searchRequest) status('search-status',e.message,true); }
}
$('search-form').addEventListener('submit',e=>{e.preventDefault();search();});
$('filter-form').addEventListener('submit',e=>{e.preventDefault();search();});
$('clear-filters').addEventListener('click',()=>{$('filter-form').reset();$('query').value='';search();});
function readTripForm() { return {name:$('trip-name').value, destinations:[...document.querySelectorAll('[name=destination]:checked')].map(x=>x.value), start_date:$('start-date').value,end_date:$('end-date').value,privacy:document.querySelector('[name=privacy]:checked').value}; }
function resetReview() {reviewData=null;$('review').hidden=true;$('confirm-trip').hidden=true;$('edit-trip').hidden=true;$('create-button').hidden=false;}
$('trip-form').addEventListener('input',resetReview);
$('edit-trip').addEventListener('click',resetReview);
$('trip-form').addEventListener('submit',e=>{
  e.preventDefault(); const d=readTripForm();
  if(!d.name.trim()) return status('trip-status','Enter a trip name.',true);
  if(!d.destinations.length) return status('trip-status','Select at least one destination.',true);
  if(!d.start_date || !d.end_date) return status('trip-status','Enter valid dates in YYYY-MM-DD format.',true);
  if(d.end_date < d.start_date) return status('trip-status','End date must be on or after start date.',true);
  reviewData=d;
  $('review').textContent=`${d.name.trim()} · ${d.destinations.join(', ')} · ${d.start_date} to ${d.end_date} · ${d.privacy}`;
  $('review').hidden=false;$('confirm-trip').hidden=false;$('edit-trip').hidden=false;$('create-button').hidden=true;
  status('trip-status','Review your details, then confirm to save.');
});
$('confirm-trip').addEventListener('click',async()=>{
  if(!reviewData)return;
  $('confirm-trip').disabled=true;
  try {const result=await api('/api/trips','POST',reviewData);await openTrip(result.trip.id);status('itinerary-status',result.message);$('trip-form').reset();resetReview();}
  catch(e){status('trip-status',e.message,true);}
  finally{$('confirm-trip').disabled=false;}
});
async function loadTrips(){
  try{const result=await api('/api/trips');status('trips-status',result.trips.length ? `${result.trips.length} saved trips.`:'No saved trips yet. Create your first trip.');
  $('trip-list').innerHTML=result.trips.map(t=>`<article class="result"><h3>${escapeText(t.name)}</h3><p>${t.start_date} to ${t.end_date}</p><button data-trip-id="${t.id}">Open itinerary</button></article>`).join('');
  $('trip-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>openTrip(Number(b.dataset.tripId))));}
  catch(e){status('trips-status',e.message,true);}
}
function tripDays(){const days=[];let day=new Date(trip.start_date+'T12:00:00Z');const end=new Date(trip.end_date+'T12:00:00Z');while(day<=end){days.push(day.toISOString().slice(0,10));day.setUTCDate(day.getUTCDate()+1);}return days;}
async function openTrip(id){
  if(dirty && !confirm('Discard unsaved changes and open this trip?'))return;
  try{const result=await api('/api/trips/'+id);trip=result.trip;items=trip.items.map(x=>({...x}));selectedDay=trip.start_date;dirty=false;navigate('itinerary');
  $('itinerary-title').textContent=trip.name;$('trip-summary').textContent=`${trip.destinations.join(' + ')} · ${trip.start_date} to ${trip.end_date}`;
  $('place-picker').innerHTML=catalog.filter(p=>trip.destinations.includes(p.location)).map(p=>`<option value="${p.id}">${escapeText(p.name)} (${p.category})</option>`).join('');
  status('itinerary-status','');renderItinerary();}
  catch(e){status($('itinerary').hidden?'trips-status':'itinerary-status',e.message,true);}
}
function markDirty(){dirty=true;$('dirty-status').textContent='Unsaved changes. Save your itinerary to keep them.';}
function move(id,direction){
 const group=items.filter(x=>x.day===selectedDay), from=group.findIndex(x=>x.id===id),to=from+direction;
 if(from<0||to<0||to>=group.length)return;
 [group[from],group[to]]=[group[to],group[from]];items=[...items.filter(x=>x.day!==selectedDay),...group];markDirty();renderItinerary();
}
function renderItinerary(){
 $('day-tabs').innerHTML=tripDays().map(day=>`<button aria-pressed="${day===selectedDay}" data-day="${day}">${day}</button>`).join('');
 $('day-tabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedDay=b.dataset.day;renderItinerary();}));
 $('day-title').textContent=selectedDay;$('dirty-status').textContent=dirty?'Unsaved changes. Save your itinerary to keep them.':'All changes saved.';
 const group=items.filter(x=>x.day===selectedDay);$('empty-day').hidden=group.length>0;
 $('itinerary-items').innerHTML=group.map((item,index)=>{const p=catalog.find(x=>x.id===item.place_id);return `<li class="stop" draggable="true" data-item="${escapeText(item.id)}"><span>${index+1}</span><div class="details"><h3>${escapeText(p.name)}</h3><p>${escapeText(p.category)} · ${escapeText(p.location)}</p></div><div class="actions"><button class="secondary" data-action="up" ${index===0?'disabled':''}>Up</button><button class="secondary" data-action="down" ${index===group.length-1?'disabled':''}>Down</button><button class="secondary" data-action="remove">Remove</button></div></li>`;}).join('');
 $('itinerary-items').querySelectorAll('li').forEach(li=>{
  li.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.action==='remove'){items=items.filter(x=>x.id!==li.dataset.item);markDirty();renderItinerary();}else move(li.dataset.item,b.dataset.action==='up'?-1:1);}));
  li.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',li.dataset.item));li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const group=items.filter(x=>x.day===selectedDay);const from=group.findIndex(x=>x.id===id),to=group.findIndex(x=>x.id===li.dataset.item);if(from<0||to<0||from===to)return;const [moved]=group.splice(from,1);group.splice(to,0,moved);items=[...items.filter(x=>x.day!==selectedDay),...group];markDirty();renderItinerary();});
 });
}
$('add-form').addEventListener('submit',e=>{e.preventDefault();if(!trip)return;items.push({id:crypto.randomUUID(),place_id:Number($('place-picker').value),day:selectedDay});markDirty();renderItinerary();});
$('save-itinerary').addEventListener('click',async()=>{
 $('save-itinerary').disabled=true;
 try{const result=await api(`/api/trips/${trip.id}/itinerary`,'PUT',{version:trip.version,items});trip=result.trip;items=trip.items.map(x=>({...x}));dirty=false;renderItinerary();status('itinerary-status',result.message);}
 catch(e){status('itinerary-status',e.message,true);}
 finally{$('save-itinerary').disabled=false;}
});
$('reload-trip').addEventListener('click',()=>trip&&openTrip(trip.id));
async function init(){try{const config=await api('/api/config');catalog=(await api('/api/catalog')).results;for(const location of config.locations){$('location').add(new Option(location,location));const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.name='destination';input.value=location;label.append(input,document.createTextNode(' '+location));$('destinations').append(label);}await search();}catch(e){status('search-status',e.message,true);}}
init();
