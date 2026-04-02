// Geolocation module — Near Me + Random Pick features

let userLat = null;
let userLng = null;
let locationStatus = 'idle'; // idle | loading | granted | denied

// Haversine formula — distance between two lat/lng points in miles
export function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get user's current position (returns a promise)
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    locationStatus = 'loading';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        locationStatus = 'granted';
        resolve({ lat: userLat, lng: userLng });
      },
      (err) => {
        locationStatus = 'denied';
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

export function getCachedLocation() {
  if (userLat && userLng) return { lat: userLat, lng: userLng };
  return null;
}

export function getLocationStatus() {
  return locationStatus;
}

// Sort shops by distance from a point (nearest first)
export function sortByDistance(shops, lat, lng) {
  return shops
    .map(shop => ({
      ...shop,
      _distance: distanceMiles(lat, lng, shop.lat, shop.lng)
    }))
    .sort((a, b) => a._distance - b._distance);
}

// Filter shops within a given radius (miles)
export function shopsWithinRadius(shops, lat, lng, radiusMiles) {
  return shops.filter(shop =>
    distanceMiles(lat, lng, shop.lat, shop.lng) <= radiusMiles
  );
}

// Pick a random shop from an array
export function pickRandom(shops) {
  if (shops.length === 0) return null;
  return shops[Math.floor(Math.random() * shops.length)];
}
