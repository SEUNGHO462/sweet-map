/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY: string
  readonly VITE_RAIN_VIDEO?: string
  readonly VITE_GOOGLE_MAPS_KEY?: string
  readonly VITE_GOOGLE_CSE_KEY?: string
  readonly VITE_GOOGLE_CSE_CX?: string
  readonly VITE_PHOTO_STRATEGY?: string
  readonly VITE_PHOTO_TTL_HOURS?: string
  readonly VITE_PHOTO_BATCH_SIZE?: string
  readonly VITE_PHOTO_MAX_TARGETS?: string
  readonly VITE_PHOTO_RETRIES?: string
  readonly VITE_PHOTO_BASE_DELAY_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ✅ 이 줄을 위로 올려야 함
export {}

declare global {
  interface Window {
    kakao: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown
        Marker: new (args: { position: unknown }) => { setMap(map: unknown): void }
        CustomOverlay: new (args: { position: unknown; content: HTMLElement; yAnchor?: number }) => { setMap(map: unknown): void }
        load(cb: () => void): void
        services: {
          Geocoder: new () => { addressSearch(q: string, cb: (res: { x: string; y: string; address?: { address_name?: string } }[], status: string) => void): void }
          Places: new () => {
            keywordSearch(q: string, cb: (res: { x: string; y: string; place_name?: string; road_address_name?: string; address_name?: string; phone?: string; place_url?: string }[], status: string) => void, opts?: { location?: unknown; radius?: number }): void
            categorySearch(code: string, cb: (res: { x: string; y: string; place_name?: string; road_address_name?: string; address_name?: string; phone?: string; place_url?: string }[], status: string) => void, opts?: { location?: unknown; radius?: number }): void
          }
          Status: { OK: string }
        }
      }
    }
    google?: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown
        places: {
          PlacesServiceStatus: { OK: string }
          PlacesService: new (node: HTMLElement) => {
            findPlaceFromQuery(
              req: { query: string; fields: string[]; locationBias?: unknown },
              cb: (results: { photos?: Array<{ getUrl: (o: { maxWidth?: number; maxHeight?: number }) => string; width?: number; height?: number }> }[] | null, status: string) => void
            ): void
          }
        }
      }
    }
  }
}
