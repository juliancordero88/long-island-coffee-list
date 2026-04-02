// Filters module — search, region, amenity, and open-now filtering

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function filterShops(shops, filters) {
  return shops.filter(shop => {
    // Region filter
    if (filters.region !== 'all' && shop.region !== filters.region) return false;

    // Amenity filters
    if (filters.wifi && !shop.amenities.wifi) return false;
    if (filters.outlets && (!shop.amenities.outlets || shop.amenities.outlets === 'none')) return false;
    if (filters.bathroom && !shop.amenities.bathroom) return false;
    if (filters.food && (!shop.food || shop.food.length === 0)) return false;

    // Open now filter
    if (filters.openNow && !isOpenNow(shop)) return false;

    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = `${shop.name} ${shop.town} ${shop.address} ${(shop.vibe || []).join(' ')} ${(shop.food || []).join(' ')}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

export function isOpenNow(shop) {
  if (!shop.hours) return false;
  const now = new Date();
  const dayKey = DAY_NAMES[now.getDay()];
  const todayHours = shop.hours[dayKey];
  if (!todayHours || todayHours.toLowerCase() === 'closed') return false;

  const parts = todayHours.split(' - ');
  if (parts.length !== 2) return false;

  const openTime = parseTime(parts[0].trim());
  const closeTime = parseTime(parts[1].trim());
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return currentMinutes >= openTime && currentMinutes < closeTime;
}

export function getTodayHours(shop) {
  if (!shop.hours) return null;
  const dayKey = DAY_NAMES[new Date().getDay()];
  return shop.hours[dayKey] || null;
}

export function getDayName() {
  return DAY_NAMES[new Date().getDay()];
}

function parseTime(str) {
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}
