import { fetchPlacePhotoUrl } from './googlePlaces'
import { fetchMenuImageForPlace } from './googleImageSearch'

// Prefer cafe interior/space via Places photo; fallback to menu images via CSE
export async function fetchCafeSpaceOrMenuImage(name: string, lat: number, lng: number, address?: string): Promise<string | null> {
  const interior = await fetchPlacePhotoUrl(name, lat, lng, address)
  if (interior) return interior
  const menu = await fetchMenuImageForPlace(name, address)
  return menu
}

