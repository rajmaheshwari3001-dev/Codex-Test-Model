import type { DisruptionResult, ScenarioMetrics } from '../types'
import { AlertTriangleIcon, CheckCircleIcon } from './common/Icons'

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
  let cardBg = 'bg-slate-50 border-slate-200'

  if (typeof value === 'number' && typeof baselineValue === 'number') {
    const diff = Number((value - baselineValue).toFixed(1))
    const improved = lowerIsBetter ? diff < 0 : diff > 0
    const worsened = lowerIsBetter ? diff > 0 : diff < 0

    if (diff !== 0) {
      deltaNode = (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
            improved
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : worsened
              ? 'bg-rose-100 text-rose-900 border border-rose-200'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {diff > 0 ? `+${diff}` : diff}
          {unit} vs baseline
        </span>
      )
    }

    if (improved) cardBg = 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
    else if (worsened) cardBg = 'bg-rose-50/70 border-rose-200 text-rose-950'
  }

  return (
    <div className={`rounded-xl border p-3.5 text-center transition-all ${cardBg}`}>
      <div className="text-xl sm:text-2xl font-black tracking-tight">
        {value}
        {unit}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5 leading-snug">{label}</div>
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

function VisualImpactBar({
  label,
  baselineVal,
  counterVal,
  unit,
}: {
  label: string
  baselineVal: number
  counterVal: number
  unit: string
}) {
  const maxVal = Math.max(baselineVal, counterVal, 1)
  const basePct = Math.round((baselineVal / maxVal) * 100)
  const counterPct = Math.round((counterVal / maxVal) * 100)
  const diff = counterVal - baselineVal

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-bold text-slate-800">{label}</span>
        <span className="font-mono text-xs font-bold text-emerald-800">
          {diff < 0 ? `${diff}${unit} (Improved)` : diff === 0 ? 'No Change' : `+${diff}${unit}`}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="w-18 shrink-0">Baseline:</span>
          <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${basePct}%` }} />
          </div>
          <span className="w-14 text-right font-mono font-bold text-slate-800">{baselineVal}{unit}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="w-18 shrink-0 font-bold text-emerald-800">Mitigated:</span>
          <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${counterPct}%` }} />
          </div>
          <span className="w-14 text-right font-mono font-bold text-emerald-900">{counterVal}{unit}</span>
        </div>
      </div>
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
    <div className="space-y-5">
      {/* Disruption Incident Summary Callout */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600" />
            <div className="text-xs sm:text-sm font-bold text-rose-900 uppercase tracking-wide">
              Simulated Disruption Profile
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md">
            ID: {result.disruption.disruption_id}
          </span>
        </div>
        <div className="mt-2 text-base font-bold text-rose-950">
          {result.disruption.description}
        </div>
        <div className="text-xs sm:text-sm text-rose-900/90 mt-2 flex flex-wrap gap-x-5 gap-y-1.5 font-medium">
          <span>Incident Type: <strong className="font-bold">{result.disruption.disruption_type}</strong></span>
          <span>Target Vehicle: <strong className="font-mono font-bold">{result.disruption.affected_bus_id}</strong></span>
          {result.disruption.delay_minutes > 0 && (
            <span>Delay: <strong className="font-bold">+{result.disruption.delay_minutes} min</strong></span>
          )}
        </div>
      </div>

      {/* Model Interpretation Note */}
      {result.metric_notes && result.metric_notes.length > 0 && (
        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs sm:text-sm text-amber-950">
          <span className="font-bold">Metric Estimation Methodology: </span>
          <span>{result.metric_notes.join(' ')}</span>
        </div>
      )}

      {/* Unmitigated Baseline (No Action) Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-950">
              Unmitigated Baseline (No Action Taken)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Expected operational outcome if no corrective dispatch intervention is approved
            </p>
          </div>
          <span className="text-xs font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold">
            Status Quo
          </span>
        </div>
        <MetricsGrid metrics={result.baseline} />
      </div>

      {/* Evaluated Alternative Responses */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-slate-800 px-1">
          Evaluated Operational Countermeasures ({result.responses.length} Candidates)
        </div>

        {result.responses.map(resp => {
          const isRecommended = recommendedId === resp.response_id

          return (
            <div
              key={resp.response_id}
              className={`bg-white rounded-2xl shadow-xs p-5 sm:p-6 border-2 transition-all ${
                isRecommended
                  ? 'border-emerald-600 ring-4 ring-emerald-500/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-bold text-base sm:text-lg text-slate-950">{resp.label}</h4>
                  {isRecommended && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Recommended Option</span>
                    </span>
                  )}
                </div>
                {!resp.feasible ? (
                  <span className="text-xs font-bold uppercase bg-slate-100 text-slate-600 border border-slate-300 px-2.5 py-0.5 rounded-md">
                    Not Feasible
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    Feasible Action
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">{resp.description}</p>

              {resp.feasible && resp.metrics ? (
                <>
                  {/* Visual Impact Comparison Bars */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Visual Comparative Impact:
                    </div>
                    <VisualImpactBar
                      label="Affected Passengers"
                      baselineVal={result.baseline.affected_passengers}
                      counterVal={resp.metrics.affected_passengers}
                      unit=""
                    />
                    <VisualImpactBar
                      label="Average Wait Increase"
                      baselineVal={result.baseline.average_wait_increase_minutes}
                      counterVal={resp.metrics.average_wait_increase_minutes}
                      unit=" min"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Predicted Metric Comparison vs. Baseline
                    </div>
                    <MetricsGrid metrics={resp.metrics} baseline={result.baseline} />
                  </div>

                  {resp.explanation && (
                    <div className="mt-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
                      <div className="font-bold text-slate-900 mb-1">Evaluation Analysis:</div>
                      <p className="text-slate-600 leading-relaxed">{resp.explanation}</p>
                    </div>
                  )}

                  {resp.trade_offs && resp.trade_offs.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs sm:text-sm font-bold text-slate-800">Operational Trade-offs:</div>
                      <ul className="text-xs sm:text-sm text-slate-600 list-disc ml-5 mt-1 space-y-1">
                        {resp.trade_offs.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dispatcher Decision Controls */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">
                      {decisionMade
                        ? 'Operational action has been logged in audit record.'
                        : 'Review and approve dispatch order:'}
                    </span>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => onApprove(resp.response_id, true)}
                        disabled={decisionMade || decisionPending}
                        className="bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                      >
                        {decisionPending ? 'Processing…' : 'Approve Intervention'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onApprove(resp.response_id, false)}
                        disabled={decisionMade || decisionPending}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-500 italic">
                  <strong>Infeasibility Constraint: </strong>
                  {resp.reason_if_infeasible ||
                    'Action cannot be executed under current vehicle availability constraints.'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
