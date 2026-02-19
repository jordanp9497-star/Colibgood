/**
 * Nominatim (OpenStreetMap) - gratuit, sans clé API.
 * User-Agent obligatoire : https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_HEADERS = {
  "Accept-Language": "fr",
  "User-Agent": "ColibApp/1.0 (covoiturage colis; contact@colib.app)",
};

export type PlaceResult = {
  display_name: string;
  lat: number;
  lng: number;
};

/** Reverse geocoding : coordonnées → adresse (ex. pour "Ma position") */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
}

/** Geocoding : une adresse → coordonnées (pour la carte) */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

/** Recherche d’adresses pour autocomplete (type BlaBlaCar) */
export async function searchAddresses(query: string): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = (await res.json()) as Array<{
      display_name?: string;
      lat: string;
      lon: string;
    }>;
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      display_name: item.display_name ?? `${item.lat}, ${item.lon}`,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));
  } catch {
    return [];
  }
}
