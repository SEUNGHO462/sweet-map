import React from 'react'
import { Coffee, Menu, X } from 'lucide-react'
import ConfirmModal from './ConfirmModal'

type Page = 'intro'|'main'|'resources'|'map'|'community'|'profile'

interface Props {
  onNavigate: (p: Page) => void
  onOpenAuth: () => void
  loggedIn?: boolean
  onLogout?: () => void
  userName?: string
}

const Navigation: React.FC<Props> = ({ onNavigate, onOpenAuth, loggedIn, onLogout, userName }) => {
  const [open, setOpen] = React.useState(false)
  const [askLogout, setAskLogout] = React.useState(false)
  const [profileMenu, setProfileMenu] = React.useState(false)
  const [shrink, setShrink] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const lastScroll = React.useRef(0)

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY || 0
      const goingDown = current > lastScroll.current + 6
      const goingUp = current < lastScroll.current - 6

      if (goingDown && current > 90) {
        setShrink(true)
      } else if (goingUp || current <= 20) {
        setShrink(false)
      }

      lastScroll.current = current
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const avatar = userName ? userName.trim().charAt(0).toUpperCase() : 'M'

  const handleLogout = () => {
    setProfileMenu(false)
    setAskLogout(true)
  }

  return (
    <>
      <nav className={`navbar${shrink ? ' navbar-shrink' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand" onClick={() => onNavigate('main')}>
            <Coffee className="brand-icon" />
            <span>SWEET MAP</span>
          </div>
          <div className="desktop-nav">
            <button onClick={() => onNavigate('resources')}>Cafe</button>
            <button onClick={() => onNavigate('map')}>Map</button>
            <button onClick={() => onNavigate('community')}>Community</button>
            <button onClick={() => onNavigate('profile')}>My</button>
            {loggedIn ? (
              <div className="profile-menu" ref={menuRef}>
                <button className="profile-chip" onClick={() => setProfileMenu(v => !v)}>
                  <span className="profile-avatar">{avatar}</span>
                  <span className="profile-name">{userName ? `${userName} 님` : '로그인됨'}</span>
                </button>
                {profileMenu && (
                  <div className="profile-dropdown">
                    <button onClick={() => { setProfileMenu(false); onNavigate('profile') }}>프로필</button>
                    <button onClick={handleLogout}>로그아웃</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-pill" onClick={onOpenAuth}>로그인</button>
            )}
          </div>
          <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {open && (
          <div className="mobile-menu show">
            <button onClick={() => { onNavigate('resources'); setOpen(false) }}>Cafe</button>
            <button onClick={() => { onNavigate('community'); setOpen(false) }}>Community</button>
            <button onClick={() => { onNavigate('map'); setOpen(false) }}>Map</button>
            <button onClick={() => { onNavigate('profile'); setOpen(false) }}>My</button>
            <div className="mobile-auth">
              {loggedIn ? (
                <button onClick={() => { setOpen(false); handleLogout() }}>로그아웃</button>
              ) : (
                <button onClick={() => { onOpenAuth(); setOpen(false) }}>로그인</button>
              )}
            </div>
          </div>
        )}
      </nav>

      <ConfirmModal
        open={askLogout}
        title="로그아웃"
        message="로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        onCancel={() => setAskLogout(false)}
        onConfirm={() => { setAskLogout(false); onLogout?.() }}
      />
    </>
  )
}

export default Navigation
