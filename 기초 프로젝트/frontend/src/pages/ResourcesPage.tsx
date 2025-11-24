import React, { useMemo } from 'react'
import type { Cafe } from '../types/cafe'
import { MapPin, Heart, Eye } from 'lucide-react'
import '../styles/ResourcesPage.css'

interface Props {
  cafes: Cafe[]
  favorites: number[]
  onToggleFavorite: (id: number) => void
  onOpenDetails: (cafe: Cafe) => void
  title?: string
}

const ResourcesPage: React.FC<Props> = ({ cafes, favorites, onToggleFavorite, onOpenDetails, title }) => {
  const filtered = useMemo(() => cafes, [cafes])

  return (
    <div className="resources-page">
      <div className="res-header">
        <h1>{title ? `Explore Cafes - within 5km of ${title}` : 'Explore Cafes'}</h1>
      </div>

      <div className="cafe-grid dark">
        {filtered.map(cafe => (
          <div key={cafe.id} className="cafe-card dark">
            <div className="card-image">
              <img
                src={cafe.image}
                alt={cafe.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement
                  const FALLBACK = 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=400'
                  if (t.src !== FALLBACK) { t.src = FALLBACK }
                }}
              />
              <button
                className={`fav-round ${favorites.includes(cafe.id) ? 'active' : ''}`}
                onClick={() => onToggleFavorite(cafe.id)}
                aria-label="favorite"
              >
                <Heart size={16} />
              </button>
            </div>
            <div className="card-content">
              <h3
                className="card-name"
                style={{ color: '#a0ffe6', textShadow: '0 1px 6px rgba(0,0,0,.35)' }}
              >
                {cafe.name}
              </h3>
              <div className="location line"><MapPin size={14} /> {cafe.address || cafe.location}</div>
              <div className="card-actions">
                <button className="btn-ghost btn-view" onClick={() => onOpenDetails(cafe)}><Eye size={16}/> 상세</button>
                <button className={`btn-ghost btn-heart ${favorites.includes(cafe.id) ? 'active' : ''}`} onClick={() => onToggleFavorite(cafe.id)}><Heart size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResourcesPage

