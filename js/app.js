// Main app — initialization and state management

import coffeeShops from './data.js?v=3';
import { initMap, updateMarkers, panTo, fitAll, invalidateSize, showUserLocation } from './map.js';
import { renderCards, showModal, hideModal } from './ui.js';
import { filterShops } from './filters.js';
import { getUserLocation, getCachedLocation, sortByDistance, shopsWithinRadius, pickRandom, distanceMiles } from './geo.js';

// ========== State ==========
const state = {
  view: 'map',
  nearMe: false,
  filters: {
    region: 'all',
    wifi: false,
    outlets: false,
    bathroom: false,
    food: false,
    openNow: false,
    search: '',
    type: 'all',
    tags: []
  }
};

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  applyFilters();
  setupViewToggle();
  setupFilterToggle();
  setupFilters();
  setupModal();
  setupSearch();
  setupNearMe();
  setupRandomPick();
  // Ensure map renders correctly on load
  invalidateSize();
  // Request location on load — show "you are here" on map
  requestLocationOnLoad();
});

// ========== Filtering ==========
function applyFilters() {
  let filtered = filterShops(coffeeShops, state.filters);

  // If Near Me is active, sort by distance and add _distance property
  const loc = getCachedLocation();
  if (state.nearMe && loc) {
    filtered = sortByDistance(filtered, loc.lat, loc.lng);
  } else {
    // Clear any lingering _distance
    filtered = filtered.map(s => { const copy = {...s}; delete copy._distance; return copy; });
  }

  renderCards(filtered, handleShopClick);
  updateMarkers(filtered, handleShopClick);
  updateFilterStatus(filtered.length, coffeeShops.length);
}

function updateFilterStatus(shown, total) {
  const el = document.getElementById('filterStatus');
  if (shown === total) {
    el.textContent = `${total} coffee shops`;
  } else {
    el.textContent = `Showing ${shown} of ${total} shops`;
  }
}

// ========== Shop Click ==========
function handleShopClick(shop) {
  showModal(shop);
  panTo(shop.lat, shop.lng);
}

// ========== View Toggle ==========
function setupViewToggle() {
  const mapBtn = document.getElementById('mapViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const mapContainer = document.getElementById('mapContainer');
  const listContainer = document.getElementById('listContainer');

  mapBtn.addEventListener('click', () => {
    state.view = 'map';
    mapBtn.classList.add('active');
    listBtn.classList.remove('active');
    mapContainer.classList.remove('hidden');
    listContainer.classList.add('hidden');
    invalidateSize();
  });

  listBtn.addEventListener('click', () => {
    state.view = 'list';
    listBtn.classList.add('active');
    mapBtn.classList.remove('active');
    listContainer.classList.remove('hidden');
    mapContainer.classList.add('hidden');
  });
}

// ========== Filter Toggle (mobile) ==========
function setupFilterToggle() {
  const btn = document.getElementById('filterToggle');
  const bar = document.getElementById('filterBar');

  btn.addEventListener('click', () => {
    const isOpen = bar.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
  });
}

// ========== Filters ==========
function setupFilters() {
  // Region pills
  const regionBtns = document.querySelectorAll('#regionFilter .pill');
  regionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filters.region = btn.dataset.value;
      applyFilters();
      // Auto-fit map to show filtered region
      const filtered = filterShops(coffeeShops, state.filters);
      if (filtered.length > 0) fitAll(filtered);
    });
  });

  // Amenity toggles
  const amenityBtns = document.querySelectorAll('#amenityFilter .pill');
  amenityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      state.filters[btn.dataset.value] = btn.classList.contains('active');
      applyFilters();
    });
  });

  // Open now toggle
  const openNowBtn = document.getElementById('openNowToggle');
  openNowBtn.addEventListener('click', () => {
    openNowBtn.classList.toggle('active');
    state.filters.openNow = openNowBtn.classList.contains('active');
    applyFilters();
  });

  // Type filter pills
  const typeBtns = document.querySelectorAll('#typeFilter .pill');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filters.type = btn.dataset.value;
      applyFilters();
    });
  });

  // Tag toggle pills
  const tagBtns = document.querySelectorAll('#tagFilter .pill');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const tag = btn.dataset.value;
      if (btn.classList.contains('active')) {
        if (!state.filters.tags.includes(tag)) state.filters.tags.push(tag);
      } else {
        state.filters.tags = state.filters.tags.filter(t => t !== tag);
      }
      applyFilters();
    });
  });
}

