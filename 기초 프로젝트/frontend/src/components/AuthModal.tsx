import React, { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../lib/api'

interface Props {
  isSignup: boolean
  onClose: () => void
  onToggleMode: () => void
  onAuthed?: (user: { id: string; email: string; name?: string | null }) => void
}

const AuthModal: React.FC<Props> = ({ isSignup, onClose, onToggleMode, onAuthed }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    try {
      setLoading(true)
      setError(null)
      let user
      if (isSignup) {
        if (!name.trim()) { setError('이름을 입력해 주세요.'); return }
        if (password !== confirm) { setError('비밀번호 확인이 일치하지 않습니다.'); return }
        user = await api.post('/api/auth/register', { email, password, name })
      } else {
        user = await api.post('/api/auth/login', { email, password })
      }
      if (user && typeof user === 'object') {
        onAuthed?.(user as any)
      } else {
        onAuthed?.({ id: '', email, name })
      }
      onClose()
    } catch (e: any) {
      setError(e?.message || '인증에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={20}/></button>
        <div className="auth-header">
          <h2 className="auth-title">{isSignup ? 'Sign up' : 'Sign in'}</h2>
        </div>
        <div className="auth-fields">
          {error && (
            <div style={{
              marginBottom:8,
              background:'#3b1d20',
              color:'#ffb4b4',
              border:'1px solid #5c2a30',
              borderRadius:6,
              padding:'8px 10px',
              fontSize:13
            }}>{error}</div>
          )}
          {isSignup && (<input className="auth-input" placeholder="이름" value={name} onChange={e=>setName((e.target as HTMLInputElement).value)} />)}
          <input className="auth-input" type="email" placeholder="이메일" value={email} onChange={e=>setEmail((e.target as HTMLInputElement).value)} />
          <input className="auth-input" type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword((e.target as HTMLInputElement).value)} />
          {isSignup && (<input className="auth-input" type="password" placeholder="비밀번호 확인" value={confirm} onChange={e=>setConfirm((e.target as HTMLInputElement).value)} />)}
          <button className="auth-submit" onClick={submit} disabled={loading}>{isSignup ? '회원 가입' : '로그인'}</button>
          <div className="auth-toggle-line">
            {isSignup ? (
              <span>이미 계정이 있나요? <button className="linklike" onClick={onToggleMode}>로그인</button></span>
            ) : (
              <span>계정이 없나요? <button className="linklike" onClick={onToggleMode}>회원 가입</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal

