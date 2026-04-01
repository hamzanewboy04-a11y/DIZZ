import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Project, User } from './types/domain'
import type { Creative, CreativeDetailDto, CreativeStatus } from './types/creatives'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

async function requestJson<T>(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message ?? `${url} -> ${res.status}`)
  }
  return res.json()
}

type RoleView = 'buyer' | 'hod' | 'designer'
type BoardColumn = {
  key: string
  title: string
  statuses: CreativeStatus[]
}

const BOARD_COLUMNS: BoardColumn[] = [
  { key: 'new', title: 'Новые', statuses: ['draft'] },
  { key: 'assigned', title: 'Назначено', statuses: ['sent_to_designer'] },
  { key: 'progress', title: 'В работе', statuses: ['in_progress', 'revision'] },
  { key: 'review', title: 'Проверка', statuses: ['review'] },
  { key: 'done', title: 'Готово', statuses: ['completed'] },
]

const STATUS_LABELS: Record<CreativeStatus, string> = {
  draft: 'Новая',
  sent_to_designer: 'Назначена',
  in_progress: 'В работе',
  review: 'На проверке',
  revision: 'Доработка',
  completed: 'Готово',
}

const PRIORITY_LABELS: Record<string, string> = {
  normal: 'Норм',
  fast: 'Быстро',
  urgent: 'Срочно',
  critical: 'Критично',
}

