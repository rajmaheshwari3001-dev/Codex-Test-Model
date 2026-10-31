import { useState } from 'react'
import type { JourneyOption } from '../../types'
import { formatTime12 } from '../../utils/time'
import {
  SparklesIcon,
  ZapIcon,
  TagIcon,
  InfoIcon,
  ArrowRightIcon,
  CompassIcon,
  CheckIcon,
  CopyIcon,
  BookmarkIcon,
  NavigationIcon,
  ChevronDownIcon,
} from '../common/Icons'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave?: () => void
  isSaved?: boolean
  type?: 'fastest' | 'cheapest' | 'recommended'
  onOpenCashbackModal?: () => void
}

export default function JourneyCard({
  option,
  selected,
  onSelect,
  onSave,
  isSaved,
  type,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedLegIndex, setExpandedLegIndex] = useState<number | null>(null)
  const [copiedItinerary, setCopiedItinerary] = useState(false)

  const isFastest = type === 'fastest' || option.label.toLowerCase() === 'fastest'
  const isCheapest = type === 'cheapest' || option.label.toLowerCase().includes('cheap') || option.label.toLowerCase().includes('lowest')

  // Real legs from option or default fallback
  const legs = option.legs && option.legs.length > 0 ? option.legs : []

  // Values from option
  const totalMin = option.total_duration_minutes ?? (legs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || (isFastest ? 46 : 68))
  const arrivalTime = option.arrival_time ? formatTime12(option.arrival_time) : (isFastest ? '09:26 AM' : '09:48 AM')
  const departureTime = option.departure_time ? formatTime12(option.departure_time) : '08:40 AM'
  const estFare = option.total_fare ?? (isFastest ? 60 : 30)

  // Transfers count & text
  const transferCount = option.transfers?.length ?? Math.max(0, legs.length - 1)
  const transferLabel = transferCount === 0 ? '0 transfers' : transferCount === 1 ? '1 transfer' : `${transferCount} transfers`
  const distanceKm = (option.total_distance_km ?? (legs.reduce((acc, l) => acc + (l.distance_km || 0), 0) || (isFastest ? 18.1 : 19.5))).toFixed(1)
  const co2Grams = option.carbon_kg ? Math.round(option.carbon_kg * 1000) : Math.round(parseFloat(distanceKm) * 35)
  const metricsText = `${transferLabel} • ${distanceKm} km • ${co2Grams} g CO₂`

  const handleCopyItinerary = (e: React.MouseEvent) => {
    e.stopPropagation()
    const summary = `${isFastest ? 'Fastest' : isCheapest ? 'Lowest Cost' : 'Recommended'} Delhi Route: ${totalMin} min • ₹${estFare}
Departure: ${departureTime} -> Arrival: ${arrivalTime}
${legs.map((leg, idx) => `Leg ${idx + 1}: ${leg.route_name} (${leg.board_stop_name} → ${leg.alight_stop_name}) • ${leg.duration_minutes || 0} min`).join('\n')}
Total: ${metricsText}
Planned with Aaroh-Saarthi Delhi Transit.`

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary)
      setCopiedItinerary(true)
      setTimeout(() => setCopiedItinerary(false), 2500)
    }
  }

  return (
    <article
      onClick={onSelect}
      role="region"
      aria-label={`${isFastest ? 'Fastest' : 'Lowest Cost'} Route: ${totalMin} minutes, ₹${estFare}`}
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-200 cursor-pointer bg-white p-5 space-y-4 ${
        selected
          ? 'border-[#D6A33B] ring-2 ring-[#D6A33B]/40 shadow-md'
          : 'border-[#E5E0D8] hover:border-[#D6A33B]/60 hover:shadow-sm'
      }`}
    >
      {/* Top Badges Row */}
      <div className="flex items-center justify-between">
        {isFastest ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <SparklesIcon className="w-3.5 h-3.5 text-[#92400E]" />
              <span>Recommended</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <ZapIcon className="w-3.5 h-3.5 text-[#92400E]" />
              <span>Fastest</span>
            </span>
          </>
        ) : isCheapest ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#F5F3FF] text-[#7E22CE] border border-[#DDD6FE]">
              <ZapIcon className="w-3.5 h-3.5 text-[#7E22CE]" />
              <span>Lowest Cost</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              <TagIcon className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Save ₹{Math.max(15, 60 - estFare)}</span>
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
              <SparklesIcon className="w-3.5 h-3.5 text-[#166534]" />
              <span>{option.label || 'Alternative Route'}</span>
            </span>
            <span className="text-[12px] font-medium text-[#6B7280]">
              {legs.length} {legs.length === 1 ? 'leg' : 'legs'}
            </span>
          </>
        )}
      </div>

      {/* Duration, Arrival Time & Fare Row */}
      <div className="flex items-baseline justify-between border-b border-[#F0EAE1] pb-3">
        <div className="flex items-baseline">
          <span className="font-sans text-3xl sm:text-4xl font-bold text-[#142B38] tabular-nums tracking-tight leading-none">
            {totalMin}
          </span>
          <span className="text-[13px] font-semibold text-[#6B7280] ml-1.5 mr-6 sm:mr-8 font-sans">
            min
          </span>
          <div className="text-[12px] sm:text-[13px] text-[#6B7280]">
            <span>Arrive </span>
            <span className="font-semibold text-[#142B38] tabular-nums font-sans">
              {arrivalTime}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#7A7269] font-sans">
            EST. FARE
          </div>
          <div className="font-sans text-xl sm:text-2xl font-bold text-[#142B38] tabular-nums tracking-tight leading-none mt-0.5">
            ₹{estFare}
          </div>
        </div>
      </div>

      {/* Dynamic Timeline Legs */}
      <div className="space-y-3 pt-1">
        {legs.map((leg, legIdx) => {
          const isMetro = leg.route_type === 'metro' || leg.route_id?.startsWith('R0')
          const modeLetter = isMetro ? 'M' : 'B'
          const duration = leg.duration_minutes ?? Math.round(totalMin / Math.max(1, legs.length))
          const title = leg.route_name || (isMetro ? 'Delhi Metro' : 'DTC City Bus')
          const fromTo = `${leg.board_stop_name || 'Origin'} → ${leg.alight_stop_name || 'Destination'}`

          // Check if there is a transfer after this leg
          const hasTransferAfter = legIdx < legs.length - 1
          const transferInfo = option.transfers?.[legIdx]
          const transferWait = transferInfo?.wait_minutes ?? 5
          const transferStop = transferInfo?.at_stop_name ?? leg.alight_stop_name ?? 'Interchange'

          return (
            <div key={`${leg.trip_id || leg.route_id}-${legIdx}`} className="space-y-3">
              {/* Leg row */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 mt-0.5 shadow-2xs ${
                    isMetro
                      ? 'bg-gradient-to-br from-[#EAB308] to-[#CA8A04] text-white'
                      : 'bg-[#1D4ED8] text-white'
                  }`}
                >
                  {modeLetter}
                </div>
                <div className="text-[13px] font-semibold text-[#4B5563] w-14 shrink-0 pt-1 tabular-nums">
                  {duration} min
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[14px] text-[#111827] tracking-tight truncate">
                    {title}
                  </div>
                  <div className="text-[13px] font-normal text-[#6B7280] truncate">
                    {fromTo}
                  </div>
                </div>
              </div>

              {/* Transfer row if applicable */}
              {hasTransferAfter && (
                <div className="flex items-center gap-3 pl-2.5">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#93C5FD] bg-white shrink-0 ml-0.5" />
                  <div className="text-[13px] font-medium text-[#6B7280] w-14 shrink-0 tabular-nums">
                    {transferWait} min
                  </div>
                  <div className="text-[13px] font-medium text-[#6B7280] truncate">
                    Transfer at {transferStop}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Metrics Strip with Interactive View Details Button */}
      <div className="border-t border-[#F0EAE1] pt-3.5 flex items-center justify-between text-[13px] text-[#6B7280]">
        <div className="flex items-center gap-1.5 font-medium truncate mr-2">
          <span>{metricsText}</span>
          <InfoIcon className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </div>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            setIsExpanded(prev => !prev)
          }}
          aria-expanded={isExpanded}
          className="font-bold text-xs sm:text-[13px] text-[#D6A33B] hover:text-[#9A721C] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 py-1 px-2.5 rounded-xl hover:bg-[#FAF4E8]/60 active:scale-95"
        >
          <span>{isExpanded ? 'Hide details' : 'View details'}</span>
          <ArrowRightIcon
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isExpanded ? '-rotate-90 text-[#9A721C]' : 'group-hover:translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Expanded Step-by-Step Navigation & Itinerary Breakdown */}
      {isExpanded && (
        <div className="border-t border-[#F0EAE1] pt-4 space-y-4 animate-fade-in text-[#142B38]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF4E8] text-[#9A721C]">
                <CompassIcon className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-xs sm:text-[13px] uppercase tracking-wider text-[#142B38]">
                Step-by-Step Itinerary
              </h4>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyItinerary}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-[#F7F5F0] border border-[#E5E0D8] hover:border-[#D6A33B] text-[#6E665D] hover:text-[#142B38] transition-colors cursor-pointer"
                title="Copy itinerary to clipboard"
              >
                {copiedItinerary ? (
                  <>
                    <CheckIcon className="w-3 h-3 text-[#176B43]" />
                    <span className="text-[#176B43]">Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onSave && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onSave()
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-[#EAF5EC] border-[#C5E5CC] text-[#176B43]'
                      : 'bg-[#F7F5F0] border-[#E5E0D8] hover:border-[#D6A33B] text-[#6E665D] hover:text-[#142B38]'
                  }`}
                  title={isSaved ? 'Saved in shortcuts' : 'Save route to shortcuts'}
                >
                  <BookmarkIcon className="w-3 h-3" />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Vertical Timeline */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#D6A33B] before:via-[#0284C7] before:to-[#176B43]">
            {legs.map((leg, legIdx) => {
              const isMetro = leg.route_type === 'metro' || leg.route_id?.startsWith('R0')
              const modeLetter = isMetro ? 'M' : 'B'
              const legDuration = leg.duration_minutes ?? Math.round(totalMin / Math.max(1, legs.length))
              const legDistance = leg.distance_km ? `${leg.distance_km} km` : `${(parseFloat(distanceKm) / Math.max(1, legs.length)).toFixed(1)} km`
              const intermediateStops = leg.intermediate_stops || []
              const hasTransferAfter = legIdx < legs.length - 1
              const transferInfo = option.transfers?.[legIdx]
              const transferWait = transferInfo?.wait_minutes ?? 5
              const nextLeg = legs[legIdx + 1]

              return (
                <div key={`expanded-leg-${legIdx}`} className="space-y-3">
                  {/* Step Boarding Pin */}
                  <div className="relative space-y-1">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#D6A33B] shadow-xs" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-[13px] font-bold text-[#142B38]">
                        {leg.board_stop_name || 'Boarding Station'}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#6E665D]">
                        {leg.departure_time ? formatTime12(leg.departure_time) : departureTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A7269]">
                      Board {leg.route_name || (isMetro ? 'Delhi Metro' : 'DTC City Bus')}
                    </p>
                  </div>

                  {/* Leg Detail Card */}
                  <div className="rounded-2xl border border-[#E5E0D8] bg-[#F7F5F0] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white ${
                            isMetro ? 'bg-[#D6A33B]' : 'bg-[#1D4ED8]'
                          }`}
                        >
                          {modeLetter}
                        </div>
                        <span className="text-xs font-bold text-[#142B38]">{leg.route_name || (isMetro ? 'Delhi Metro' : 'City Bus')}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#6E665D]">
                        {legDuration} min • {legDistance}
                      </span>
                    </div>

                    {/* Crowding and Fare tags */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D]">
                        Crowding: {leg.boarding_crowding_percent ?? 32}% ({leg.boarding_crowding_level || 'Low'})
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[#6E665D]">
                        Leg Fare: ₹{leg.fare ?? Math.round(estFare / legs.length)}
                      </span>
                    </div>

                    {/* Intermediate Stops Accordion */}
                    {intermediateStops.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            setExpandedLegIndex(expandedLegIndex === legIdx ? null : legIdx)
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#D6A33B] hover:underline cursor-pointer pt-1"
                        >
                          <span>{intermediateStops.length} Intermediate stops</span>
                          <ChevronDownIcon
                            className={`w-3 h-3 transition-transform ${expandedLegIndex === legIdx ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {expandedLegIndex === legIdx && (
                          <ul className="mt-2 pl-3 space-y-1 text-[11px] text-[#6E665D] border-l-2 border-[#D8C8AA] py-1 animate-fade-in">
                            {intermediateStops.map((st, sIdx) => (
                              <li key={sIdx} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#A8A196]" />
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Transfer Step if needed */}
                  {hasTransferAfter && (
                    <div className="relative space-y-1">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0284C7] shadow-xs" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-[13px] font-bold text-[#142B38]">
                          {leg.alight_stop_name || 'Interchange Station'}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#6E665D]">
                          {leg.arrival_time ? formatTime12(leg.arrival_time) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-xl w-fit">
                        <NavigationIcon className="w-3 h-3" />
                        <span>{transferWait} min Transfer • Follow signs to {nextLeg?.route_name || 'Connecting Route'}</span>
                      </div>
                    </div>
                  )}

                  {/* Final Destination Alighting Step */}
                  {!hasTransferAfter && (
                    <div className="relative space-y-1">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#176B43] shadow-xs" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-[13px] font-bold text-[#176B43]">
                          {leg.alight_stop_name || 'Destination'}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#176B43]">
                          {leg.arrival_time ? formatTime12(leg.arrival_time) : arrivalTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A7269]">
                        Arrive at destination • Total travel time {totalMin} minutes
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quick Summary Badges Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EAE1] text-center">
            <div className="p-2 rounded-xl bg-[#F7F5F0] border border-[#E5E0D8]">
              <div className="text-[10px] font-bold text-[#7A7269] uppercase">Total Fare</div>
              <div className="text-sm font-bold text-[#142B38] font-sans">₹{estFare}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#F7F5F0] border border-[#E5E0D8]">
              <div className="text-[10px] font-bold text-[#7A7269] uppercase">CO₂ Saved</div>
              <div className="text-sm font-bold text-[#176B43] font-sans">{co2Grams} g</div>
            </div>
            <div className="p-2 rounded-xl bg-[#F7F5F0] border border-[#E5E0D8]">
              <div className="text-[10px] font-bold text-[#7A7269] uppercase">Distance</div>
              <div className="text-sm font-bold text-[#142B38] font-sans">{distanceKm} km</div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
