import type { DisruptionResult, ScenarioMetrics } from '../types'

interface Props {
  result: DisruptionResult
  onApprove: (responseId: string, approved: boolean) => void
  decisionMade: boolean
  decisionPending: boolean
}

function MetricCard({
  label,
  value,
  unit,
  baselineValue,
  lowerIsBetter = true,
}: {
  label: string
  value: number | string
  unit?: string
  baselineValue?: number
  lowerIsBetter?: boolean
}) {
  let deltaNode = null
  let cardBg = 'bg-gray-50 border-gray-200'

  if (typeof value === 'number' && typeof baselineValue === 'number') {
    const diff = Number((value - baselineValue).toFixed(1))
    const improved = lowerIsBetter ? diff < 0 : diff > 0
    const worsened = lowerIsBetter ? diff > 0 : diff < 0

    if (diff !== 0) {
      deltaNode = (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
            improved
              ? 'bg-emerald-100 text-emerald-800'
              : worsened
              ? 'bg-rose-100 text-rose-800'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {diff > 0 ? `+${diff}` : diff}
          {unit} vs baseline
        </span>
      )
    }

    if (improved) cardBg = 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
    else if (worsened) cardBg = 'bg-rose-50/60 border-rose-200 text-rose-950'
  }

  return (
    <div className={`rounded-xl border p-2.5 text-center transition-all ${cardBg}`}>
      <div className="text-lg font-extrabold tracking-tight">
        {value}
        {unit}
      </div>
      <div className="text-[11px] font-medium text-gray-500 leading-tight">{label}</div>
      {deltaNode}
    </div>
  )
}

function MetricsGrid({
  metrics,
  baseline,
}: {
  metrics: ScenarioMetrics
  baseline?: ScenarioMetrics
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <MetricCard
        label="Affected Passengers"
        value={metrics.affected_passengers}
        baselineValue={baseline?.affected_passengers}
      />
      <MetricCard
        label="Avg Wait Increase"
        value={metrics.average_wait_increase_minutes}
        unit=" min"
        baselineValue={baseline?.average_wait_increase_minutes}
      />
      <MetricCard
        label="Delayed Trips"
        value={metrics.delayed_trips}
        baselineValue={baseline?.delayed_trips}
      />
      <MetricCard
        label="Crowding Increase"
        value={metrics.crowding_increase_percent}
        unit="%"
        baselineValue={baseline?.crowding_increase_percent}
      />
    </div>
  )
}

export default function ScenarioComparison({
  result,
  onApprove,
  decisionMade,
  decisionPending,
}: Props) {
  const recommendedId = result.recommended_response_id

  return (
    <div className="space-y-4">
      {/* Disruption Incident Summary Callout */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">⚠️</span>
            <div className="text-xs font-bold text-red-900 uppercase tracking-wide">
              Simulated Disruption Profile
            </div>
          </div>
          <span className="text-[10px] font-mono text-red-700 bg-red-100/70 px-2 py-0.5 rounded">
            ID: {result.disruption.disruption_id}
          </span>
        </div>
        <div className="mt-1 text-sm font-semibold text-red-950">
          {result.disruption.description}
        </div>
        <div className="text-xs text-red-800/80 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>Incident Type: <strong className="font-semibold">{result.disruption.disruption_type}</strong></span>
          <span>Target Vehicle: <strong className="font-mono font-semibold">{result.disruption.affected_bus_id}</strong></span>
          {result.disruption.delay_minutes > 0 && (
            <span>Delay: <strong className="font-semibold">+{result.disruption.delay_minutes} min</strong></span>
          )}
        </div>
      </div>

      {/* Model Interpretation Note */}
      {result.metric_notes && result.metric_notes.length > 0 && (
        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <span className="font-bold">Metric Estimation Methodology: </span>
          <span>{result.metric_notes.join(' ')}</span>
        </div>
      )}

      {/* Unmitigated Baseline (No Action) Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4.5">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Unmitigated Baseline (No Action Taken)
            </h3>
            <p className="text-xs text-gray-500">
              Expected operational outcome if no corrective dispatch intervention is approved
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
            Status Quo
          </span>
        </div>
        <MetricsGrid metrics={result.baseline} />
      </div>

      {/* Evaluated Alternative Responses */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 px-1">
          Evaluated Operational Countermeasures ({result.responses.length} Candidates)
        </div>

        {result.responses.map(resp => {
          const isRecommended = recommendedId === resp.response_id

          return (
            <div
              key={resp.response_id}
              className={`bg-white rounded-xl shadow-xs p-4.5 border-2 transition-all ${
                isRecommended
                  ? 'border-emerald-500 ring-2 ring-emerald-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">{resp.label}</h4>
                  {isRecommended && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ★ Recommended Option
                    </span>
                  )}
                </div>
                {!resp.feasible ? (
                  <span className="text-[10px] font-semibold uppercase bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded">
                    Not Feasible
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Feasible Action
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 mb-3">{resp.description}</p>

              {resp.feasible && resp.metrics ? (
                <>
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Predicted Metric Comparison vs. Baseline
                    </div>
                    <MetricsGrid metrics={resp.metrics} baseline={result.baseline} />
                  </div>

                  {resp.explanation && (
                    <div className="mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-xs">
                      <div className="font-semibold text-gray-800 mb-0.5">Evaluation Analysis:</div>
                      <p className="text-gray-600">{resp.explanation}</p>
                    </div>
                  )}

                  {resp.trade_offs && resp.trade_offs.length > 0 && (
                    <div className="mt-2.5">
                      <div className="text-xs font-semibold text-gray-700">Operational Trade-offs:</div>
                      <ul className="text-xs text-gray-600 list-disc ml-4 mt-1 space-y-0.5">
                        {resp.trade_offs.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dispatcher Decision Controls */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {decisionMade
                        ? 'Operational action has been logged.'
                        : 'Review and approve dispatch order:'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(resp.response_id, true)}
                        disabled={decisionMade || decisionPending}
                        className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                      >
                        {decisionPending ? 'Processing...' : 'Approve Intervention'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onApprove(resp.response_id, false)}
                        disabled={decisionMade || decisionPending}
                        className="bg-gray-100 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-gray-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 italic">
                  <strong>Infeasibility Constraint: </strong>
                  {resp.reason_if_infeasible || 'Action cannot be executed under current vehicle availability constraints.'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