// ========== Search ==========
function setupSearch() {
  const input = document.getElementById('searchInput');
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.filters.search = input.value.trim();
      applyFilters();
    }, 200);
  });
}

// ========== Modal ==========
function setupModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  closeBtn.addEventListener('click', hideModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
}

// ========== Location on Load ==========
async function requestLocationOnLoad() {
  try {
    const loc = await getUserLocation();
    showUserLocation(loc.lat, loc.lng);
    // Also auto-enable Near Me sort
    state.nearMe = true;
    const nearBtn = document.getElementById('nearMeBtn');
    nearBtn.classList.add('active');
    applyFilters();
  } catch {
    // User denied or unavailable — no worries, just show default map view
  }
}

// ========== Near Me ==========
function setupNearMe() {
  const btn = document.getElementById('nearMeBtn');

  btn.addEventListener('click', async () => {
    if (state.nearMe) {
      // Turn off
      state.nearMe = false;
      btn.classList.remove('active');
      applyFilters();
      fitAll(filterShops(coffeeShops, state.filters));
      return;
    }

    // Request location
    btn.classList.add('loading');
    btn.textContent = 'Locating...';
    try {
      const loc = await getUserLocation();
      state.nearMe = true;
      btn.classList.remove('loading');
      btn.classList.add('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 3"/></svg> Near Me`;

      // Switch to list view on mobile to show sorted results
      const listBtn = document.getElementById('listViewBtn');
      if (window.innerWidth < 768) {
        listBtn.click();
      }

      applyFilters();
    } catch (err) {
      btn.classList.remove('loading');
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 3"/></svg> Near Me`;
      alert('Could not get your location. Please enable location access in your browser settings and try again.');
    }
  });
}

// ========== Random Pick ==========
function setupRandomPick() {
  const btn = document.getElementById('randomPickBtn');
  const panel = document.getElementById('randomPanel');
  const closeBtn = document.getElementById('randomClose');
  const slider = document.getElementById('radiusSlider');
  const radiusValue = document.getElementById('radiusValue');
  const goBtn = document.getElementById('randomGoBtn');
  const resultDiv = document.getElementById('randomResult');
  const noteDiv = document.getElementById('randomLocationNote');

  // Toggle panel
  btn.addEventListener('click', async () => {
    const isOpen = panel.classList.toggle('open');
    btn.classList.toggle('active', isOpen);

    if (isOpen) {
      // Try to get location if we don't have it
      const loc = getCachedLocation();
      if (!loc) {
        noteDiv.textContent = '📍 Getting your location...';
        try {
          await getUserLocation();
          noteDiv.textContent = '📍 Location found! Distances are from your current spot.';
        } catch {
          noteDiv.textContent = '📍 Location unavailable — will pick from all shops.';
        }
      } else {
        noteDiv.textContent = '📍 Using your current location for distances.';
      }
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    btn.classList.remove('active');
  });

  // Slider
  slider.addEventListener('input', () => {
    radiusValue.textContent = `${slider.value} mi`;
  });

  // Go button
  goBtn.addEventListener('click', () => {
    const loc = getCachedLocation();
    const radius = parseInt(slider.value);
    let pool;

    // Apply current filters first
    pool = filterShops(coffeeShops, state.filters);

    if (loc) {
      // Filter by distance
      pool = shopsWithinRadius(pool, loc.lat, loc.lng, radius);
    }

    // Animate the dice
    goBtn.querySelector('svg').parentElement.classList.add('spinning');
    setTimeout(() => goBtn.classList.remove('spinning'), 600);

    const picked = pickRandom(pool);

    if (!picked) {
      resultDiv.innerHTML = `<div class="random-none">No shops within ${radius} miles match your filters. Try increasing the distance!</div>`;
      return;
    }

    const dist = loc ? distanceMiles(loc.lat, loc.lng, picked.lat, picked.lng) : null;

    resultDiv.innerHTML = `
      <div class="random-result-card" id="randomResultCard">
        <div class="random-result-name">${picked.name}</div>
        <div class="random-result-info">${picked.town}, NY${picked.knownFor ? ` — ${picked.knownFor}` : ''}</div>
        ${dist != null ? `<div class="random-result-distance"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg> ${dist.toFixed(1)} miles away</div>` : ''}
      </div>
    `;

    // Click to open detail
    document.getElementById('randomResultCard').addEventListener('click', () => {
      panel.classList.remove('open');
      btn.classList.remove('active');
      handleShopClick(picked);
    });
  });
}
