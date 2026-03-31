import type { CreativeListItem } from '../types'

type CreativesListShellProps = {
  items: CreativeListItem[]
  selectedId?: number | null
  onSelect?: (item: CreativeListItem) => void
}

export function CreativesListShell({ items, selectedId, onSelect }: CreativesListShellProps) {
  return (
    <section className="creatives-shell-section">
      <div className="creatives-shell-heading">
        <div>
          <p className="eyebrow">Creatives module</p>
          <h2>List shell</h2>
        </div>
        <p className="muted">Portable card list for later wiring with filters, actions, and realtime states.</p>
      </div>

      <div className="creatives-list-shell">
        {items.length === 0 ? (
          <article className="card creatives-list-empty">
            <p>No creatives yet</p>
            <p className="muted">The shell is ready; data mapping can be connected later.</p>
          </article>
        ) : (
          items.map((item) => {
            const isActive = item.id === selectedId

            return (
              <button
                key={item.id}
                type="button"
                className={`card creatives-list-row${isActive ? ' is-active' : ''}`}
                onClick={() => onSelect?.(item)}
              >
                <div className="creatives-list-row-main">
                  <div>
                    <div className="creatives-list-code-row">
                      <strong>{item.internalCode}</strong>
                      <span className="creatives-chip">{item.status}</span>
                      <span className="creatives-chip creatives-chip-priority">{item.priority}</span>
                    </div>
                    <p className="muted">{item.projectName} · {item.type}</p>
                  </div>
                  <span className="creatives-list-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                {(item.requestedByName || item.assignedToName) && (
                  <div className="creatives-list-meta">
                    {item.requestedByName ? <span>Requester: {item.requestedByName}</span> : null}
                    {item.assignedToName ? <span>Designer: {item.assignedToName}</span> : null}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
