import { useState } from 'react'
import type { JourneyOption } from '../types'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave: () => void
  isSaved?: boolean
}

export default function RouteResultCard({ option, selected, onSelect, onSave, isSaved }: Props) {
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  function toggleLeg(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedLegs(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  function handleCopyItinerary(e: React.MouseEvent) {
    e.stopPropagation()
    const summaryLines = [
      `🚍 Aaroh-Saarthi Journey Plan`,
      `Route: ${option.label} (${option.total_duration_minutes} min, ₹${option.total_fare ?? 'N/A'})`,
      `Departure: ${option.departure_time} | Arrival: ${option.arrival_time}`,
      `Transfers: ${option.transfers.length === 0 ? 'Direct journey' : `${option.transfers.length} transfer(s)`}`,
      ``,
      ...option.legs.map((leg, i) => {
        const transfer = option.transfers[i]
        const legText = [
          `Leg ${i + 1}: ${leg.route_name} (Trip ${leg.trip_id})`,
          `  • Board: ${leg.board_stop_name} @ ${leg.departure_time}`,
          `  • Alight: ${leg.alight_stop_name} @ ${leg.arrival_time}`,
        ]
        if (transfer) {
          legText.push(`  ↳ Transfer: Wait ${transfer.wait_minutes} min at ${transfer.at_stop_name}`)
        }
        return legText.join('\n')
      }),
    ]

    navigator.clipboard
      .writeText(summaryLines.join('\n'))
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
      .catch(() => {
        setCopied(false)
      })
  }

  const isFastest = option.label.toLowerCase() === 'fastest'
  const isCheapest = option.label.toLowerCase() === 'cheapest'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`bg-white rounded-xl shadow-xs p-4 cursor-pointer transition-all border-2 text-left relative focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        selected
          ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
              isFastest
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : isCheapest
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            {option.label}
          </span>
          {option.transfers.length === 0 ? (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Direct Route
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {option.transfers.length} {option.transfers.length === 1 ? 'Transfer' : 'Transfers'}
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-500 font-mono">
          {option.data_status === 'scheduled' ? 'Scheduled Timetable' : option.data_status}
        </span>
      </div>

      {/* Main metrics (Duration, Times, Fare) */}
      <div className="flex items-baseline justify-between mb-3 border-b border-gray-100 pb-2.5">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {option.total_duration_minutes}
            </span>
            <span className="text-sm font-medium text-gray-500">min travel</span>
          </div>
          <div className="text-xs font-medium text-gray-700 mt-0.5">
            Dep: <span className="font-mono text-gray-900 font-semibold">{option.departure_time}</span> → Arr:{' '}
            <span className="font-mono text-gray-900 font-semibold">{option.arrival_time}</span>
          </div>
        </div>

        <div className="text-right">
          {option.fare_available && option.total_fare !== null ? (
            <div>
              <span className="text-xl font-bold text-emerald-700">₹{option.total_fare}</span>
              <div className="text-[10px] text-gray-400">Total Fare</div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Fare not specified</span>
          )}
        </div>
      </div>

      {/* Step-by-Step Leg Details */}
      <div className="space-y-3 mb-3">
        {option.legs.map((leg, legIdx) => {
          const isExpanded = Boolean(expandedLegs[legIdx])
          const intermediateCount = leg.intermediate_stops?.length || 0

          return (
            <div key={leg.leg_index} className="rounded-lg bg-gray-50/70 p-3 border border-gray-150">
              {/* Leg Header with Route Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: leg.route_color || '#4f46e5' }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-bold text-gray-800">{leg.route_name}</span>
                  <span className="text-[10px] font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    Trip {leg.trip_id}
                  </span>
                </div>

                {/* Crowding badge */}
                {leg.boarding_crowding_level && (
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      leg.boarding_crowding_level === 'high'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : leg.boarding_crowding_level === 'medium'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : leg.boarding_crowding_level === 'low'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {leg.boarding_crowding_level === 'unknown'
                      ? 'Crowd: N/A'
                      : `Crowd: ${leg.boarding_crowding_level.toUpperCase()}${
                          leg.boarding_crowding_percent ? ` (${leg.boarding_crowding_percent}%)` : ''
                        }`}
                  </span>
                )}
              </div>

              {/* Boarding and Alighting points */}
              <div className="space-y-1 text-xs">
                <div className="flex items-baseline justify-between text-gray-800">
                  <span className="font-medium">
                    🟢 Board at <span className="font-semibold">{leg.board_stop_name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-gray-600 font-semibold">{leg.departure_time}</span>
                </div>

                {/* Intermediate stops toggle */}
                {intermediateCount > 0 && (
                  <div className="py-0.5">
                    <button
                      type="button"
                      onClick={e => toggleLeg(legIdx, e)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 focus:outline-none"
                    >
                      <span>
                        {isExpanded ? '▼ Hide' : '▶ Show'} {intermediateCount} intermediate{' '}
                        {intermediateCount === 1 ? 'stop' : 'stops'}
                      </span>
                    </button>
                    {isExpanded && (
                      <ul className="my-1.5 ml-4 pl-2 border-l-2 border-indigo-200 space-y-1 text-[11px] text-gray-600">
                        {leg.intermediate_stops.map((stopName, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                            {stopName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex items-baseline justify-between text-gray-800">
                  <span className="font-medium">
                    🔴 Alight at <span className="font-semibold">{leg.alight_stop_name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-gray-600 font-semibold">{leg.arrival_time}</span>
                </div>
              </div>

              {/* Transfer junction information if followed by another leg */}
              {legIdx < option.legs.length - 1 && option.transfers[legIdx] && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center gap-2 text-xs text-amber-800 bg-amber-50/80 p-2 rounded">
                  <span aria-hidden="true">🔄</span>
                  <div>
                    <span className="font-semibold">{option.transfers[legIdx].wait_minutes} min wait</span> at{' '}
                    <span className="font-medium">{option.transfers[legIdx].at_stop_name}</span> for connecting bus
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Warnings & Alerts */}
      {option.delay_warnings.length > 0 && (
        <div className="mb-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-0.5">
          {option.delay_warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1">
              <span aria-hidden="true">⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card action footer: Map view indicator, Copy itinerary, Bookmark */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="text-[11px] text-gray-500">
          {selected ? '✓ Displayed on Map' : 'Click to display on map'}
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Itinerary button */}
          <button
            type="button"
            onClick={handleCopyItinerary}
            className="text-xs font-medium px-2.5 py-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
            title="Copy formatted journey plan"
          >
            {copied ? '✓ Copied' : '📋 Copy Plan'}
          </button>

          {/* Save Route bookmark button */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSave()
            }}
            disabled={isSaved}
            className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isSaved
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            {isSaved ? '★ Saved' : '★ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
