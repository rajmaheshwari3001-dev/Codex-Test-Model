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
      `🚍 Aaroh-Saarthi Transit Itinerary`,
      `• Preference: ${option.label} (${option.total_duration_minutes} min, ₹${option.total_fare ?? 'N/A'})`,
      `• Departure: ${option.departure_time} | Arrival: ${option.arrival_time}`,
      `• Transfers: ${option.transfers.length === 0 ? 'Direct journey' : `${option.transfers.length} transfer(s)`}`,
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
  const primaryRouteColor = option.legs[0]?.route_color || '#2563eb'

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
      className={`group relative overflow-hidden rounded-3xl border-2 bg-white text-left shadow-xs transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
        selected
          ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Primary Corridor Color Indicator Stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 transition-all group-hover:w-2.5"
        style={{ backgroundColor: primaryRouteColor }}
      />

      <div className="pl-6 pr-5 py-5 sm:pl-7 sm:pr-6 space-y-4">
        {/* Pass Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                isFastest
                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                  : isCheapest
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
              }`}
            >
              {option.label}
            </span>

            {option.transfers.length === 0 ? (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                Direct Line
              </span>
            ) : (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
                {option.transfers.length} {option.transfers.length === 1 ? 'Interchange' : 'Interchanges'}
              </span>
            )}
          </div>

          {/* Fare Badge */}
          {option.fare_available && option.total_fare !== null ? (
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-900 shadow-2xs">
                <span className="text-base font-black">₹{option.total_fare}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Fare</span>
              </div>
              <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                Synthetic Zone Tariff
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Fare not specified</span>
          )}
        </div>

        {/* Departure -> Arrival Times & Total Duration */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-950">
                {option.departure_time}
              </span>
              <span className="text-slate-400 text-base font-bold">➔</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-950">
                {option.arrival_time}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Scheduled departure from {option.legs[0]?.board_stop_name}
            </div>
          </div>

          {/* Duration Pill */}
          <div className="text-right">
            <div className="inline-flex items-baseline gap-1 rounded-2xl bg-slate-100 px-3.5 py-1.5 text-slate-900">
              <span className="text-xl font-black">{option.total_duration_minutes}</span>
              <span className="text-xs font-bold uppercase text-slate-500">min</span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Transit Legs */}
        <div className="space-y-2.5 pt-1">
          {option.legs.map((leg, legIdx) => {
            const isExpanded = Boolean(expandedLegs[legIdx])
            const intermediateCount = leg.intermediate_stops?.length || 0

            return (
              <div
                key={leg.leg_index}
                className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-2 transition-colors hover:bg-slate-50"
              >
                {/* Leg Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: leg.route_color || '#2563eb' }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{leg.route_name}</span>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700">
                      {leg.route_type === 'subway' || leg.route_type === 'metro' ? '🚇 Metro' : '🚌 Bus'}
                    </span>
                    <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                      Trip {leg.trip_id}
                    </span>
                    {leg.fare !== null && (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                        ₹{leg.fare}
                      </span>
                    )}
                  </div>

                  {/* Crowding badge */}
                  {leg.boarding_crowding_level && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        leg.boarding_crowding_level === 'high'
                          ? 'border border-rose-200 bg-rose-100 text-rose-900'
                          : leg.boarding_crowding_level === 'medium'
                          ? 'border border-amber-200 bg-amber-100 text-amber-900'
                          : 'border border-emerald-200 bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {leg.boarding_crowding_level === 'unknown'
                        ? 'Crowd: N/A'
                        : `Crowd: ${leg.boarding_crowding_level.toUpperCase()}`}
                    </span>
                  )}
                </div>

                {/* Stations */}
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-baseline justify-between text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-medium text-slate-600">Board:</span>
                      <strong className="text-slate-950 font-bold">{leg.board_stop_name}</strong>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{leg.departure_time}</span>
                  </div>

                  {/* Intermediate Stops Toggle */}
                  {intermediateCount > 0 && (
                    <div className="py-0.5 pl-4">
                      <button
                        type="button"
                        onClick={e => toggleLeg(legIdx, e)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <span>{isExpanded ? '▼ Hide' : '▶ Show'} {intermediateCount} stops in between</span>
                      </button>
                      {isExpanded && (
                        <ul className="my-2 ml-2 pl-3 border-l-2 border-blue-300 space-y-1 text-xs text-slate-600">
                          {leg.intermediate_stops.map((stopName, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                              {stopName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex items-baseline justify-between text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="font-medium text-slate-600">Alight:</span>
                      <strong className="text-slate-950 font-bold">{leg.alight_stop_name}</strong>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{leg.arrival_time}</span>
                  </div>
                </div>

                {/* Transfer interchange wait */}
                {legIdx < option.legs.length - 1 && option.transfers[legIdx] && (
                  <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs font-bold text-amber-950">
                    <span className="text-base" aria-hidden="true">🔄</span>
                    <div>
                      <span>Wait {option.transfers[legIdx].wait_minutes} min at </span>
                      <span className="underline">{option.transfers[legIdx].at_stop_name}</span>
                      <span> for connecting bus</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Delay Warnings */}
        {option.delay_warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
            {option.delay_warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 font-medium">
                <span aria-hidden="true">⚠️</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Card Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400">
            {selected ? '✓ Focused on interactive map' : 'Click to preview path on map'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyItinerary}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors shadow-2xs"
            >
              {copied ? '✓ Copied' : '📋 Copy Plan'}
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onSave()
              }}
              disabled={isSaved}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs ${
                isSaved
                  ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-default'
                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {isSaved ? '★ Saved' : '★ Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
