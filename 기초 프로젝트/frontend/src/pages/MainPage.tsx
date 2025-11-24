import React, { useEffect, useState } from 'react'
import '../styles/MainPage.css'

type Page = 'main'|'resources'|'map'|'community'

interface Props {
  rainVideo: string
  onNavigate: (p: Page) => void
}

const TasteShowcase: React.FC = () => (
  <section className="taste-section">
    <div className="taste-header">
      <div className="taste-title">What’s your taste?</div>
      <div className="taste-sub">Pick a vibe you like</div>
    </div>
    <div className="taste-grid">
      <div className="taste-card">
        <img src="https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Cafe mood" />
        <div className="taste-overlay"><span className="taste-tag">Mood</span><div className="taste-name">Cozy interior</div><div className="taste-desc">Warm lights & calm music</div></div>
      </div>
      <div className="taste-card">
        <img src="https://images.pexels.com/photos/1998920/pexels-photo-1998920.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Dessert" />
        <div className="taste-overlay"><span className="taste-tag">Dessert</span><div className="taste-name">Tiramisu</div><div className="taste-desc">Sweet & creamy</div></div>
      </div>
    </div>
  </section>
)

const FeatureTiles: React.FC<{ onNavigate: (p: Page)=>void }> = ({ onNavigate }) => (
  <section className="features-section">
    <h3 className="features-title">필요한 기능을 골라보세요</h3>
    <div className="features-grid">
      <button className="feature-card feature-map" onClick={() => onNavigate('map')}>
        <div className="feature-emoji">🗺️</div>
        <div className="feature-text">
          <div className="feature-head">주변 카페 찾기</div>
          <div className="feature-sub">현재 위치로 근처 카페</div>
        </div>
      </button>
      <button className="feature-card feature-match" onClick={() => onNavigate('resources')}>
        <div className="feature-emoji">🍰</div>
        <div className="feature-text">
          <div className="feature-head">취향 매칭</div>
          <div className="feature-sub">디저트/무드별 추천</div>
        </div>
      </button>
      <button className="feature-card feature-community" onClick={() => onNavigate('community')}>
        <div className="feature-emoji">💬</div>
        <div className="feature-text">
          <div className="feature-head">커뮤니티</div>
          <div className="feature-sub">리뷰/사진 공유</div>
        </div>
      </button>
    </div>
  </section>
)

const MainPage: React.FC<Props> = ({ rainVideo, onNavigate }) => {
  const headFull = 'Your Cafe Guide, Anytime, Anywhere'
  const subFull = ''
  const [headTyped, setHeadTyped] = useState('')
  const [subTyped, setSubTyped] = useState('')

  useEffect(() => {
    let i = 0
    const speed = 80
    const t1 = setInterval(() => {
      i++
      setHeadTyped(headFull.slice(0, i))
      if (i >= headFull.length) {
        clearInterval(t1)
        let j = 0
        const t2 = setInterval(() => {
          j++
          setSubTyped(subFull.slice(0, j))
          if (j >= subFull.length) clearInterval(t2)
        }, speed)
      }
    }, speed)
    return () => clearInterval(t1)
  }, [])

  return (
    <div className="main-page">
      <section className="rain-hero" aria-label="Rainy cafe mood video background">
        <div className="video-bg" aria-hidden="true">
          <video className="bg-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
            <source src={rainVideo} type="video/mp4" />
          </video>
        </div>
        <div className="hero-content">
          <h1 className="headline" aria-label={headFull}>{headTyped}</h1>
          <div className="subheadline" aria-label={subFull}>{subTyped}</div>
          <button className="cta-button cta-small" onClick={() => onNavigate('resources')}>Explore Cafes</button>
        </div>
      </section>
      <TasteShowcase />
      <FeatureTiles onNavigate={onNavigate} />
    </div>
  )
}

export default MainPage
