import type { DisruptionResult, ScenarioMetrics } from '../types'

interface Props {
  result: DisruptionResult
  onApprove: (responseId: string, approved: boolean) => void
}

function MetricCard({ label, value, unit, better }: { label: string; value: number | string; unit?: string; better?: boolean }) {
  return (
    <div className={`rounded p-3 text-center ${better === true ? 'bg-green-50' : better === false ? 'bg-red-50' : 'bg-gray-50'}`}>
      <div className="text-xl font-bold">{value}{unit}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function MetricsGrid({ metrics, baseline }: { metrics: ScenarioMetrics; baseline?: ScenarioMetrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <MetricCard
        label="Affected Passengers"
        value={metrics.affected_passengers}
        better={baseline ? metrics.affected_passengers < baseline.affected_passengers : undefined}
      />
      <MetricCard
        label="Avg Wait Increase"
        value={metrics.average_wait_increase_minutes}
        unit=" min"
        better={baseline ? metrics.average_wait_increase_minutes < baseline.average_wait_increase_minutes : undefined}
      />
      <MetricCard
        label="Delayed Trips"
        value={metrics.delayed_trips}
        better={baseline ? metrics.delayed_trips < baseline.delayed_trips : undefined}
      />
      <MetricCard
        label="Crowding Increase"
        value={metrics.crowding_increase_percent}
        unit="%"
        better={baseline ? metrics.crowding_increase_percent < baseline.crowding_increase_percent : undefined}
      />
    </div>
  )
}

export default function ScenarioComparison({ result, onApprove }: Props) {
  const recommended = result.recommended_response_id

  return (
    <div className="space-y-4">
      {/* Disruption info */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="font-semibold text-red-800 text-sm">
          Disruption: {result.disruption.description}
        </div>
        <div className="text-xs text-red-600 mt-1">
          Type: {result.disruption.disruption_type} | Bus: {result.disruption.affected_bus_id}
          {result.disruption.delay_minutes > 0 && ` | Delay: ${result.disruption.delay_minutes} min`}
        </div>
      </div>

      {/* Baseline */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-2">
          Baseline: No Action
        </h3>
        <MetricsGrid metrics={result.baseline} />
      </div>

      {/* Response options */}
      {result.responses.map(resp => (
        <div
          key={resp.response_id}
          className={`bg-white rounded-lg shadow p-4 border-2 ${
            recommended === resp.response_id ? 'border-green-400' : 'border-transparent'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 text-sm">
              {resp.label}
              {recommended === resp.response_id && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Recommended</span>
              )}
            </h3>
            {!resp.feasible && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Not Feasible</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{resp.description}</p>

          {resp.feasible && resp.metrics && (
            <>
              <MetricsGrid metrics={resp.metrics} baseline={result.baseline} />
              <div className="mt-3 text-sm text-gray-700">
                <div className="font-medium mb-1">Why this works:</div>
                <p className="text-xs text-gray-600">{resp.explanation}</p>
              </div>
              {resp.trade_offs.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-500">Trade-offs:</div>
                  <ul className="text-xs text-gray-600 list-disc ml-4 mt-1">
                    {resp.trade_offs.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onApprove(resp.response_id, true)}
                  className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => onApprove(resp.response_id, false)}
                  className="bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-400"
                >
                  Reject
                </button>
              </div>
            </>
          )}

          {!resp.feasible && (
            <p className="text-xs text-gray-500 italic">{resp.reason_if_infeasible}</p>
          )}
        </div>
      ))}
    </div>
  )
}
