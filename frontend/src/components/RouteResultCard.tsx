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
      className={`relative cursor-pointer rounded-[1.5rem] border-2 bg-[#fffdf7] p-5 text-left shadow-xs transition-all focus:outline-none focus:ring-4 focus:ring-[#d9ed55]/40 ${
        selected
          ? 'border-[#6c7d36] bg-[#f7f8ec] ring-4 ring-[#d9ed55]/20 shadow-sm'
          : 'border-[#e2ded3] hover:border-[#aab487] hover:shadow-sm'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isFastest
                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                : isCheapest
                ? 'border border-[#d6dfad] bg-[#f1f4df] text-[#45552f]'
                : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
            }`}
          >
            {option.label}
          </span>
          {option.transfers.length === 0 ? (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              Direct Route
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
              {option.transfers.length} {option.transfers.length === 1 ? 'Transfer' : 'Transfers'}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 font-mono font-medium">
          {option.data_status === 'scheduled' ? 'Scheduled Timetable' : option.data_status}
        </span>
      </div>

      {/* Main metrics (Duration, Times, Fare) */}
      <div className="flex items-baseline justify-between mb-4 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {option.total_duration_minutes}
            </span>
            <span className="text-sm sm:text-base font-semibold text-slate-500">min travel</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
            Dep: <span className="font-mono text-slate-950 font-bold">{option.departure_time}</span> → Arr:{' '}
            <span className="font-mono text-slate-950 font-bold">{option.arrival_time}</span>
          </div>
        </div>

        <div className="text-right">
          {option.fare_available && option.total_fare !== null ? (
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-800">₹{option.total_fare}</span>
              <div className="text-xs text-slate-400 font-medium">Total Fare</div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Fare not specified</span>
          )}
        </div>
      </div>

      {/* Step-by-Step Leg Details */}
      <div className="space-y-3.5 mb-4">
        {option.legs.map((leg, legIdx) => {
          const isExpanded = Boolean(expandedLegs[legIdx])
          const intermediateCount = leg.intermediate_stops?.length || 0

          return (
            <div key={leg.leg_index} className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 space-y-2">
              {/* Leg Header with Route Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: leg.route_color || '#059669' }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-bold text-slate-900">{leg.route_name}</span>
                  <span className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                    Trip {leg.trip_id}
                  </span>
                </div>

                {/* Crowding badge */}
                {leg.boarding_crowding_level && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      leg.boarding_crowding_level === 'high'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : leg.boarding_crowding_level === 'medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : leg.boarding_crowding_level === 'low'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
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
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex items-baseline justify-between text-slate-800">
                  <span className="font-medium">
                    🟢 Board at <span className="font-bold text-slate-950">{leg.board_stop_name}</span>
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-slate-700 font-bold">{leg.departure_time}</span>
                </div>

                {/* Intermediate stops toggle */}
                {intermediateCount > 0 && (
                  <div className="py-0.5">
                    <button
                      type="button"
                      onClick={e => toggleLeg(legIdx, e)}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 focus:outline-none"
                    >
                      <span>
                        {isExpanded ? '▼ Hide' : '▶ Show'} {intermediateCount} intermediate{' '}
                        {intermediateCount === 1 ? 'stop' : 'stops'}
                      </span>
                    </button>
                    {isExpanded && (
                      <ul className="my-2 ml-4 pl-2.5 border-l-2 border-emerald-300 space-y-1 text-xs text-slate-600">
                        {leg.intermediate_stops.map((stopName, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {stopName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex items-baseline justify-between text-slate-800">
                  <span className="font-medium">
                    🔴 Alight at <span className="font-bold text-slate-950">{leg.alight_stop_name}</span>
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-slate-700 font-bold">{leg.arrival_time}</span>
                </div>
              </div>

              {/* Transfer junction information if followed by another leg */}
              {legIdx < option.legs.length - 1 && option.transfers[legIdx] && (
                <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 flex items-center gap-2.5 text-xs sm:text-sm text-amber-950 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200">
                  <span aria-hidden="true" className="text-base">🔄</span>
                  <div>
                    <span className="font-bold">{option.transfers[legIdx].wait_minutes} min wait</span> at{' '}
                    <span className="font-semibold">{option.transfers[legIdx].at_stop_name}</span> for connecting bus
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Warnings & Alerts */}
      {option.delay_warnings.length > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1">
          {option.delay_warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span aria-hidden="true">⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card action footer: Map view indicator, Copy itinerary, Bookmark */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">
          {selected ? '✓ Currently viewed on map' : 'Click card to view on map'}
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Itinerary button */}
          <button
            type="button"
            onClick={handleCopyItinerary}
            className="text-xs font-bold px-3 py-1.5 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
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
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isSaved
                ? 'bg-slate-100 text-slate-500 cursor-default border border-slate-200'
                : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 border border-emerald-300'
            }`}
          >
            {isSaved ? '★ Saved' : '★ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
