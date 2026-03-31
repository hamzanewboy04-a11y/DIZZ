import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Project, User } from './types/domain'
import type { Creative, CreativeDetailDto } from './types/creatives'
import type { VisualDetailDto, VisualRequest } from './types/visuals'
import type { ModelProfile, ModelProfileDetailDto } from './types/models'
import type { DesignStaffSetting, ReviewerReport, SmmReport, StaffRatePeriod, TeamStatsDto } from './types/team'
import {
  CreativesDetailShell,
  CreativesListShell,
  CreativesMetricsShell,
  type CreativeDetailModel,
  type CreativeListItem,
} from './modules/creatives'

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

function App() {
  const [me, setMe] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [assignedCreatives, setAssignedCreatives] = useState<Creative[]>([])
  const [myCreatives, setMyCreatives] = useState<Creative[]>([])
  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null)
  const [selectedCreativeDetail, setSelectedCreativeDetail] = useState<CreativeDetailDto | null>(null)
  const [visuals, setVisuals] = useState<VisualRequest[]>([])
  const [selectedVisualId, setSelectedVisualId] = useState<number | null>(null)
  const [selectedVisualDetail, setSelectedVisualDetail] = useState<VisualDetailDto | null>(null)
  const [models, setModels] = useState<ModelProfile[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [selectedModelDetail, setSelectedModelDetail] = useState<ModelProfileDetailDto | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStatsDto | null>(null)
  const [staffSettings, setStaffSettings] = useState<DesignStaffSetting[]>([])
  const [ratePeriods, setRatePeriods] = useState<StaffRatePeriod[]>([])
  const [reviewerReports, setReviewerReports] = useState<ReviewerReport[]>([])
  const [smmReports, setSmmReports] = useState<SmmReport[]>([])
  const [newModelName, setNewModelName] = useState('')
  const [newModelGeo, setNewModelGeo] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState<'assign' | 'reassign' | 'unassign' | 'take' | 'submitReview' | 'requestRevision' | 'accept' | null>(null)
  const [visualActionLoading, setVisualActionLoading] = useState<'assign' | 'take' | 'status' | null>(null)
  const [modelActionLoading, setModelActionLoading] = useState<'create' | 'update' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshCreatives = async () => {
    const [creativesData, assignedData, myData] = await Promise.all([
      getJson<Creative[]>('/api/creative-requests'),
      getJson<Creative[]>('/api/creative-requests/assigned'),
      getJson<Creative[]>('/api/creative-requests/my'),
    ])
    setCreatives(creativesData)
    setAssignedCreatives(assignedData)
    setMyCreatives(myData)
  }

  const refreshVisuals = async () => setVisuals(await getJson<VisualRequest[]>('/api/visuals'))
  const refreshModels = async () => setModels(await getJson<ModelProfile[]>('/api/model-profiles'))
  const refreshTeam = async () => {
    const [stats, settings, periods, reviewer, smm] = await Promise.all([
      getJson<TeamStatsDto>('/api/design-team/stats'),
      getJson<DesignStaffSetting[]>('/api/design-staff-settings'),
      getJson<StaffRatePeriod[]>('/api/staff-rate-periods'),
      getJson<ReviewerReport[]>('/api/reviewer-reports'),
      getJson<SmmReport[]>('/api/smm-reports'),
    ])
    setTeamStats(stats)
    setStaffSettings(settings)
    setRatePeriods(periods)
    setReviewerReports(reviewer)
    setSmmReports(smm)
  }

  const refreshCreativeDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      setSelectedCreativeDetail(await getJson<CreativeDetailDto>(`/api/creative-requests/${id}`))
    } finally {
      setLoadingDetail(false)
    }
  }

  const refreshVisualDetail = async (id: number) => setSelectedVisualDetail(await getJson<VisualDetailDto>(`/api/visuals/${id}`))
  const refreshModelDetail = async (id: number) => setSelectedModelDetail(await getJson<ModelProfileDetailDto>(`/api/model-profiles/${id}`))

  useEffect(() => {
    Promise.all([
      getJson<User>('/api/me'),
      getJson<Project[]>('/api/projects'),
      getJson<User[]>('/api/users'),
      refreshCreatives(),
      refreshVisuals(),
      refreshModels(),
      refreshTeam(),
    ])
      .then(([meData, projectsData, usersData]) => {
        setMe(meData)
        setProjects(projectsData)
        setUsers(usersData)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => { if (!selectedCreativeId && creatives.length > 0) setSelectedCreativeId(creatives[0].id) }, [creatives, selectedCreativeId])
  useEffect(() => { if (!selectedVisualId && visuals.length > 0) setSelectedVisualId(visuals[0].id) }, [selectedVisualId, visuals])
  useEffect(() => { if (!selectedModelId && models.length > 0) setSelectedModelId(models[0].id) }, [models, selectedModelId])

  useEffect(() => { if (!selectedCreativeId) return setSelectedCreativeDetail(null); refreshCreativeDetail(selectedCreativeId).catch((err: Error) => setError(err.message)) }, [selectedCreativeId])
  useEffect(() => { if (!selectedVisualId) return setSelectedVisualDetail(null); refreshVisualDetail(selectedVisualId).catch((err: Error) => setError(err.message)) }, [selectedVisualId])
  useEffect(() => { if (!selectedModelId) return setSelectedModelDetail(null); refreshModelDetail(selectedModelId).catch((err: Error) => setError(err.message)) }, [selectedModelId])

  const userNameById = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users])
  const projectNameById = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects])

  const creativesListItems = useMemo<CreativeListItem[]>(() => creatives.slice(0, 12).map((creative) => ({
    id: creative.id,
    internalCode: creative.internalCode,
    title: creative.title,
    projectName: creative.projectId ? (projectNameById.get(creative.projectId) ?? 'Unknown project') : 'No project',
    type: creative.type,
    status: creative.status,
    priority: creative.priority,
    requestedByName: userNameById.get(creative.requestedById),
    assignedToName: creative.assignedToId ? (userNameById.get(creative.assignedToId) ?? null) : null,
    createdAt: creative.createdAt,
  })), [creatives, projectNameById, userNameById])

  const selectedCreative = useMemo<CreativeDetailModel | null>(() => {
    if (!selectedCreativeDetail) return null
    return {
      id: selectedCreativeDetail.id,
      internalCode: selectedCreativeDetail.internalCode,
      title: selectedCreativeDetail.title,
      projectName: selectedCreativeDetail.projectId ? (projectNameById.get(selectedCreativeDetail.projectId) ?? 'Unknown project') : 'No project',
      type: selectedCreativeDetail.type,
      status: selectedCreativeDetail.status,
      priority: selectedCreativeDetail.priority,
      requestedByName: selectedCreativeDetail.requestedByName ?? undefined,
      assignedToName: selectedCreativeDetail.assignedToName,
      createdAt: selectedCreativeDetail.createdAt,
      summary: selectedCreativeDetail.brief ?? 'No brief yet',
      blocks: [
        { title: 'Price', content: selectedCreativeDetail.price ? `$${selectedCreativeDetail.price}` : 'Not set' },
        { title: 'Subtypes', content: selectedCreativeDetail.subtypes.length > 0 ? selectedCreativeDetail.subtypes.join(', ') : '—' },
        { title: 'Status history', content: selectedCreativeDetail.statusLogs.map((log) => `${log.fromStatus ?? 'new'} → ${log.toStatus}`).join(' · ') },
      ],
    }
  }, [projectNameById, selectedCreativeDetail])

  const creativesMetrics = useMemo(() => ({
    total: creatives.length,
    assigned: assignedCreatives.length,
    mine: myCreatives.length,
    inProgress: creatives.filter((creative) => creative.status === 'in_progress').length,
    review: creatives.filter((creative) => creative.status === 'review' || creative.status === 'revision').length,
    completed: creatives.filter((creative) => creative.status === 'completed').length,
  }), [assignedCreatives.length, creatives, myCreatives.length])

  const runCreativeAction = async (kind: 'assign' | 'reassign' | 'unassign' | 'take' | 'submitReview' | 'requestRevision' | 'accept') => {
    if (!selectedCreativeDetail) return
    try {
      setActionLoading(kind)
      setError(null)
      const fallbackDesigner = users.find((user) => user.roles.includes('designer'))
      const anotherDesigner = users.find((user) => user.roles.includes('designer') && user.id !== selectedCreativeDetail.assignedToId)
      if (kind === 'assign') {
        if (!fallbackDesigner) throw new Error('No designer available for assign')
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/assign`, 'POST', { assigneeId: fallbackDesigner.id, actorUserId: me?.id, price: selectedCreativeDetail.price ?? '50' })
      }
      if (kind === 'reassign') {
        if (!anotherDesigner) throw new Error('No second designer available for reassign')
        await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/reassign`, 'POST', { assigneeId: anotherDesigner.id, actorUserId: me?.id, price: selectedCreativeDetail.price ?? '65' })
      }
      if (kind === 'unassign') await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/unassign`, 'POST', { actorUserId: me?.id })
      if (kind === 'take') await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/take-to-work`, 'POST', { actorUserId: me?.id })
      if (kind === 'submitReview') await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/submit-review`, 'POST', { actorUserId: me?.id })
      if (kind === 'requestRevision') await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/request-revision`, 'POST', { actorUserId: me?.id, note: 'Need one more iteration on the concept' })
      if (kind === 'accept') await requestJson(`/api/creative-requests/${selectedCreativeDetail.id}/accept`, 'POST', { actorUserId: me?.id })
      await refreshCreatives(); await refreshCreativeDetail(selectedCreativeDetail.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally { setActionLoading(null) }
  }

  const runVisualAction = async (kind: 'assign' | 'take' | 'status') => {
    if (!selectedVisualDetail) return
    try {
      setVisualActionLoading(kind)
      setError(null)
      const fallbackDesigner = users.find((user) => user.roles.includes('designer'))
      if (kind === 'assign') {
        if (!fallbackDesigner) throw new Error('No designer available for visual assign')
        await requestJson(`/api/visuals/${selectedVisualDetail.id}/assign`, 'POST', { assigneeId: fallbackDesigner.id, actorUserId: me?.id })
      }
      if (kind === 'take') await requestJson(`/api/visuals/${selectedVisualDetail.id}/take`, 'PATCH', { actorUserId: me?.id })
      if (kind === 'status') {
        const nextStatus = selectedVisualDetail.status === 'in_progress' ? 'submitted' : 'in_progress'
        await requestJson(`/api/visuals/${selectedVisualDetail.id}/status`, 'PATCH', { status: nextStatus, actorUserId: me?.id, comment: `Manual transition to ${nextStatus}` })
      }
      await refreshVisuals(); await refreshVisualDetail(selectedVisualDetail.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Visual action failed')
    } finally { setVisualActionLoading(null) }
  }

  const runModelAction = async (kind: 'create' | 'update') => {
    try {
      setModelActionLoading(kind)
      setError(null)
      if (kind === 'create') {
        if (!newModelName.trim() || !newModelGeo.trim()) throw new Error('Model name and geo are required')
        await requestJson('/api/model-profiles', 'POST', { name: newModelName.trim(), geo: newModelGeo.trim(), projectId: projects[0]?.id ?? null })
        setNewModelName(''); setNewModelGeo('')
      }
      if (kind === 'update') {
        if (!selectedModelDetail) throw new Error('Select model first')
        await requestJson(`/api/model-profiles/${selectedModelDetail.id}`, 'PATCH', { description: `${selectedModelDetail.description ?? ''} Updated in extracted MVP.`.trim() })
      }
      await refreshModels(); if (selectedModelId) await refreshModelDetail(selectedModelId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Model action failed')
    } finally { setModelActionLoading(null) }
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <a href="#creatives">Creatives</a>
        <a href="#visuals">Visuals</a>
        <a href="#models">Models</a>
        <a href="#team">Team</a>
      </nav>

      <header className="hero-block">
        <div>
          <p className="eyebrow">D7 Design Product</p>
          <h1>Core + Team MVP shell</h1>
          <p className="subtext">Creatives, Visuals, Models, and Team ops-light are connected in the standalone product.</p>
        </div>
      </header>

      {error ? <section className="card error-card"><h2>API / action problem</h2><p>{error}</p></section> : null}

      <section className="grid">
        <article className="card"><h2>Current user</h2>{me ? <><div className="metric">{me.name}</div><p className="muted">roles: {me.roles.join(', ')}</p></> : <p className="muted">Loading…</p>}</article>
        <article className="card"><h2>Projects</h2><div className="metric">{projects.length}</div><p className="muted">Foundation endpoint for filtering and permissions</p></article>
        <article className="card"><h2>Users</h2><div className="metric">{users.length}</div><p className="muted">Foundation endpoint for assignee selectors and access lists</p></article>
      </section>

      <CreativesMetricsShell metrics={creativesMetrics} />

      <section id="creatives" className="card roadmap-card">
        <h2>Creatives</h2>
        <ol><li>List + detail wired</li><li>Assign / reassign / unassign wired</li><li>Take / submit review / revision / accept wired</li></ol>
      </section>

      <section className="creatives-shell-layout">
        <CreativesListShell items={creativesListItems} selectedId={selectedCreativeId} onSelect={(item) => setSelectedCreativeId(item.id)} />
        <div>
          <div className="card action-bar-card">
            <h2>Creatives MVP actions</h2>
            <div className="action-bar">
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('assign')}>Assign</button>
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('reassign')}>Reassign</button>
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('unassign')}>Unassign</button>
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('take')}>Take</button>
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('submitReview')}>Submit review</button>
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('requestRevision')}>Revision</button>
              <button disabled={!selectedCreative || actionLoading !== null} onClick={() => runCreativeAction('accept')}>Accept</button>
            </div>
          </div>
          <CreativesDetailShell creative={loadingDetail ? null : selectedCreative} />
        </div>
      </section>

      <section id="visuals" className="card roadmap-card">
        <h2>Visuals</h2>
        <ol><li>List + detail wired</li><li>Assign action wired</li><li>Take + status change wired</li></ol>
      </section>

      <section className="visuals-grid">
        <section className="card">
          <h2>Visuals list</h2>
          <div className="visual-card-list">
            {visuals.map((visual) => (
              <button key={visual.id} type="button" className={`visual-row${visual.id === selectedVisualId ? ' is-active' : ''}`} onClick={() => setSelectedVisualId(visual.id)}>
                <strong>{visual.displayId}</strong><p className="muted">{visual.title}</p>
                <div className="visual-meta"><span className="visual-chip">{visual.status}</span><span className="visual-chip">{visual.urgency}</span><span className="visual-chip">{visual.taskType}</span></div>
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Visual detail</h2>
          {!selectedVisualDetail ? <p className="muted">Select a visual request.</p> : <>
            <p className="eyebrow">{selectedVisualDetail.displayId}</p><h3>{selectedVisualDetail.title}</h3><p className="muted">{selectedVisualDetail.brief ?? 'No brief'}</p>
            <div className="visual-meta"><span className="visual-chip">status: {selectedVisualDetail.status}</span><span className="visual-chip">requester: {selectedVisualDetail.requesterName ?? '—'}</span><span className="visual-chip">designer: {selectedVisualDetail.assignedDesignerName ?? 'unassigned'}</span></div>
            <div className="action-bar"><button disabled={visualActionLoading !== null} onClick={() => runVisualAction('assign')}>Assign</button><button disabled={visualActionLoading !== null} onClick={() => runVisualAction('take')}>Take</button><button disabled={visualActionLoading !== null} onClick={() => runVisualAction('status')}>Toggle status</button></div>
            <p className="muted">History: {selectedVisualDetail.statusLogs.map((log) => `${log.fromStatus ?? 'new'} → ${log.toStatus}`).join(' · ')}</p>
          </>}
        </section>
      </section>

      <section id="models" className="card roadmap-card">
        <h2>Model Database</h2>
        <ol><li>List wired</li><li>Detail wired</li><li>Create / edit shell wired</li></ol>
      </section>

      <section className="models-grid">
        <section className="card">
          <h2>Model profiles</h2>
          <div className="model-list">{models.map((model) => <button key={model.id} type="button" className={`model-row${model.id === selectedModelId ? ' is-active' : ''}`} onClick={() => setSelectedModelId(model.id)}><strong>{model.name}</strong><p className="muted">{model.geo}</p></button>)}</div>
        </section>
        <section className="card">
          <h2>Model detail</h2>
          {!selectedModelDetail ? <p className="muted">Select model profile.</p> : <><p className="eyebrow">{selectedModelDetail.geo}</p><h3>{selectedModelDetail.name}</h3><p className="muted">{selectedModelDetail.description ?? 'No description'}</p><div className="visual-meta">{selectedModelDetail.blocks.map((block) => <span key={block.id} className="visual-chip">{block.title}</span>)}</div><div className="action-bar"><button disabled={modelActionLoading !== null} onClick={() => runModelAction('update')}>Update description</button></div></>}
        </section>
        <section className="card">
          <h2>Create model shell</h2>
          <div className="model-form"><input value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="Model name" /><input value={newModelGeo} onChange={(e) => setNewModelGeo(e.target.value)} placeholder="Geo" /><button disabled={modelActionLoading !== null} onClick={() => runModelAction('create')}>{modelActionLoading === 'create' ? 'Creating…' : 'Create model'}</button></div>
        </section>
      </section>

      <section id="team" className="card roadmap-card">
        <h2>Design Team ops-light</h2>
        <ol><li>Team stats wired</li><li>Reviewer reports wired</li><li>SMM reports wired</li><li>Staff settings / rate periods wired</li></ol>
      </section>

      <section className="team-grid">
        <section className="card">
          <h2>Team stats</h2>
          {!teamStats ? <p className="muted">Loading…</p> : <div className="team-list"><span>Designers: {teamStats.designers}</span><span>Reviewers: {teamStats.reviewers}</span><span>SMM: {teamStats.smmManagers}</span><span>Active creatives: {teamStats.activeCreatives}</span><span>Active visuals: {teamStats.activeVisuals}</span></div>}
        </section>
        <section className="card">
          <h2>Reviewer reports</h2>
          <div className="team-list">{reviewerReports.map((report) => <span key={report.id}>{report.geo}: big {report.bigReviews}, mini {report.miniReviews}, earned {report.totalEarned}</span>)}</div>
        </section>
        <section className="card">
          <h2>SMM reports</h2>
          <div className="team-list">{smmReports.map((report) => <span key={report.id}>{report.channelGeo}: posts {report.posts}, stories {report.stories}, earned {report.totalEarned}</span>)}</div>
        </section>
        <section className="card">
          <h2>Staff settings</h2>
          <div className="team-list">{staffSettings.map((item) => <span key={item.id}>user #{item.userId}: {item.roleLabel} ({item.isActive ? 'active' : 'inactive'})</span>)}</div>
        </section>
        <section className="card">
          <h2>Rate periods</h2>
          <div className="team-list">{ratePeriods.map((item) => <span key={item.id}>user #{item.userId}: {item.rateLabel} = {item.rateValue}</span>)}</div>
        </section>
      </section>
    </main>
  )
}

export default App
