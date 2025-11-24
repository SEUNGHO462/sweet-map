import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../styles/CommunityPage.css'
import type { Cafe } from '../types/cafe'
import { sampleCafes } from '../data/sampleCafes'
import { Plus, Heart } from 'lucide-react'
import { api } from '../lib/api'

type Review = {
  id: string
  cafeId: number
  rating: number // 1~5
  text: string
  photo?: string
  author: string
  createdAt: string
  likes?: number
}

type CommentEntry = { author: string; text: string; timestamp: string }

const DRAFT_KEY = 'sm_review_drafts_v1'
const COMMENTS_KEY = 'sm_review_comments_v1'

interface Props {
  cafes?: Cafe[]
  loggedIn?: boolean
  userName?: string
  onOpenAuth?: () => void
}

const CommunityPage: React.FC<Props> = ({ cafes: cafesProp, loggedIn = false, userName, onOpenAuth }) => {
  const cafes: Cafe[] = (cafesProp && cafesProp.length ? cafesProp : sampleCafes)

  const [reviews, setReviews] = useState<Review[]>([])
  const [cafeId, setCafeId] = useState<number>(cafes[0]?.id ?? 0)
  const [rating, setRating] = useState<number>(5)
  const [text, setText] = useState('')
  const [sortBy, setSortBy] = useState<'new'|'rating'>('new')
  const [minRating, setMinRating] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const composerRef = useRef<HTMLDivElement | null>(null)
  const messageRef = useRef<HTMLTextAreaElement | null>(null)
  const [drafts, setDrafts] = useState<Review[]>([])
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [draftRating, setDraftRating] = useState(5)
  const [draftCafeId, setDraftCafeId] = useState<number>(cafes[0]?.id ?? 0)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, CommentEntry[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})

  const mapReviewFromApi = (data: any): Review => ({
    id: data.id,
    cafeId: typeof data.cafeId === 'number' ? data.cafeId : Number(data.cafeId),
    rating: data.rating,
    text: data.text,
    author: data.authorName || 'Guest',
    createdAt: data.createdAt,
    likes: data.likes ?? 0,
  })

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<any[]>('/api/reviews')
      setReviews(data.map(mapReviewFromApi))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    try {
      const rawDrafts = localStorage.getItem(DRAFT_KEY)
      if (rawDrafts) setDrafts(JSON.parse(rawDrafts))
    } catch {/* noop */}
  }, [])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMENTS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Array<string | CommentEntry>>
        const normalized: Record<string, CommentEntry[]> = {}
        Object.entries(parsed).forEach(([key, list]) => {
          normalized[key] = list.map(item => typeof item === 'string'
            ? { author: 'Guest', text: item, timestamp: new Date().toISOString() }
            : item)
        })
        setComments(normalized)
      }
    } catch {/* noop */}
  }, [])
  useEffect(() => {
    try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments)) } catch {/* noop */}
  }, [comments])
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)) } catch {/* noop */}
  }, [drafts])
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const showStatus = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  const requireLogin = () => {
    if (!loggedIn) {
      setLoginPrompt(true)
      return true
    }
    return false
  }

  const addReview = async () => {
    if (requireLogin()) return
    const body = text.trim()
    if (!cafeId || !body) return
    try {
      const saved = await api.post<any>('/api/reviews', {
        cafe_id: cafeId,
        rating,
        text: body,
      })
      const mapped = mapReviewFromApi(saved)
      setReviews(r => [mapped, ...r])
      setText('')
      setRating(5)
      showStatus('리뷰가 저장됐어요 ☕️')
    } catch (err: any) {
      showStatus(err?.message || '리뷰 저장 실패')
    }
  }

  const filtered = useMemo(() => {
    const arr = reviews.filter(r => r.rating >= minRating)
    return [...arr].sort((a,b) => sortBy === 'new' ? (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : (b.rating - a.rating))
  }, [reviews, sortBy, minRating])

  const cafeById = (id: number) => cafes.find(c => c.id === id)

  useEffect(() => {
    if (!cafes.length) return
    if (!cafes.some(c => c.id === cafeId)) setCafeId(cafes[0].id)
  }, [cafes])

  const addDraft = () => {
    if (requireLogin()) return
    const snippet = draftText.trim()
    if (!snippet) return
    const draft: Review = {
      id: Math.random().toString(36).slice(2),
      cafeId: draftCafeId,
      rating: draftRating,
      text: snippet,
      author: 'Draft',
      createdAt: new Date().toISOString(),
    }
    setDrafts(prev => [draft, ...prev])
    setDraftText('')
    setDraftRating(5)
    setShowDraftModal(false)
    showStatus('임시 메모 저장됨 ☕️')
  }

  const toggleLike = (id: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== id) return r
      const liked = likedReviews[id]
      const nextLikes = Math.max(0, (r.likes ?? 0) + (liked ? -1 : 1))
      return { ...r, likes: nextLikes }
    }))
    setLikedReviews(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const addComment = (id: string) => {
    if (requireLogin()) return
    const body = (commentInputs[id] || '').trim()
    if (!body) return
    const entry: CommentEntry = {
      author: userName || 'Guest',
      text: body,
      timestamp: new Date().toISOString(),
    }
    setComments(prev => {
      const next = { ...prev }
      next[id] = [entry, ...(next[id] || [])]
      return next
    })
    setCommentInputs(prev => ({ ...prev, [id]: '' }))
    showStatus('댓글이 추가됐어요 ☕️')
  }

  const applyDraft = (id: string) => {
    const draft = drafts.find(d => d.id === id)
    if (!draft) return
    setCafeId(draft.cafeId)
    setRating(draft.rating)
    setText(draft.text)
    setDrafts(prev => prev.filter(d => d.id !== id))
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => messageRef.current?.focus(), 250)
  }

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const composerForm = (
      <div className="composer-card" ref={composerRef}>
      <div className="composer-grid two">
        <select className="auth-input" value={cafeId} onChange={e=>setCafeId(Number((e.target as HTMLSelectElement).value))}>
          {cafes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="auth-input" value={rating} onChange={e=>setRating(Number((e.target as HTMLSelectElement).value))}>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
        </select>
      </div>
      <textarea
        className="auth-input"
        rows={3}
        placeholder="카페 경험을 감성 가득 알려주세요!"
        value={text}
        ref={messageRef}
        onChange={e=>setText((e.target as HTMLTextAreaElement).value)}
      />
      <div className="composer-actions">
        <button className="btn-ghost" onClick={addReview}>리뷰 작성</button>
      </div>
      {drafts.length > 0 && (
        <div className="draft-list">
          <div className="draft-header">임시 저장 {drafts.length}건</div>
          {drafts.map(d => (
            <div key={d.id} className="draft-item">
              <div>
                <strong>{cafeById(d.cafeId)?.name || '카페'}</strong>
                <span>{d.text.slice(0, 50)}{d.text.length > 50 ? '…' : ''}</span>
              </div>
              <div className="draft-actions">
                <button onClick={() => applyDraft(d.id)}>불러오기</button>
                <button onClick={() => removeDraft(d.id)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="community-page">
      <div className="page-header">
        <h1>Community · Reviews</h1>
        <p>카페 방문 이야기를 공유하고, 다른 사람들의 리뷰로 영감을 받아보세요.</p>
      </div>

      <div className="community-shell">
        {composerForm}
        <div className="community-filters">
          <label>정렬</label>
          <select className="auth-input" value={sortBy} onChange={e=>setSortBy((e.target as HTMLSelectElement).value as any)}>
            <option value="new">최신순</option>
            <option value="rating">평점 높은순</option>
          </select>
          <label>최소 평점</label>
          <select className="auth-input" value={minRating} onChange={e=>setMinRating(Number((e.target as HTMLSelectElement).value))}>
            <option value={0}>전체</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}점 이상</option>)}
          </select>
        </div>

        <div className="community-grid">
          {loading && Array.from({ length: 3 }).map((_, idx) => (
            <div className="community-card skeleton" key={`sk-${idx}`}>
              <div className="skeleton-avatar" />
              <div className="skeleton-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
          ))}
          {!loading && filtered.map(r => {
            const cafe = cafeById(r.cafeId)
            return (
              <div key={r.id} className="community-card">
                <div className="card-top">
                  <div className="thumb">
                    <img src={r.photo || cafe?.image} alt={cafe?.name} referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                  <div className="card-header">
                    <div className="card-meta">
                      <h3>{cafe?.name || 'Unknown Cafe'}</h3>
                      <span className="author">@{r.author}</span>
                      <span className="date">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="rating-pill">
                      <span>{'★'.repeat(r.rating)}</span>
                      <small>{r.rating}.0</small>
                    </div>
                  </div>
                </div>
                <p className="card-text">{r.text}</p>
                {r.photo && (
                  <div className="photo-preview">
                    <img src={r.photo} alt="review" loading="lazy" />
                  </div>
                )}
                <div className="card-reactions">
                  <button
                    className={`reaction-btn ${likedReviews[r.id] ? 'active' : ''}`}
                    onClick={() => toggleLike(r.id)}
                  >
                    <Heart size={14} />
                    <span>{r.likes ?? 0}</span>
                  </button>
                </div>
                <div className="comment-area">
                  <div className="comment-warning">욕설·비방 댓글은 삭제될 수 있습니다.</div>
                  <div className="comment-list">
                    {(expandedComments[r.id] ? (comments[r.id] || []) : (comments[r.id] || []).slice(0,3)).map((c, idx) => (
                      <div key={`${r.id}-c-${idx}`} className="comment-item">
                        <div className="comment-avatar">{c.author?.trim().charAt(0).toUpperCase() || 'G'}</div>
                        <div className="comment-body">
                          <strong className="comment-author">{c.author}</strong>
                          <span>{c.text}</span>
                          <em>{new Date(c.timestamp).toLocaleString()}</em>
                        </div>
                      </div>
                    ))}
                    {(comments[r.id] || []).length === 0 && (
                      <div className="comment-empty">첫 댓글을 남겨보세요.</div>
                    )}
                    {(comments[r.id] || []).length > 3 && (
                      <button className="comment-toggle" onClick={() => setExpandedComments(prev => ({ ...prev, [r.id]: !prev[r.id] }))}>
                        {expandedComments[r.id] ? '접기' : '모두 보기'}
                      </button>
                    )}
                  </div>
                  <div className="comment-input">
                    <small>Enter로 등록됩니다.</small>
                    <input
                      value={commentInputs[r.id] || ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [r.id]: (e.target as HTMLInputElement).value }))}
                      placeholder="댓글 작성..."
                      onKeyDown={e => { if (e.key === 'Enter') addComment(r.id) }}
                    />
                    <button onClick={() => addComment(r.id)}>등록</button>
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && !filtered.length && (
            <div className="cafe-card dark" style={{ padding:12, color:'#e9e9ec' }}>아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!</div>
          )}
        </div>
      </div>

      <button
        className="quick-write-btn"
        onClick={() => {
          if (requireLogin()) return
          setShowDraftModal(true)
        }}
      >
        <Plus size={20} />
        <span>임시 메모</span>
      </button>
      {showDraftModal && (
        <div className="composer-modal">
          <div className="composer-sheet">
            <button className="close-sheet" onClick={() => setShowDraftModal(false)}>×</button>
            <h3>임시 메모</h3>
            <div className="composer-grid">
              <select className="auth-input" value={draftCafeId} onChange={e=>setDraftCafeId(Number((e.target as HTMLSelectElement).value))}>
                {cafes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="auth-input" value={draftRating} onChange={e=>setDraftRating(Number((e.target as HTMLSelectElement).value))}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </div>
            <textarea className="auth-input" rows={3} placeholder="간단 메모를 남겨두세요" value={draftText} onChange={e=>setDraftText((e.target as HTMLTextAreaElement).value)} />
            <div className="composer-actions">
              <button className="btn-ghost" onClick={addDraft}>임시저장</button>
            </div>
          </div>
        </div>
      )}
      <div className={`community-toast${toast ? ' show' : ''}`}>
        {toast}
      </div>
      {loginPrompt && (
        <div className="login-overlay">
          <div className="login-panel">
            <h3>로그인이 필요합니다</h3>
            <p>커뮤니티에 글을 남기기 위해서는 로그인이 필요해요.</p>
            <div className="login-panel-actions">
              <button onClick={() => { onOpenAuth?.(); setLoginPrompt(false) }}>로그인 하러가기</button>
              <button onClick={() => setLoginPrompt(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommunityPage
