import React from 'react'
import { MapPin, Phone, ExternalLink, X } from 'lucide-react'
import KakaoMap from './KakaoMap'
import type { Cafe } from '../types/cafe'

interface Props {
  cafe: Cafe
  onClose: () => void
}

const CafeDetailModal: React.FC<Props> = ({ cafe, onClose }) => {
  const FALLBACK_IMG = 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=400'
  const onErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget
    if (t.src !== FALLBACK_IMG) {
      t.onerror = null
      t.referrerPolicy = 'no-referrer'
      t.src = FALLBACK_IMG
    }
  }
  const lat = typeof cafe.lat === 'number' ? cafe.lat : 37.498095
  const lng = typeof cafe.lng === 'number' ? cafe.lng : 127.02761
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cafe-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={20}/></button>
        <div className="detail-hero"><img src={cafe.image} onError={onErr} alt={cafe.name} /></div>
        <div className="detail-body">
          <h2 className="detail-title">{cafe.name}</h2>
          <div className="detail-row"><MapPin size={16}/> 주소 {cafe.address || cafe.location}</div>
          <div className="detail-row"><Phone size={16}/> {cafe.phone || '연락처 정보 없음'}</div>
          {cafe.link ? (
            <div className="detail-row">
              <a href={cafe.link} target="_blank" rel="noopener noreferrer" className="linklike">
                <ExternalLink size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                카페 페이지 열기
              </a>
            </div>
          ) : null}
        </div>
        <div className="detail-map">
          <KakaoMap center={{ lat, lng, title: cafe.name, image: cafe.image, lines:[cafe.location, cafe.specialty] }} variant="resizable" height={`260px`} overlay={false} />
        </div>
      </div>
    </div>
  )
}

export default CafeDetailModal

