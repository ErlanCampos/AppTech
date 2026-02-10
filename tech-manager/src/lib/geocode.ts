const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const DEFAULT_COORDS = { lat: -14.235, lng: -51.9253 };

export interface CityResult {
    name: string;
    state: string;
    lat: number;
    lng: number;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    type: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        country?: string;
    };
}

function extractCityName(item: NominatimResult): string {
    const addr = item.address;
    if (!addr) return item.display_name.split(',')[0].trim();
    return addr.city || addr.town || addr.village || addr.municipality || item.display_name.split(',')[0].trim();
}

function extractState(item: NominatimResult): string {
    return item.address?.state || '';
}

export async function searchCities(query: string): Promise<CityResult[]> {
    if (!query.trim() || query.trim().length < 2) return [];

    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: '8',
            addressdetails: '1',
            'accept-language': 'pt-BR',
        });

        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
            headers: { 'Accept-Language': 'pt-BR' },
        });

        if (!res.ok) return [];

        const data: NominatimResult[] = await res.json();

        // Deduplicate by city+state and filter out non-place results
        const seen = new Set<string>();
        const results: CityResult[] = [];

        for (const item of data) {
            const cityName = extractCityName(item);
            const state = extractState(item);
            const key = `${cityName.toLowerCase()}|${state.toLowerCase()}`;

            if (seen.has(key)) continue;
            seen.add(key);

            results.push({
                name: cityName,
                state,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            });
        }

        return results.slice(0, 5);
    } catch {
        return [];
    }
}

export async function geocodeAddress(
    address: string
): Promise<{ lat: number; lng: number }> {
    if (!address.trim()) return DEFAULT_COORDS;

    try {
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1',
        });

        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
            headers: { 'Accept-Language': 'pt-BR' },
        });

        if (!res.ok) return DEFAULT_COORDS;

        const data = await res.json();

        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }

        return DEFAULT_COORDS;
    } catch {
        return DEFAULT_COORDS;
    }
}
