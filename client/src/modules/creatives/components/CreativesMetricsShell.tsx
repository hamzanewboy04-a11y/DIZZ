import type { CreativeMetrics } from '../types'

type CreativesMetricsShellProps = {
  metrics: CreativeMetrics
}

const metricItems: Array<{ key: keyof CreativeMetrics; label: string }> = [
  { key: 'total', label: 'All creatives' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'mine', label: 'My creatives' },
  { key: 'inProgress', label: 'In progress' },
  { key: 'review', label: 'Review queue' },
  { key: 'completed', label: 'Completed' },
]

export function CreativesMetricsShell({ metrics }: CreativesMetricsShellProps) {
  return (
    <section className="creatives-shell-section">
      <div className="creatives-shell-heading">
        <div>
          <p className="eyebrow">Creatives module</p>
          <h2>Metrics shell</h2>
        </div>
        <p className="muted">Minimal presentational cards for the extracted module.</p>
      </div>

      <div className="creatives-metrics-grid">
        {metricItems.map((item) => (
          <article key={item.key} className="card creatives-metric-card">
            <p className="creatives-metric-label">{item.label}</p>
            <div className="metric">{metrics[item.key]}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
