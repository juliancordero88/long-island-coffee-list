// Map module — Leaflet initialization and marker management

let map;
let markersLayer;
let userMarker = null;

const COFFEE_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #1E3A5F, #2563EB, #38BDF8);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 3px 12px rgba(37, 99, 235, 0.4), 0 0 0 2px rgba(37, 99, 235, 0.1);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  ">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2))">
      <path d="M6 8h12v1a8 8 0 01-8 8H8a4 4 0 01-4-4V8h2zm12 2h1a3 3 0 010 6h-1"/>
    </svg>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22]
});

export function initMap() {
  map = L.map('map', {
    center: [40.79, -73.20],
    zoom: 10,
    maxBounds: [[40.4, -74.1], [41.3, -71.8]],
    maxBoundsViscosity: 0.8,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

export function updateMarkers(shops, onShopClick) {
  markersLayer.clearLayers();

  shops.forEach(shop => {
    const marker = L.marker([shop.lat, shop.lng], { icon: COFFEE_ICON });

    const amenityIcons = [];
    if (shop.amenities.wifi) amenityIcons.push('<span class="amenity-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 18c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.24-2.76a6.003 6.003 0 018.49 0l-1.42 1.42a4.003 4.003 0 00-5.66 0l-1.41-1.42zm-2.83-2.83a9.99 9.99 0 0114.14 0l-1.41 1.41c-3.12-3.12-8.19-3.12-11.32 0l-1.41-1.41z"/></svg></span>');
    if (shop.amenities.bathroom) amenityIcons.push('<span class="amenity-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2a3 3 0 100 6 3 3 0 000-6zm-1 8h2a5 5 0 015 5v1H6v-1a5 5 0 015-5zm-7 8h16v2H4v-2z"/></svg></span>');
    if (shop.amenities.outlets && shop.amenities.outlets !== 'none') amenityIcons.push('<span class="amenity-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M16 9V3H8v6H2v2h6v4l-2 5h2l1-2.5h6L16 20h2l-2-5v-4h6V9h-6zm-2 0h-4V5h4v4z"/></svg></span>');

    const popup = L.popup({
      closeButton: false,
      maxWidth: 240,
      className: 'custom-popup'
    }).setContent(`
      <div class="popup-content">
        <div class="popup-name">${shop.name}</div>
        <div class="popup-town">${shop.town}, NY</div>
        <div class="popup-amenities">${amenityIcons.join('')}</div>
        <button class="popup-details-btn" data-shop-id="${shop.id}">View Details</button>
      </div>
    `);

    marker.bindPopup(popup);

    marker.on('popupopen', () => {
      const btn = document.querySelector(`.popup-details-btn[data-shop-id="${shop.id}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          map.closePopup();
          onShopClick(shop);
        });
      }
    });

    markersLayer.addLayer(marker);
  });
}

export function panTo(lat, lng) {
  if (map) {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }
}

export function fitAll(shops) {
  if (map && shops.length > 0) {
    const bounds = L.latLngBounds(shops.map(s => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

export function invalidateSize() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
}

export function showUserLocation(lat, lng) {
  if (!map) return;

  // Remove existing user marker
  if (userMarker) {
    map.removeLayer(userMarker);
  }

  const userIcon = L.divIcon({
    className: '',
    html: `<div style="
      width: 20px; height: 20px;
      background: #2563EB;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.15), 0 2px 8px rgba(0,0,0,0.2);
      animation: user-pulse 2s ease-in-out infinite;
    "></div>
    <style>
      @keyframes user-pulse {
        0%, 100% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.15), 0 2px 8px rgba(0,0,0,0.2); }
        50% { box-shadow: 0 0 0 16px rgba(37, 99, 235, 0.08), 0 2px 8px rgba(0,0,0,0.2); }
      }
    </style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup('<div style="font-family: Inter, sans-serif; font-weight: 600; padding: 4px 2px;">📍 You are here</div>');

  // Zoom to user location with nearby shops visible
  map.flyTo([lat, lng], 12, { duration: 1.2 });
}
