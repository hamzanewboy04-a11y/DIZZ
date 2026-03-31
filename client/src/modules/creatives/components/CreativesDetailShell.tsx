import type { CreativeDetailModel } from '../types'

type CreativesDetailShellProps = {
  creative: CreativeDetailModel | null
}

export function CreativesDetailShell({ creative }: CreativesDetailShellProps) {
  return (
    <section className="creatives-shell-section">
      <div className="creatives-shell-heading">
        <div>
          <p className="eyebrow">Creatives module</p>
          <h2>Detail shell</h2>
        </div>
        <p className="muted">Reserved for brief, history, files, actions, and chat extraction.</p>
      </div>

      <article className="card creatives-detail-shell">
        {!creative ? (
          <div className="creatives-detail-empty">
            <h3>Select a creative</h3>
            <p className="muted">The detail area is intentionally minimal until the monolith is split into focused pieces.</p>
          </div>
        ) : (
          <>
            <div className="creatives-detail-header">
              <div>
                <p className="eyebrow">{creative.projectName}</p>
                <h3>{creative.internalCode}</h3>
                {creative.title ? <p className="muted">{creative.title}</p> : null}
              </div>
              <div className="creatives-detail-badges">
                <span className="creatives-chip">{creative.status}</span>
                <span className="creatives-chip creatives-chip-priority">{creative.priority}</span>
                <span className="creatives-chip">{creative.type}</span>
              </div>
            </div>

            <div className="creatives-detail-grid">
              <div>
                <p className="creatives-detail-label">Requester</p>
                <p>{creative.requestedByName ?? '—'}</p>
              </div>
              <div>
                <p className="creatives-detail-label">Designer</p>
                <p>{creative.assignedToName ?? 'Unassigned'}</p>
              </div>
              <div>
                <p className="creatives-detail-label">Created</p>
                <p>{new Date(creative.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {creative.summary ? <p className="creatives-detail-summary">{creative.summary}</p> : null}

            <div className="creatives-detail-blocks">
              {(creative.blocks ?? []).map((block) => (
                <section key={block.title} className="creatives-detail-block">
                  <p className="creatives-detail-label">{block.title}</p>
                  <p>{block.content}</p>
                </section>
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  )
}