function App() {
  const [me, setMe] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [assignedCreatives, setAssignedCreatives] = useState<Creative[]>([])
  const [myCreatives, setMyCreatives] = useState<Creative[]>([])
  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null)
  const [selectedCreativeDetail, setSelectedCreativeDetail] = useState<CreativeDetailDto | null>(null)
  const [view, setView] = useState<RoleView>('hod')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const refreshCreatives = async () => {
    const [all, assigned, mine] = await Promise.all([
      getJson<Creative[]>('/api/creative-requests'),
      getJson<Creative[]>('/api/creative-requests/assigned'),
      getJson<Creative[]>('/api/creative-requests/my'),
    ])
    setCreatives(all)
    setAssignedCreatives(assigned)
    setMyCreatives(mine)
  }

  const refreshDetail = async (id: number) => {
    setSelectedCreativeDetail(await getJson<CreativeDetailDto>(`/api/creative-requests/${id}`))
  }

  useEffect(() => {
    Promise.all([
      getJson<User>('/api/me'),
      getJson<Project[]>('/api/projects'),
      getJson<User[]>('/api/users'),
      refreshCreatives(),
    ])
      .then(([meData, projectsData, usersData]) => {
        setMe(meData)
        setProjects(projectsData)
        setUsers(usersData)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selectedCreativeId && creatives.length > 0) setSelectedCreativeId(creatives[0].id)
  }, [creatives, selectedCreativeId])

  useEffect(() => {
    if (!selectedCreativeId) return
    setLoading(true)
    refreshDetail(selectedCreativeId)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedCreativeId])

  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])
  const userNameById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users])

  const visibleCreatives = useMemo(() => {
    if (view === 'buyer') return myCreatives
    if (view === 'designer') return assignedCreatives
    return creatives
  }, [view, myCreatives, assignedCreatives, creatives])

  const filteredCreatives = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visibleCreatives
    return visibleCreatives.filter((creative) => {
      const projectName = creative.projectId ? projectNameById.get(creative.projectId) ?? '' : ''
      const designerName = creative.assignedToId ? userNameById.get(creative.assignedToId) ?? '' : ''
      const buyerName = userNameById.get(creative.requestedById) ?? ''
      return [creative.internalCode, creative.title, creative.type, projectName, designerName, buyerName]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [visibleCreatives, search, projectNameById, userNameById])

  const boardColumns = useMemo(
    () => BOARD_COLUMNS.map((column) => ({ ...column, items: filteredCreatives.filter((item) => column.statuses.includes(item.status)) })),
    [filteredCreatives],
  )

  const stats = useMemo(() => ({
    total: filteredCreatives.length,
    draft: filteredCreatives.filter((c) => c.status === 'draft').length,
    inProgress: filteredCreatives.filter((c) => ['in_progress', 'revision'].includes(c.status)).length,
    review: filteredCreatives.filter((c) => c.status === 'review').length,
  }), [filteredCreatives])

  const runAction = async (kind: 'assign' | 'take' | 'submitReview' | 'requestRevision' | 'accept') => {
    if (!selectedCreativeDetail) return
    try {
      setActionLoading(kind)
      setError(null)
      const fallbackDesigner = users.find((u) => u.roles.includes('designer'))

      if (kind === 'assign') {
        if (!fallbackDesigner) throw new Error('Нет доступного дизайнера')
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/assign`, 'POST', {
          assigneeId: fallbackDesigner.id,
          actorUserId: me?.id,
          price: selectedCreativeDetail.price ?? '50',
        })
      }
      if (kind === 'take') {
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/take-to-work`, 'POST', {
          actorUserId: me?.id,
        })
      }
      if (kind === 'submitReview') {
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/submit-review`, 'POST', {
          actorUserId: me?.id,
        })
      }
      if (kind === 'requestRevision') {
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/request-revision`, 'POST', {
          actorUserId: me?.id,
          note: 'Нужна доработка',
        })
      }
      if (kind === 'accept') {
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/accept`, 'POST', {
          actorUserId: me?.id,
        })
      }

      await refreshCreatives()
      await refreshDetail(selectedCreativeDetail.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <main className="workspace-shell">
      <aside className="sidebar-shell">
        <div className="sidebar-brand">
          <div className="sidebar-logo">D7</div>
          <div>
            <strong>Design Ops</strong>
            <p>{me?.name ?? 'Загрузка'}</p>
          </div>
        </div>

        <div className="sidebar-block">
          <div className="sidebar-label">Режим</div>
          <div className="view-switcher">
            <button className={view === 'buyer' ? 'active' : ''} onClick={() => setView('buyer')}>Buyer</button>
            <button className={view === 'hod' ? 'active' : ''} onClick={() => setView('hod')}>HoD</button>
            <button className={view === 'designer' ? 'active' : ''} onClick={() => setView('designer')}>Designer</button>
          </div>
        </div>

        <div className="sidebar-block">
          <div className="sidebar-label">Сводка</div>
          <div className="sidebar-stats">
            <div><span>Всего</span><strong>{stats.total}</strong></div>
            <div><span>Новые</span><strong>{stats.draft}</strong></div>
            <div><span>В работе</span><strong>{stats.inProgress}</strong></div>
            <div><span>Проверка</span><strong>{stats.review}</strong></div>
          </div>
        </div>

        <div className="sidebar-block">
          <div className="sidebar-label">Быстрый поиск</div>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Код, проект, дизайнер"
          />
        </div>
      </aside>

      <section className="main-shell">
        <header className="topbar-shell">
          <div>
            <p className="eyebrow">Creative production</p>
            <h1>Очередь креативов</h1>
          </div>
          <div className="topbar-meta">
            <span>{view === 'buyer' ? 'Мои заявки' : view === 'designer' ? 'Мои задачи' : 'Операционная доска'}</span>
            <span>{filteredCreatives.length} задач</span>
          </div>
        </header>

        {error ? <section className="error-banner">{error}</section> : null}

        <section className="board-layout">
          <section className="board-scroll">
            {boardColumns.map((column) => (
              <div key={column.key} className="board-column">
                <div className="board-column-head">
                  <h2>{column.title}</h2>
                  <span>{column.items.length}</span>
                </div>

                <div className="board-column-body">
                  {column.items.length === 0 ? <div className="empty-card">Пусто</div> : null}

                  {column.items.map((creative) => {
                    const active = creative.id === selectedCreativeId
                    return (
                      <button
                        key={creative.id}
                        type="button"
                        className={`task-card${active ? ' active' : ''}`}
                        onClick={() => setSelectedCreativeId(creative.id)}
                      >
                        <div className="task-card-top">
                          <span className="task-code">{creative.internalCode}</span>
                          <span className={`priority-badge priority-${creative.priority}`}>{PRIORITY_LABELS[creative.priority] ?? creative.priority}</span>
                        </div>
                        <strong className="task-title">{creative.title}</strong>
                        <p className="task-subline">{creative.projectId ? projectNameById.get(creative.projectId) : 'Без проекта'} · {creative.type}</p>
                        <div className="task-meta-grid">
                          <span>Buyer: {userNameById.get(creative.requestedById) ?? '—'}</span>
                          <span>Designer: {creative.assignedToId ? userNameById.get(creative.assignedToId) ?? '—' : 'Не назначен'}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <aside className="detail-panel">
            {!selectedCreativeDetail || loading ? (
              <div className="detail-empty">Выбери задачу слева</div>
            ) : (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Карточка задачи</p>
                    <h2>{selectedCreativeDetail.title}</h2>
                  </div>
                  <div className="detail-badges">
                    <span className="status-badge">{STATUS_LABELS[selectedCreativeDetail.status]}</span>
                    <span className={`priority-badge priority-${selectedCreativeDetail.priority}`}>{PRIORITY_LABELS[selectedCreativeDetail.priority] ?? selectedCreativeDetail.priority}</span>
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-grid">
                    <div>
                      <span className="field-label">Код</span>
                      <strong>{selectedCreativeDetail.internalCode}</strong>
                    </div>
                    <div>
                      <span className="field-label">Проект</span>
                      <strong>{selectedCreativeDetail.projectId ? projectNameById.get(selectedCreativeDetail.projectId) : 'Без проекта'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Buyer</span>
                      <strong>{selectedCreativeDetail.requestedByName ?? '—'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Designer</span>
                      <strong>{selectedCreativeDetail.assignedToName ?? 'Не назначен'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Тип</span>
                      <strong>{selectedCreativeDetail.type}</strong>
                    </div>
                    <div>
                      <span className="field-label">Цена</span>
                      <strong>{selectedCreativeDetail.price ?? '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="detail-block">
                  <span className="field-label">Бриф</span>
                  <p className="brief-text">{selectedCreativeDetail.brief ?? 'Описание не заполнено'}</p>
                </div>

                <div className="detail-block">
                  <span className="field-label">Действия</span>
                  <div className="action-row">
                    {view === 'hod' ? <button disabled={actionLoading !== null} onClick={() => runAction('assign')}>Назначить</button> : null}
                    {view === 'designer' ? <button disabled={actionLoading !== null} onClick={() => runAction('take')}>Взять в работу</button> : null}
                    {view === 'designer' ? <button disabled={actionLoading !== null} onClick={() => runAction('submitReview')}>Отправить на проверку</button> : null}
                    {view === 'buyer' ? <button disabled={actionLoading !== null} onClick={() => runAction('requestRevision')}>На доработку</button> : null}
                    {view === 'buyer' ? <button disabled={actionLoading !== null} onClick={() => runAction('accept')}>Принять</button> : null}
                  </div>
                </div>

                <div className="detail-block">
                  <span className="field-label">История</span>
                  <div className="history-list">
                    {selectedCreativeDetail.statusLogs.map((log) => (
                      <div key={log.id} className="history-row">
                        <div>
                          <strong>{log.fromStatus ? STATUS_LABELS[log.fromStatus] : 'Создание'} → {STATUS_LABELS[log.toStatus]}</strong>
                          <p>{log.note ?? 'Без комментария'}</p>
                        </div>
                        <span>{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </aside>
        </section>
      </section>
    </main>
  )
}

export default App
