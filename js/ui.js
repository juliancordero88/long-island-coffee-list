// UI module — card rendering, detail modal, view toggling

import { isOpenNow, getTodayHours, getDayName } from './filters.js';

const ICONS = {
  wifi: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 18c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.24-2.76a6.003 6.003 0 018.49 0l-1.42 1.42a4.003 4.003 0 00-5.66 0l-1.41-1.42zm-2.83-2.83a9.99 9.99 0 0114.14 0l-1.41 1.41c-3.12-3.12-8.19-3.12-11.32 0l-1.41-1.41z"/></svg>',
  outlets: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M16 9V3H8v6H2v2h6v4l-2 5h2l1-2.5h6L16 20h2l-2-5v-4h6V9h-6zm-2 0h-4V5h4v4z"/></svg>',
  bathroom: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2a3 3 0 100 6 3 3 0 000-6zm-1 8h2a5 5 0 015 5v1H6v-1a5 5 0 015-5zm-7 8h16v2H4v-2z"/></svg>',
  food: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>',
  directions: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/></svg>',
  web: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
};

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function renderCards(shops, onShopClick) {
  const list = document.getElementById('shopList');

  if (shops.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#ccc"><path d="M6 8h12v1a8 8 0 01-8 8H8a4 4 0 01-4-4V8h2zm12 2h1a3 3 0 010 6h-1"/></svg>
        <p>No coffee shops match your filters.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = shops.map(shop => {
    const open = isOpenNow(shop);
    const todayHours = getTodayHours(shop);
    const badges = buildAmenityBadges(shop);

    return `
      <div class="shop-card" data-shop-id="${shop.id}">
        <div class="card-content">
          <div class="card-header">
            <span class="card-name">${shop.name}</span>
            <span class="card-status ${open ? 'open' : 'closed'}">${open ? 'Open' : 'Closed'}</span>
          </div>
          ${shop._distance != null ? `<div class="card-distance"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg> ${shop._distance.toFixed(1)} miles away</div>` : ''}
          <div class="card-town">${shop.town}, NY${todayHours ? ` · ${todayHours}` : ''}</div>
          <div class="card-amenities">${badges}</div>
          ${shop.knownFor ? `<div class="card-known-for">${shop.knownFor}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.shop-card').forEach(card => {
    card.addEventListener('click', () => {
      const shop = shops.find(s => s.id === card.dataset.shopId);
      if (shop) onShopClick(shop);
    });
  });
}

function buildAmenityBadges(shop) {
  const badges = [];
  if (shop.amenities.wifi) badges.push(`<span class="amenity-badge">${ICONS.wifi} WiFi</span>`);
  if (shop.amenities.outlets && shop.amenities.outlets !== 'none') badges.push(`<span class="amenity-badge">${ICONS.outlets} Outlets</span>`);
  if (shop.amenities.bathroom) badges.push(`<span class="amenity-badge">${ICONS.bathroom} Bathroom</span>`);
  if (shop.food && shop.food.length > 0) badges.push(`<span class="amenity-badge">${ICONS.food} Food</span>`);
  return badges.join('');
}

export function showModal(shop) {
  const overlay = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  const today = new Date().getDay();
  const open = isOpenNow(shop);

  const hoursRows = DAY_NAMES.map((day, i) => {
    const isToday = i === today;
    return `<tr class="${isToday ? 'today' : ''}">
      <td class="day">${DAY_LABELS[i]}</td>
      <td class="time">${shop.hours[day] || 'Closed'}</td>
    </tr>`;
  }).join('');

  const amenities = [];
  if (shop.amenities.wifi) amenities.push(`<div class="modal-amenity">${ICONS.wifi} WiFi available</div>`);
  if (shop.amenities.bathroom) amenities.push(`<div class="modal-amenity">${ICONS.bathroom} Bathroom</div>`);
  if (shop.amenities.outlets) {
    const label = shop.amenities.outlets === 'plenty' ? 'Plenty of outlets' : shop.amenities.outlets === 'some' ? 'Some outlets' : 'No outlets';
    amenities.push(`<div class="modal-amenity">${ICONS.outlets} ${label}</div>`);
  }
  if (shop.amenities.seating) {
    const label = shop.amenities.seating === 'indoor+outdoor' ? 'Indoor & outdoor seating' : shop.amenities.seating === 'outdoor' ? 'Outdoor seating' : 'Indoor seating';
    amenities.push(`<div class="modal-amenity">🪑 ${label}</div>`);
  }

  const foodTags = (shop.food || []).map(f => `<span class="food-tag">${f}</span>`).join('');

  const mapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(shop.address)}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=&layer=c&cbll=${shop.lat},${shop.lng}&cbp=12,0,0,0,0&output=svembed`;

  body.innerHTML = `
    <div class="modal-streetview">
      <iframe
        src="${mapEmbedUrl}"
        width="100%"
        height="200"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen></iframe>
    </div>
    <div class="modal-status-bar">
      <span class="card-status ${open ? 'open' : 'closed'}" style="font-size:12px">${open ? 'Open Now' : 'Closed'}</span>
    </div>
    <h2 class="modal-name">${shop.name}</h2>
    <p class="modal-town">${shop.address}${shop.subregion ? ` &middot; ${shop.subregion}` : ''}</p>
    ${shop.description ? `<p class="modal-description">${shop.description}</p>` : ''}

    ${shop.knownFor ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Known For</h3>
      <p class="known-for-text">${shop.knownFor}</p>
    </div>` : ''}

    <div class="modal-section">
      <h3 class="modal-section-title">Hours</h3>
      <table class="hours-table">${hoursRows}</table>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">Amenities</h3>
      <div class="modal-amenities">${amenities.join('')}</div>
    </div>

    ${foodTags ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Food & Drinks</h3>
      <div class="modal-food-tags">${foodTags}</div>
    </div>` : ''}

    <div class="modal-actions">
      <a href="${mapsUrl}" target="_blank" class="action-btn primary">
        ${ICONS.directions} Directions
      </a>
      ${shop.phone ? `<a href="tel:${shop.phone}" class="action-btn secondary">${ICONS.phone} Call</a>` : ''}
      ${shop.website ? `<a href="${shop.website}" target="_blank" class="action-btn secondary">${ICONS.web} Website</a>` : ''}
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function hideModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
