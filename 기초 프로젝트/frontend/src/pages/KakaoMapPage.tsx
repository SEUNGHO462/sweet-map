import React, { useRef, useState } from 'react'
import KakaoMap from '../components/KakaoMap'
import type { Cafe } from '../types/cafe'
import '../styles/KakaoMapPage.css'
import { fetchCafeSpaceOrMenuImage } from '../lib/cafeImageSmart'

interface Props {
  onResults?: (cafes: Cafe[], title?: string) => void
}

const KakaoMapPage: React.FC<Props> = ({ onResults }) => {
  const [query, setQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; title?: string; image?: string; lines?: string[] } | null>(null)
  const [nearbyCafes, setNearbyCafes] = useState<Cafe[]>([])

  const fetchingRef = useRef(0)

  const fetchNearby = (lat: number, lng: number, centerTitle?: string) => {
    const kakao = window.kakao
    const places = new kakao.maps.services.Places()
    places.categorySearch(
      'CE7',
      (res: { x: string; y: string; place_name?: string; road_address_name?: string; address_name?: string; phone?: string; place_url?: string }[], status: string) => {
        if (status === kakao.maps.services.Status.OK && res) {
          const mapped: Cafe[] = res.map((r, i) => ({
            id: 1000 + i,
            name: r.place_name || 'Cafe',
            location: r.road_address_name || r.address_name || '',
            rating: 0,
            price: '',
            specialty: 'Cafe',
            type: 'mood',
            image: 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=400',
            address: r.road_address_name || r.address_name || '',
            phone: r.phone || '',
            hours: '',
            lat: parseFloat(r.y),
            lng: parseFloat(r.x),
            link: r.place_url || '',
          }))
          setNearbyCafes(mapped)
          // notify raw center title (no prefix) once
          if (onResults) onResults(mapped, centerTitle)

          // async photo enrichment (best-effort, env-togglable)
          const token = ++fetchingRef.current
          const enrich = async () => {
            const STRAT = (import.meta.env?.VITE_PHOTO_STRATEGY as string) || localStorage.getItem('photo_strategy') || 'off'
            if (STRAT === 'off') return
            const next = await Promise.all(
              mapped.slice(0, 24).map(async (c) => {
                try {
                  const url = await fetchCafeSpaceOrMenuImage(c.name, c.lat!, c.lng!, c.address || c.location)
                  if (!url) return c
                  // simple validation image
                  const ok = await new Promise<boolean>((resolve) => {
                    const img = new Image()
                    img.referrerPolicy = 'no-referrer'
                    img.onload = () => resolve(true)
                    img.onerror = () => resolve(false)
                    img.src = url
                  })
                  return ok ? { ...c, image: url } as Cafe : c
                } catch { return c }
              })
            )
            if (fetchingRef.current === token) {
              setNearbyCafes(next)
              // propagate enriched images to App -> ResourcesPage
              if (onResults) onResults(next, centerTitle)
            }
          }
          enrich()
        } else {
          setNearbyCafes([])
          if (onResults) onResults([], centerTitle)
        }
      },
      { location: new window.kakao.maps.LatLng(lat, lng), radius: 5000 }
    )
  }

  const handleSearch = () => {
    const kakao = window.kakao
    if (!kakao || !kakao.maps || !kakao.maps.services) {
      alert('Map is not ready yet. Please try again in a moment.')
      return
    }
    if (!query.trim()) return
    const q = query.trim()
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(q, (results: { x: string; y: string; address?: { address_name?: string } }[], status: string) => {
      if (status === kakao.maps.services.Status.OK && results && results[0]) {
        const { x, y, address } = results[0]
        const title = address?.address_name || q
        setMapCenter({ lat: parseFloat(y), lng: parseFloat(x), title })
        fetchNearby(parseFloat(y), parseFloat(x), title)
      } else {
        const places = new kakao.maps.services.Places()
        places.keywordSearch(q, (res: { x: string; y: string; place_name?: string }[], pstatus: string) => {
          if (pstatus === kakao.maps.services.Status.OK && res && res[0]) {
            const { x, y, place_name } = res[0]
            const title = place_name || q
            setMapCenter({ lat: parseFloat(y), lng: parseFloat(x), title })
            fetchNearby(parseFloat(y), parseFloat(x), title)
          } else {
            alert('No results found.')
          }
        })
      }
    })
  }

  return (
    <div className="map-page">
      <div className="map-search">
        <input
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search region, neighborhood or address"
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <KakaoMap
        center={mapCenter || undefined}
        variant="resizable"
        height={`60vh`}
        overlay={false}
        markers={(nearbyCafes)
          .filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')
          .map(c => ({ lat: c.lat as number, lng: c.lng as number, title: c.name, image: c.image }))}
      />
    </div>
  )
}

export default KakaoMapPage
