import React, { useEffect, useRef } from 'react'

// Window.kakao typing comes from src/vite-env.d.ts

type MapCenter = { lat: number; lng: number; title?: string; image?: string; lines?: string[] }

type MarkerPoint = { lat: number; lng: number; title?: string; image?: string }

interface Props {
  center?: MapCenter
  full?: boolean
  variant?: "circle" | "resizable"
  height?: string
  overlay?: boolean
  markers?: MarkerPoint[]
}

const KakaoMap: React.FC<Props> = ({ center, full, variant, height, overlay, markers }) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapObj = useRef<unknown>(null)
  const overlayObj = useRef<{ setMap: (m: unknown) => void } | null>(null)
  const markersRef = useRef<{ setMap: (m: unknown) => void }[]>([])

  useEffect(() => {
    const appkey = (import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined)?.trim()
    if (!appkey) {
      console.error('[KakaoMap] VITE_KAKAO_MAP_KEY is not set. Kakao map will not load.')
      return
    }

    const initialize = () => {
      if (!window.kakao || !window.kakao.maps || !mapRef.current) {
        console.error('[KakaoMap] kakao.maps not available yet.')
        return
      }
      window.kakao.maps.load(() => {
        if (!mapRef.current) return

        const lat = center?.lat ?? 37.498095
        const lng = center?.lng ?? 127.02761
        const pos = new window.kakao.maps.LatLng(lat, lng)

        mapObj.current = new window.kakao.maps.Map(mapRef.current, {
          center: pos,
          level: 4,
        })

        const marker = new window.kakao.maps.Marker({ position: pos })
        marker.setMap(mapObj.current)

        // additional markers
        // clear old markers
        markersRef.current.forEach(m => m.setMap(null))
        markersRef.current = []
        if (markers && markers.length) {
          markers.forEach((m) => {
            const p = new window.kakao.maps.LatLng(m.lat, m.lng)
            const mk = new window.kakao.maps.Marker({ position: p })
            mk.setMap(mapObj.current)
            markersRef.current.push(mk)
          })
        }

        if (!overlay) {
          return
        }

        const title = center?.title ?? '감성카페 추천'
        const image = center?.image ?? 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=400'
        const lines = center?.lines ?? ['Rooftop mood', 'Art gallery', 'Book cafe vibes']

        const content = document.createElement('div')
        content.className = 'kakao-overlay'
        content.innerHTML = `
          <div class="overlay-card">
            <div class="overlay-header">${title}</div>
            <div class="overlay-body">
              <img class="overlay-thumb" src="${image}" alt="thumb" />
              <div class="overlay-list">
                ${lines.map((t, i) => `<div><span class="rank">${i + 1}</span> ${t}</div>`).join('')}
              </div>
            </div>
          </div>
        `

        overlayObj.current = new window.kakao.maps.CustomOverlay({
          position: pos,
          content,
          yAnchor: 1,
        })
        overlayObj.current.setMap(mapObj.current)
      })
    }

    const id = 'kakao-maps-sdk'
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      if (window.kakao && window.kakao.maps) {
        initialize()
      } else {
        existing.addEventListener('load', initialize)
      }
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.async = true
    // Force https to avoid mixed content or blocked loads
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false&libraries=services`
    script.onload = initialize
    script.onerror = () => {
      console.error('[KakaoMap] Failed to load Kakao Maps SDK script. Check network and app key/domain settings.')
    }
    document.head.appendChild(script)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, center?.title, center?.image, JSON.stringify(center?.lines ?? []), overlay, JSON.stringify(markers ?? [])])

  const cls = full ? 'kakao-map-full' : (variant === 'resizable' ? 'kakao-map-resize' : 'kakao-map-circle')
  const style = height ? { height } as React.CSSProperties : undefined
  return (
    <div className="kakao-map-wrap">
      <div ref={mapRef} className={cls} style={style} />
    </div>
  )
}

export default KakaoMap

