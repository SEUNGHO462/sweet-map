// Lightweight Google Places loader and photo fetcher (JS Maps API)

export type GoogleNS = {
  maps: {
    places: {
      PlacesServiceStatus: { OK: string }
      PlacesService: new (node: HTMLElement) => {
        findPlaceFromQuery(
          req: { query: string; fields: string[]; locationBias?: unknown },
          cb: (results: { photos?: Array<{ getUrl: (o: { maxWidth?: number; maxHeight?: number }) => string; width?: number; height?: number }> }[] | null, status: string) => void
        ): void
      }
    }
    LatLng: new (lat: number, lng: number) => unknown
  }
}

declare global {
  interface Window { google?: GoogleNS }
}

let loadingPromise: Promise<GoogleNS> | null = null

export function loadGooglePlaces(apiKey: string): Promise<GoogleNS> {
  if (window.google?.maps?.places) return Promise.resolve(window.google as GoogleNS)
  if (loadingPromise) return loadingPromise
  loadingPromise = new Promise((resolve, reject) => {
    const id = 'google-maps-places'
    const existing = document.getElementById(id) as HTMLScriptElement | null
    const done = () => {
      if (window.google?.maps?.places) resolve(window.google as GoogleNS)
      else reject(new Error('Google Maps Places failed to load'))
    }
    if (existing) {
      existing.addEventListener('load', done)
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
      return
    }
    const s = document.createElement('script')
    s.id = id
    s.async = true
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&language=ko&region=KR`
    s.onload = done
    s.onerror = () => reject(new Error('Failed to load Google Maps JS'))
    document.head.appendChild(s)
  })
  return loadingPromise
}

export async function fetchPlacePhotoUrl(placeName: string, lat: number, lng: number, address?: string): Promise<string | null> {
  const key = import.meta.env?.VITE_GOOGLE_MAPS_KEY as string | undefined
  if (!key) return null
  const google = await loadGooglePlaces(key)
  const host = document.createElement('div')
  const service = new google.maps.places.PlacesService(host)
  type Photo = { getUrl: (o: { maxWidth?: number; maxHeight?: number }) => string; width?: number; height?: number }
  const pickBestPhoto = (photos: Array<Photo> | undefined | null): string | null => {
    if (!photos || !photos.length) return null
    let best: { score: number; url: string } | null = null
    for (const p of photos.slice(0, 10)) {
      const w = p.width ?? 0
      const h = p.height ?? 0
      const ratio = w && h ? w / Math.max(1, h) : 1
      let score = 0
      if (ratio >= 1.1) score += 3
      else if (ratio > 1.0) score += 1
      else if (ratio <= 0.9) score -= 2
      if (w >= 1200) score += 1
      if (w >= 2000) score += 1
      if (ratio >= 1.6) score += 1
      try {
        const url: string = p.getUrl({ maxWidth: 640 })
        if (url) {
          if (!best || score > best.score) best = { score, url }
        }
      } catch { /* noop */ }
    }
    return best?.url || null
  }

  const run = (q: string) =>
    new Promise<string | null>((resolve) => {
      service.findPlaceFromQuery(
        {
          query: q,
          fields: ['photos', 'name'],
          locationBias: new google.maps.LatLng(lat, lng) as unknown,
        },
        (results, status) => {
          if (!results || status !== google.maps.places.PlacesServiceStatus.OK) {
            resolve(null)
            return
          }
          const list = results as Array<{ photos?: Photo[] }>
          const withPhotos = list.find(r => Array.isArray(r.photos) && r.photos.length) || list[0]
          const photos = withPhotos?.photos
          const chosen = pickBestPhoto(photos)
          resolve(chosen)
        }
      )
    })

  const base = [placeName, address].filter(Boolean).join(' ').trim() || placeName
  const queries = [
    base,
    `${placeName} 카페`,
    `${placeName} 카페 인테리어`,
  ]
  let url: string | null = null
  for (const q of queries) {
    url = await run(q)
    if (url) break
  }
  return url
}

