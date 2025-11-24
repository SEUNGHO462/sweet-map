import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd'
import type { Cafe } from '../types/cafe'
import '../styles/ResourcesPage.css'
import { api } from '../lib/api'

type Plan = {
  id: string
  title: string
  cafeId?: number
  date?: string
  time?: string
  createdAt: string
  items: { id: string; text: string; done: boolean }[]
}

type Activity = {
  id: string
  type: 'created' | 'completed'
  title: string
  cafeName?: string
  timestamp: string
}

interface Props {
  favorites: number[]
  cafes: Cafe[]
  loggedIn?: boolean
  onOpenAuth?: () => void
}

const LS_KEY = 'sm_plans_v1'
const ACTIVITY_KEY = 'sm_plan_activity_v1'

const ConfettiBurst: React.FC = () => (
  <div className="plan-confetti">
    {Array.from({ length: 6 }).map((_, idx) => (
      <span key={idx} className={`spark spark-${idx}`} />
    ))}
  </div>
)

const ProfilePage: React.FC<Props> = ({ favorites, cafes, loggedIn = false, onOpenAuth }) => {
  const [tab, setTab] = useState<'favorites' | 'planner'>('favorites')
  const [plannerSaveState, setPlannerSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [plansLoaded, setPlansLoaded] = useState(false)

  const favCafes = useMemo(() => cafes.filter(c => favorites.includes(c.id)), [favorites, cafes])
  const cafeMap = useMemo(() => {
    const map = new Map<number, Cafe>()
    cafes.forEach(cafe => map.set(cafe.id, cafe))
    return map
  }, [cafes])

  const [plans, setPlans] = useState<Plan[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [celebratePlan, setCelebratePlan] = useState<string | null>(null)
  const celebrateTimer = useRef<NodeJS.Timeout | null>(null)
  const syncTimer = useRef<NodeJS.Timeout | null>(null)

  // 최초 로드: 로그인 상태면 서버에서 동기화, 아니면 로컬스토리지 사용
  useEffect(() => {
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(LS_KEY)
        if (raw) {
          const parsed: Plan[] = JSON.parse(raw)
          setPlans(parsed.map(plan => ({ ...plan, createdAt: plan.createdAt || new Date().toISOString() })))
        } else {
          setPlans([])
        }
      } catch {
        setPlans([])
      }
      setPlansLoaded(true)
      setPlannerSaveState('idle')
    }

    if (!loggedIn) {
      loadLocal()
      return
    }

    setPlansLoaded(false)
    ;(async () => {
      try {
        const serverPlans = await api.get<any[]>('/api/plans')
        setPlans(
          serverPlans.map(plan => ({
            id: plan.id,
            title: plan.title,
            cafeId: typeof plan.cafeId === 'number' ? plan.cafeId : undefined,
            date: plan.date ? plan.date.slice(0, 10) : undefined,
            time: plan.timeText || '',
            createdAt: plan.createdAt,
            items: (plan.items || []).map((item: any) => ({
              id: item.id,
              text: item.text,
              done: Boolean(item.done),
            })),
          }))
        )
        setPlannerSaveState('saved')
      } catch (err) {
        console.error(err)
        loadLocal()
        return
      } finally {
        setPlansLoaded(true)
      }
    })()
  }, [loggedIn])

  // 플랜 변경 시 로컬스토리지 저장 + 서버 동기화
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(plans))
    } catch {
      /* ignore */
    }

    if (!loggedIn || !plansLoaded) return

    setPlannerSaveState('saving')
    if (syncTimer.current) clearTimeout(syncTimer.current)

    syncTimer.current = setTimeout(async () => {
      try {
        const payload = plans.map(plan => ({
          id: plan.id,
          title: plan.title,
          cafeId: plan.cafeId ?? null,
          date: plan.date || null,
          timeText: plan.time || null,
          items: plan.items.map((item, index) => ({
            id: item.id,
            text: item.text,
            done: item.done,
            order: index,
          })),
        }))
        await api.put('/api/plans/sync', { plans: payload })
        setPlannerSaveState('saved')
      } catch (err) {
        console.error(err)
        setPlannerSaveState('error')
      }
    }, 800)
  }, [plans, loggedIn, plansLoaded])

  // 활동 로그 로컬 저장
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVITY_KEY)
      if (raw) setActivities(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities))
    } catch {
      /* ignore */
    }
  }, [activities])

  useEffect(
    () => () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current)
      if (syncTimer.current) clearTimeout(syncTimer.current)
    },
    []
  )

  const requireLogin = () => {
    if (!loggedIn) {
      onOpenAuth?.()
      return true
    }
    return false
  }

  const pushActivity = (entry: Activity) => {
    setActivities(prev => {
      const next = [entry, ...prev]
      return next.slice(0, 8)
    })
  }

  const createPlan = (cafe?: Cafe) => {
    if (requireLogin()) return
    const id = Math.random().toString(36).slice(2)
    const createdAt = new Date().toISOString()
    const title = cafe ? `${cafe.name} 방문 계획` : '나만의 방문 계획'
    setPlans(prev => [
      {
        id,
        title,
        cafeId: cafe?.id,
        createdAt,
        items: [],
      },
      ...prev,
    ])
    pushActivity({
      id,
      type: 'created',
      title,
      cafeName: cafe?.name,
      timestamp: createdAt,
    })
  }

  const addItem = (planId: string, text: string) => {
    if (requireLogin()) return
    setPlans(prev =>
      prev.map(plan =>
        plan.id === planId
          ? {
              ...plan,
              items: [...plan.items, { id: Math.random().toString(36).slice(2), text, done: false }],
            }
          : plan
      )
    )
  }

  const toggleItem = (planId: string, itemId: string) => {
    if (requireLogin()) return
    setPlans(prev =>
      prev.map(plan =>
        plan.id === planId
          ? {
              ...plan,
              items: plan.items.map(item =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            }
          : plan
      )
    )
  }

  const removePlan = (planId: string) => {
    if (requireLogin()) return
    setPlans(prev => prev.filter(plan => plan.id !== planId))
  }

  const completePlan = (planId: string) => {
    if (requireLogin()) return
    const target = plans.find(plan => plan.id === planId)
    if (!target) return

    setPlans(prev =>
      prev.map(plan =>
        plan.id === planId
          ? { ...plan, items: plan.items.map(item => ({ ...item, done: true })) }
          : plan
      )
    )

    const timestamp = new Date().toISOString()
    pushActivity({
      id: `${planId}-completed-${timestamp}`,
      type: 'completed',
      title: target.title,
      cafeName: target.cafeId ? cafeMap.get(target.cafeId)?.name : undefined,
      timestamp,
    })

    setCelebratePlan(planId)
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current)
    celebrateTimer.current = setTimeout(() => setCelebratePlan(null), 2500)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    setPlans(prev => {
      const next = prev.map(plan => ({ ...plan }))
      const sourcePlanIndex = next.findIndex(plan => plan.id === source.droppableId)
      const destinationPlanIndex = next.findIndex(plan => plan.id === destination.droppableId)
      if (sourcePlanIndex === -1 || destinationPlanIndex === -1) return prev

      const sourceItems = [...next[sourcePlanIndex].items]
      const [moved] = sourceItems.splice(source.index, 1)
      if (!moved) return prev

      if (source.droppableId === destination.droppableId) {
        sourceItems.splice(destination.index, 0, moved)
        next[sourcePlanIndex] = { ...next[sourcePlanIndex], items: sourceItems }
      } else {
        const destinationItems = [...next[destinationPlanIndex].items]
        destinationItems.splice(destination.index, 0, moved)
        next[sourcePlanIndex] = { ...next[sourcePlanIndex], items: sourceItems }
        next[destinationPlanIndex] = { ...next[destinationPlanIndex], items: destinationItems }
      }

      return next
    })
  }

  const completedActivities = activities.filter(act => act.type === 'completed')

  const favoritesContent = (
    <div className="favorites-section">
      {favCafes.length === 0 ? (
        <div className="favorites-empty">
          아직 담아둔 카페가 없어요. 마음에 드는 카페를 찜한 뒤 바로 플랜으로 만들 수 있어요.
        </div>
      ) : (
        <div className="favorites-grid">
          {favCafes.map(cafe => (
            <div key={cafe.id} className="favorite-card">
              <img src={cafe.image} alt={cafe.name} loading="lazy" referrerPolicy="no-referrer" />
              <div className="favorite-info">
                <h3>{cafe.name}</h3>
                <p>{cafe.address || cafe.location}</p>
                <button className="btn-ghost" onClick={() => createPlan(cafe)}>
                  이 카페로 플랜 만들기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const plannerContent = (
    <div className="planner-section">
      <div className="planner-toolbar">
        <div>
          <h2>나의 방문 플래너</h2>
          <p>체크리스트와 날짜를 기록하고, D-데이 배지로 남은 일정을 확인하세요.</p>
        </div>
        <div className="planner-actions-top">
          <div className="planner-status">
            {plannerSaveState === 'saving' && '저장 중...'}
            {plannerSaveState === 'saved' && '동기화 완료'}
            {plannerSaveState === 'idle' && '대기 중'}
            {plannerSaveState === 'error' && '저장 오류'}
          </div>
          <button
            className="btn-ghost"
            onClick={() => createPlan()}
            disabled={!loggedIn}
            aria-disabled={!loggedIn}
          >
            새 계획
          </button>
        </div>
      </div>

      {loggedIn && completedActivities.length > 0 && (
        <div className="activity-feed">
          <div className="activity-header">
            <h3>최근 활동</h3>
          </div>
          <div className="activity-list">
            {completedActivities.map(activity => (
              <div key={activity.id} className={`activity-item ${activity.type}`}>
                <div>
                  <div className="activity-title">
                    {activity.type === 'created' ? '계획 생성' : '계획 완료'}
                  </div>
                  <div className="activity-desc">
                    <strong>{activity.title}</strong>
                    {activity.cafeName ? (
                      <span className="activity-cafe">@{activity.cafeName}</span>
                    ) : null}
                  </div>
                </div>
                <div className="activity-time">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loggedIn && completedActivities.length === 0 && activities.length > 0 && (
        <div className="activity-feed">
          <div className="activity-header">
            <h3>최근 활동</h3>
          </div>
          <div className="activity-list">
            <div className="activity-empty">완료된 활동이 아직 없어요.</div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="planner-grid">
          {plans
            .slice()
            .sort((a, b) => {
              if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime()
              if (a.date) return -1
              if (b.date) return 1
              return 0
            })
            .map(plan => {
              const linkedCafe = plan.cafeId ? cafeMap.get(plan.cafeId) : undefined
              const completed = plan.items.filter(it => it.done).length
              const percent = plan.items.length ? Math.round((completed / plan.items.length) * 100) : 0
              const daysLeft = plan.date
                ? Math.ceil((new Date(plan.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <div key={plan.id} className="planner-card">
                  {celebratePlan === plan.id && <ConfettiBurst />}
                  <div className="planner-head">
                    <div className="planner-head-left">
                      <input
                        className="planner-title"
                        value={plan.title}
                        onChange={e =>
                          !requireLogin() &&
                          setPlans(prev =>
                            prev.map(p =>
                              p.id === plan.id ? { ...p, title: (e.target as HTMLInputElement).value } : p
                            )
                          )
                        }
                        disabled={!loggedIn}
                      />
                      <div className="planner-meta">
                        <input
                          className="auth-input"
                          type="date"
                          value={plan.date || ''}
                          onChange={e =>
                            !requireLogin() &&
                            setPlans(prev =>
                              prev.map(p =>
                                p.id === plan.id
                                  ? { ...p, date: (e.target as HTMLInputElement).value }
                                  : p
                              )
                            )
                          }
                          disabled={!loggedIn}
                        />
                        <input
                          className="auth-input"
                          type="time"
                          value={plan.time || ''}
                          onChange={e =>
                            !requireLogin() &&
                            setPlans(prev =>
                              prev.map(p =>
                                p.id === plan.id
                                  ? { ...p, time: (e.target as HTMLInputElement).value }
                                  : p
                              )
                            )
                          }
                          disabled={!loggedIn}
                        />
                      </div>
                    </div>
                    {linkedCafe && (
                      <div className="planner-thumb">
                        <img
                          src={linkedCafe.image}
                          alt={linkedCafe.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                  {linkedCafe && (
                    <div className="planner-cafe">
                      <strong>{linkedCafe.name}</strong>
                      <span>{linkedCafe.address || linkedCafe.location}</span>
                    </div>
                  )}
                  {daysLeft !== null && (
                    <div className={`planner-badge ${daysLeft < 0 ? 'past' : ''}`}>
                      {daysLeft < 0 ? `+${Math.abs(daysLeft)}일 지남` : daysLeft === 0 ? '오늘' : `D-${daysLeft}`}
                    </div>
                  )}
                  <div className="planner-progress">
                    <div className="progress-label">진행률 {percent}%</div>
                    <div className="progress-bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  {percent === 100 && (
                    <div className="planner-complete">
                      <span>모든 체크리스트를 완료하면 방문 계획이 완료 상태로 표시돼요.</span>
                      <button onClick={() => completePlan(plan.id)}>계획 완료 처리</button>
                    </div>
                  )}
                  <Droppable droppableId={plan.id}>
                    {provided => (
                      <div
                        className="planner-checklist"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {plan.items.map((item, idx) => (
                          <Draggable draggableId={`${plan.id}-${item.id}`} index={idx} key={item.id}>
                            {(dragProvided, snapshot) => (
                              <label
                                className={`planner-item ${item.done ? 'done' : ''} ${
                                  snapshot.isDragging ? 'dragging' : ''
                                }`}
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.done}
                                  onChange={() => toggleItem(plan.id, item.id)}
                                  disabled={!loggedIn}
                                />
                                <span>{item.text}</span>
                              </label>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  <div className="planner-actions">
                    <input
                      className="auth-input"
                      placeholder="체크리스트 추가"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim()
                          if (value) {
                            addItem(plan.id, value)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                      disabled={!loggedIn}
                    />
                    <button
                      className="btn-ghost"
                      onClick={() => removePlan(plan.id)}
                      disabled={!loggedIn}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}

          {!plans.length && (
            <div className="planner-empty">
              아직 저장된 플랜이 없어요. 위의 버튼으로 새 계획을 만들어보세요.
            </div>
          )}
        </div>
      </DragDropContext>
    </div>
  )

  return (
    <div className="profile-page">
      <div className="profile-tabs">
        <button
          className={`profile-tab ${tab === 'favorites' ? 'active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          찜한 카페
        </button>
        <button
          className={`profile-tab ${tab === 'planner' ? 'active' : ''}`}
          onClick={() => setTab('planner')}
        >
          플래너
        </button>
      </div>

      <div className="profile-content">
        {tab === 'favorites' ? favoritesContent : plannerContent}
      </div>
    </div>
  )
}

export default ProfilePage
