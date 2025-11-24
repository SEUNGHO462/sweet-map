import React from 'react'
import '../styles/IntroPage.css'

interface Props {
  studyVideo: string
  text: string
  onClose: () => void
}

const IntroPage: React.FC<Props> = ({ studyVideo, text, onClose }) => (
  <div className="intro-screen" onClick={onClose}>
    <video className="intro-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
      <source src={studyVideo} type="video/mp4" />
    </video>
    <div className="intro-blur" />
    <div className="intro-center">
      <div className="intro-text">{text}</div>
      <div className="intro-sub">Tap to continue</div>
    </div>
  </div>
)

export default IntroPage
