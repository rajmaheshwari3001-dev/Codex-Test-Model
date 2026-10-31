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
  let cardBg = 'bg-[#F7F5F0] border-[#EBE5DC] text-[#142B38]'

  if (typeof value === 'number' && typeof baselineValue === 'number') {
    const diff = Number((value - baselineValue).toFixed(1))
    const improved = lowerIsBetter ? diff < 0 : diff > 0
    const worsened = lowerIsBetter ? diff > 0 : diff < 0

    if (diff !== 0) {
      deltaNode = (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
            improved
              ? 'bg-[#EAF5EC] text-[#176B43] border border-[#D1E7D5]'
              : worsened
              ? 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]'
              : 'bg-[#F7F5F0] text-[#7A7269]'
          }`}
        >
          {diff > 0 ? `+${diff}` : diff}
          {unit} vs baseline
        </span>
      )
    }

    if (improved) cardBg = 'bg-[#EAF5EC]/60 border-[#D1E7D5] text-[#176B43]'
    else if (worsened) cardBg = 'bg-[#FDE8E8]/60 border-[#F8B4B4] text-[#9B1C1C]'
  }

  return (
    <div className={`rounded-xl border p-3.5 text-center transition-all ${cardBg}`}>
      <div className="font-sans text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
        {value}
        {unit}
      </div>
      <div className="text-xs font-semibold text-[#7A7269] mt-1 leading-snug">
        {label}
      </div>
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
        <span className="font-bold text-[#142B38]">{label}</span>
        <span className="font-sans text-xs font-bold text-[#176B43]">
          {diff < 0 ? `${diff}${unit} (Improved)` : diff === 0 ? 'No Change' : `+${diff}${unit}`}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 text-xs text-[#7A7269] font-medium">
          <span className="w-18 shrink-0">Baseline:</span>
          <div className="flex-1 bg-[#EBE5DC] rounded-full h-2 overflow-hidden">
            <div className="bg-[#9B1C1C] h-2 rounded-full" style={{ width: `${basePct}%` }} />
          </div>
          <span className="w-14 text-right font-sans font-bold text-[#142B38] tabular-nums">{baselineVal}{unit}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#7A7269] font-medium">
          <span className="w-18 shrink-0 font-bold text-[#176B43]">Mitigated:</span>
          <div className="flex-1 bg-[#EBE5DC] rounded-full h-2 overflow-hidden">
            <div className="bg-[#176B43] h-2 rounded-full" style={{ width: `${counterPct}%` }} />
          </div>
          <span className="w-14 text-right font-sans font-bold text-[#176B43] tabular-nums">{counterVal}{unit}</span>
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
    <div className="space-y-5 animate-fade-in">
      {/* Disruption Incident Summary Callout */}
      <div className="bg-[#FDE8E8] border border-[#F8B4B4] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangleIcon className="w-5 h-5 text-[#9B1C1C]" />
            <div className="text-xs sm:text-sm font-bold text-[#9B1C1C] uppercase tracking-wide">
              Simulated Disruption Profile
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#9B1C1C] bg-white/70 px-2.5 py-0.5 rounded-full border border-[#F8B4B4]">
            ID: {result.disruption.disruption_id}
          </span>
        </div>
        <div className="mt-2 text-base font-bold text-[#9B1C1C]">
          {result.disruption.description}
        </div>
        <div className="text-xs sm:text-sm text-[#9B1C1C]/90 mt-2 flex flex-wrap gap-x-5 gap-y-1.5 font-medium">
          <span>Incident Type: <strong className="font-bold">{result.disruption.disruption_type}</strong></span>
          <span>Target Vehicle: <strong className="font-mono font-bold">{result.disruption.affected_bus_id}</strong></span>
          {result.disruption.delay_minutes > 0 && (
            <span>Delay: <strong className="font-bold">+{result.disruption.delay_minutes} min</strong></span>
          )}
        </div>
      </div>

      {/* Model Interpretation Note */}
      {result.metric_notes && result.metric_notes.length > 0 && (
        <div role="note" className="rounded-xl border border-[#F0E2C2] bg-[#FAF4E8]/80 p-3.5 text-xs text-[#A67C1E]">
          <span className="font-bold">Metric Estimation Methodology: </span>
          <span>{result.metric_notes.join(' ')}</span>
        </div>
      )}

      {/* Unmitigated Baseline (No Action) Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#EBE5DC] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-[#EBE5DC] pb-3">
          <div>
            <h3 className="font-sans font-bold font-bold text-lg text-[#142B38]">
              Unmitigated Baseline (No Action Taken)
            </h3>
            <p className="text-xs text-[#7A7269] mt-0.5">
              Expected operational outcome if no corrective dispatch intervention is approved
            </p>
          </div>
          <span className="text-xs font-mono uppercase bg-[#F7F5F0] text-[#7A7269] border border-[#EBE5DC] px-2.5 py-1 rounded-full font-bold">
            Status Quo
          </span>
        </div>
        <MetricsGrid metrics={result.baseline} />
      </div>

      {/* Evaluated Alternative Responses */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-[#142B38] px-1">
          Evaluated Operational Countermeasures ({result.responses.length} Candidates)
        </div>

        {result.responses.map(resp => {
          const isRecommended = recommendedId === resp.response_id

          return (
            <div
              key={resp.response_id}
              className={`bg-white rounded-2xl shadow-xs p-5 sm:p-6 border-2 transition-all ${
                isRecommended
                  ? 'border-[#D6A33B] ring-4 ring-[#D6A33B]/15'
                  : 'border-[#EBE5DC]'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-sans font-bold font-bold text-lg text-[#142B38]">{resp.label}</h4>
                  {isRecommended && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-[#FAF4E8] text-[#A67C1E] border border-[#F0E2C2] px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-[#A67C1E]" />
                      <span>Recommended Option</span>
                    </span>
                  )}
                </div>
                {!resp.feasible ? (
                  <span className="text-xs font-bold uppercase bg-[#F7F5F0] text-[#7A7269] border border-[#EBE5DC] px-2.5 py-0.5 rounded-full">
                    Not Feasible
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase bg-[#EAF5EC] text-[#176B43] border border-[#D1E7D5] px-2.5 py-0.5 rounded-full">
                    Feasible Action
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#7A7269] mb-4 leading-relaxed">{resp.description}</p>

              {resp.feasible && resp.metrics ? (
                <>
                  {/* Visual Impact Comparison Bars */}
                  <div className="bg-[#F7F5F0] rounded-xl p-4 border border-[#EBE5DC] mb-4 space-y-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#D6A33B]">
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
                    <div className="text-xs font-bold text-[#7A7269] uppercase tracking-wider mb-2">
                      Predicted Metric Comparison vs. Baseline
                    </div>
                    <MetricsGrid metrics={resp.metrics} baseline={result.baseline} />
                  </div>

                  {resp.explanation && (
                    <div className="mt-3.5 bg-[#F7F5F0] p-3.5 rounded-xl border border-[#EBE5DC] text-xs">
                      <div className="font-bold text-[#142B38] mb-1">Evaluation Analysis:</div>
                      <p className="text-[#7A7269] leading-relaxed">{resp.explanation}</p>
                    </div>
                  )}

                  {resp.trade_offs && resp.trade_offs.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-bold text-[#142B38]">Operational Trade-offs:</div>
                      <ul className="text-xs text-[#7A7269] list-disc ml-5 mt-1 space-y-1">
                        {resp.trade_offs.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dispatcher Decision Controls */}
                  <div className="mt-5 pt-4 border-t border-[#EBE5DC] flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#7A7269]">
                      {decisionMade
                        ? 'Operational action has been logged in audit record.'
                        : 'Review and approve dispatch order:'}
                    </span>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => onApprove(resp.response_id, true)}
                        disabled={decisionMade || decisionPending}
                        className="bg-[#176B43] hover:bg-[#256828] text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_2px_8px_rgba(46,125,50,0.25)] hover:shadow-[0_4px_12px_rgba(46,125,50,0.35)] active:scale-[0.98] cursor-pointer"
                      >
                        {decisionPending ? 'Processing…' : 'Approve Intervention'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onApprove(resp.response_id, false)}
                        disabled={decisionMade || decisionPending}
                        className="bg-[#F7F5F0] text-[#142B38] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#F2ECE1] disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-[#EBE5DC] active:scale-[0.98] cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 p-3.5 rounded-xl bg-[#F7F5F0] border border-[#EBE5DC] text-xs text-[#7A7269] italic">
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
