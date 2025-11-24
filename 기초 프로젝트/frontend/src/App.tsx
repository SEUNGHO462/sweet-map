import React, { useEffect, useRef, useState } from 'react'
import './App.css'

import Navigation from './components/Navigation'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import { api } from './lib/api'
import CafeDetailModal from './components/CafeDetailModal'
import Toast from './components/Toast'

import MainPage from './pages/MainPage'
import ResourcesPage from './pages/ResourcesPage'
import KakaoMapPage from './pages/KakaoMapPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage from './pages/ProfilePage'
import IntroPage from './pages/IntroPage'

import type { Cafe } from './types/cafe'
import { sampleCafes } from './data/sampleCafes'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'intro'|'main'|'resources'|'map'|'community'|'profile'>('intro')
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [typed, setTyped] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [searchCafes, setSearchCafes] = useState<Cafe[]>([])
  const [searchTitle, setSearchTitle] = useState<string | undefined>(undefined)
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)

  const rainVideo: string = import.meta.env.VITE_RAIN_VIDEO || '/rain.mp4'
  const studyVideo: string = '/study.mp4'

  useEffect(() => {
    if (!showIntro) return
    const message = 'Welcome to SWEET MAP'
    let i = 0
    const id = setInterval(() => {
      setTyped(message.slice(0, ++i))
      if (i >= message.length) clearInterval(id)
    }, 150)
    return () => clearInterval(id)
  }, [showIntro])

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<{ id:string; email:string; name?:string }>('/api/auth/me')
        if (me?.id) { setLoggedIn(true); setUserName(me.name) }
      } catch {
        setLoggedIn(false)
      }
    })()
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout') } catch {}
    setLoggedIn(false)
    setUserName(undefined)
    showToast('로그아웃되었습니다.')
  }

  const toggleFavorite = (cafeId: number) => {
    setFavorites(prev => (prev.includes(cafeId) ? prev.filter(id => id !== cafeId) : [...prev, cafeId]))
  }

  const openDetailsWithMap = (cafe: Cafe) => setSelectedCafe(cafe)

  const handleMapResults = (cafes: Cafe[], title?: string) => {
    setSearchCafes(cafes)
    setSearchTitle(title)
  }

  type Page = 'intro'|'main'|'resources'|'map'|'community'|'profile'
  const go: (p: Page) => void = (p) => setCurrentPage(p)

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'main':
        return <MainPage rainVideo={rainVideo} onNavigate={go} />
      case 'resources':
        return (
          <ResourcesPage
            cafes={(searchCafes && searchCafes.length) ? searchCafes : sampleCafes}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenDetails={openDetailsWithMap}
            title={searchCafes.length ? (searchTitle || undefined) : undefined}
          />
        )
      case 'map':
        return <KakaoMapPage onResults={handleMapResults} />
      case 'community':
        return (
          <CommunityPage
            cafes={(searchCafes && searchCafes.length) ? searchCafes : sampleCafes}
            loggedIn={loggedIn}
            userName={userName}
            onOpenAuth={() => { setIsSignup(false); setShowAuth(true) }}
          />
        )
      case 'profile':
        return (
          <ProfilePage
            favorites={favorites}
            cafes={(searchCafes && searchCafes.length) ? searchCafes : sampleCafes}
            loggedIn={loggedIn}
            onOpenAuth={() => { setIsSignup(false); setShowAuth(true) }}
          />
        )
      default:
        return <MainPage rainVideo={rainVideo} onNavigate={go} />
    }
  }

  if (showIntro) {
    return (
      <IntroPage studyVideo={studyVideo} text={typed} onClose={() => { setShowIntro(false); setCurrentPage('main') }} />
    )
  }

  return (
    <div className="App">
      <Navigation
        onNavigate={go}
        onOpenAuth={() => { setIsSignup(false); setShowAuth(true) }}
        loggedIn={loggedIn}
        userName={userName}
        onLogout={handleLogout}
      />
      {renderCurrentPage()}
      <Footer />
      {selectedCafe && <CafeDetailModal cafe={selectedCafe} onClose={() => setSelectedCafe(null)} />}
      {showAuth && (
        <AuthModal
          isSignup={isSignup}
          onClose={() => setShowAuth(false)}
          onToggleMode={() => setIsSignup(v => !v)}
          onAuthed={(u) => { setLoggedIn(true); setUserName(u?.name || userName); showToast('로그인 완료! 환영해요 ☕️') }}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}

export default App
