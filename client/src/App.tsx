import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Project, User } from './types/domain'
import type { Creative, CreativeDetailDto } from './types/creatives'

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

  const queueCreatives = useMemo(
    () => creatives.filter((c) => ['draft', 'sent_to_designer', 'revision', 'review'].includes(c.status)),
    [creatives],
  )
  const auctionCreatives = useMemo(
    () => creatives.filter((c) => ['pending_hod_setup', 'queued_for_auction', 'in_auction'].includes(c.status)),
    [creatives],
  )
  const inProgressCreatives = useMemo(
    () => creatives.filter((c) => c.status === 'in_progress'),
    [creatives],
  )

  const visibleCreatives = useMemo(() => {
    if (view === 'buyer') return myCreatives
    if (view === 'designer') return assignedCreatives
    return creatives
  }, [view, myCreatives, assignedCreatives, creatives])

  const runAction = async (kind: 'assign' | 'take' | 'submitReview' | 'requestRevision' | 'accept') => {
    if (!selectedCreativeDetail) return
    try {
      setActionLoading(kind)
      setError(null)
      const fallbackDesigner = users.find((u) => u.roles.includes('designer'))

      if (kind === 'assign') {
        if (!fallbackDesigner) throw new Error('No designer available')
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
          note: 'Need one more iteration',
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
    <main className="app-shell">
      <header className="hero-block">
        <p className="eyebrow">Creative Production System</p>
        <h1>Buyer → HoD → Designer → Review</h1>
        <p className="subtext">Переделанный core вокруг реального production flow, а не around random design screens.</p>
      </header>

      {error ? (
        <section className="card error-card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      <section className="grid">
        <article className="card">
          <h2>Current user</h2>
          <div className="metric">{me?.name ?? '—'}</div>
          <p className="muted">{me?.roles.join(', ') ?? 'loading'}</p>
        </article>
        <article className="card">
          <h2>Queue</h2>
          <div className="metric">{queueCreatives.length}</div>
          <p className="muted">draft / sent_to_designer / revision / review</p>
        </article>
        <article className="card">
          <h2>Auctions</h2>
          <div className="metric">{auctionCreatives.length}</div>
          <p className="muted">pending_hod_setup / queued / in_auction</p>
        </article>
        <article className="card">
          <h2>In progress</h2>
          <div className="metric">{inProgressCreatives.length}</div>
          <p className="muted">active designer workload</p>
        </article>
      </section>

      <section className="card action-bar-card">
        <h2>Role-based views</h2>
        <div className="action-bar">
          <button onClick={() => setView('buyer')} disabled={view === 'buyer'}>Buyer</button>
          <button onClick={() => setView('hod')} disabled={view === 'hod'}>HoD</button>
          <button onClick={() => setView('designer')} disabled={view === 'designer'}>Designer</button>
        </div>
        <p className="muted">Current view: {view}</p>
      </section>

      <section className="creatives-shell-layout">
        <section className="card creatives-shell-section">
          <div className="creatives-shell-heading">
            <div>
              <p className="eyebrow">{view}</p>
              <h2>{view === 'buyer' ? 'My orders' : view === 'designer' ? 'Assigned work' : 'Operations board'}</h2>
            </div>
          </div>
          <div className="creatives-list-shell">
            {visibleCreatives.map((creative) => (
              <button
                key={creative.id}
                type="button"
                className={`card creatives-list-row${creative.id === selectedCreativeId ? ' is-active' : ''}`}
                onClick={() => setSelectedCreativeId(creative.id)}
              >
                <div className="creatives-list-row-main">
                  <div>
                    <div className="creatives-list-code-row">
                      <strong>{creative.internalCode}</strong>
                      <span className="creatives-chip">{creative.status}</span>
                      <span className="creatives-chip creatives-chip-priority">{creative.priority}</span>
                    </div>
                    <p className="muted">
                      {(creative.projectId ? projectNameById.get(creative.projectId) : 'No project') ?? 'No project'} · {creative.type}
                    </p>
                  </div>
                </div>
                <div className="creatives-list-meta">
                  <span>Buyer: {userNameById.get(creative.requestedById) ?? '—'}</span>
                  <span>Designer: {creative.assignedToId ? userNameById.get(creative.assignedToId) ?? '—' : 'unassigned'}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card creatives-shell-section">
          <div className="creatives-shell-heading">
            <div>
              <p className="eyebrow">Creative detail</p>
              <h2>{selectedCreativeDetail?.internalCode ?? 'Select creative'}</h2>
            </div>
          </div>

          {!selectedCreativeDetail || loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <>
              <p><strong>Title:</strong> {selectedCreativeDetail.title}</p>
              <p><strong>Brief:</strong> {selectedCreativeDetail.brief ?? '—'}</p>
              <p><strong>Status:</strong> {selectedCreativeDetail.status}</p>
              <p><strong>Buyer:</strong> {selectedCreativeDetail.requestedByName ?? '—'}</p>
              <p><strong>Designer:</strong> {selectedCreativeDetail.assignedToName ?? 'unassigned'}</p>
              <p><strong>Price:</strong> {selectedCreativeDetail.price ?? '—'}</p>
              <p><strong>History:</strong> {selectedCreativeDetail.statusLogs.map((log) => `${log.fromStatus ?? 'new'} → ${log.toStatus}`).join(' · ')}</p>

              <div className="action-bar">
                {view === 'hod' ? <button disabled={actionLoading !== null} onClick={() => runAction('assign')}>Assign</button> : null}
                {view === 'designer' ? <button disabled={actionLoading !== null} onClick={() => runAction('take')}>Accept / Take</button> : null}
                {view === 'designer' ? <button disabled={actionLoading !== null} onClick={() => runAction('submitReview')}>Submit review</button> : null}
                {view === 'buyer' ? <button disabled={actionLoading !== null} onClick={() => runAction('requestRevision')}>Request revision</button> : null}
                {view === 'buyer' ? <button disabled={actionLoading !== null} onClick={() => runAction('accept')}>Approve</button> : null}
              </div>
            </>
          )}
        </section>
      </section>

      <section className="grid">
        <article className="card">
          <h2>HoD Board</h2>
          <p className="muted">Needs: assign / reassign / unassign / auction launch / queue control</p>
        </article>
        <article className="card">
          <h2>Buyer Workspace</h2>
          <p className="muted">Needs: create request / references / approve / revision loop</p>
        </article>
        <article className="card">
          <h2>Designer Workspace</h2>
          <p className="muted">Needs: my tasks / auctions / files / submit review</p>
        </article>
      </section>
    </main>
  )
}

export default App
