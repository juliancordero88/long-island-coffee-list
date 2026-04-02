// Main app — initialization and state management

import coffeeShops from './data.js';
import { initMap, updateMarkers, panTo, fitAll, invalidateSize } from './map.js';
import { renderCards, showModal, hideModal } from './ui.js';
import { filterShops } from './filters.js';

// ========== State ==========
const state = {
  view: 'map',
  filters: {
    region: 'all',
    wifi: false,
    outlets: false,
    bathroom: false,
    food: false,
    openNow: false,
    search: ''
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
  // Ensure map renders correctly on load
  invalidateSize();
});

// ========== Filtering ==========
function applyFilters() {
  const filtered = filterShops(coffeeShops, state.filters);
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
