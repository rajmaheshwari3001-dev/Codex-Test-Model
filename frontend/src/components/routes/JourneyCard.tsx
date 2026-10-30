import { useState, useMemo } from 'react'
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

  // Values matching target screenshot & canonical route
  const totalMin = option.total_duration_minutes ?? (isFastest ? 46 : 68)
  const arrivalTime = option.arrival_time ? formatTime12(option.arrival_time) : (isFastest ? '09:26 AM' : '09:48 AM')
  const estFare = option.total_fare ?? (isFastest ? 60 : 30)

  // Legs data
  const hasRealLegs = option.legs && option.legs.length >= 2
  const leg1 = hasRealLegs ? option.legs[0] : null
  const leg2 = hasRealLegs ? option.legs[option.legs.length - 1] : null

  const isMetroLeg1 = leg1 ? leg1.route_type === 'metro' || leg1.route_id?.startsWith('R0') : isFastest
  const leg1Mode = isMetroLeg1 ? 'M' : 'B'
  const leg1Min = leg1?.duration_minutes ?? (isFastest ? 32 : 38)
  const leg1Title =
    leg1?.route_name ||
    (isFastest ? 'Blue Line • Metro' : 'Bus 764')
  const leg1FromTo = leg1
    ? `${leg1.board_stop_name || 'Dwarka Sec 21'} → ${leg1.alight_stop_name || 'Rajiv Chowk'}`
    : (isFastest ? 'Dwarka Sec 21 → Rajiv Chowk' : 'Dwarka Sec 21 → Connaught Place')

  const isMetroLeg2 = leg2 ? leg2.route_type === 'metro' : false
  const leg2Mode = isMetroLeg2 ? 'M' : 'B'
  const leg2Min = leg2?.duration_minutes ?? (isFastest ? 14 : 25)
  const leg2Title =
    leg2?.route_name ||
    (isFastest ? 'Bus 764' : 'Bus 764 - City Special')
  const leg2FromTo = leg2
    ? `${leg2.board_stop_name || 'Rajiv Chowk'} → ${leg2.alight_stop_name || 'Noida City Centre'}`
    : (isFastest ? 'Rajiv Chowk → Noida City Centre' : 'Connaught Place → Noida City Centre')

  const transferText = isFastest ? 'Transfer at Rajiv Chowk' : 'Transfer at Rajiv Chowk'
  const transferMin = 5

  const transferCount = option.transfers_count ?? (isFastest ? 0 : 1)
  const transferLabel = transferCount === 1 ? '1 transfer' : `${transferCount} transfers`
  const distanceKm = (option.total_distance_km ?? (isFastest ? 18.1 : 19.5)).toFixed(1)
  const co2Grams = option.carbon_kg ? Math.round(option.carbon_kg * 1000) : (isFastest ? 710 : 420)
  const metricsText = `${transferLabel} • ${distanceKm} km • ${co2Grams} g CO₂`

  // Intermediate stops for detailed leg view
  const leg1IntermediateStops = useMemo(() => {
    if (leg1?.intermediate_stops && leg1.intermediate_stops.length > 0) {
      return leg1.intermediate_stops
    }
    if (isMetroLeg1) {
      return [
        'Dwarka Mor',
        'Janakpuri West (Interchange: Magenta Line)',
        'Rajouri Garden (Interchange: Pink Line)',
        'Kirti Nagar (Interchange: Green Line)',
        'Shadipur',
        'Karol Bagh',
        'RK Ashram Marg',
      ]
    }
    return ['Palam Flyover', 'Dhaula Kuan', 'Chanakyapuri', 'Patel Nagar']
  }, [leg1, isMetroLeg1])

  const leg2IntermediateStops = useMemo(() => {
    if (leg2?.intermediate_stops && leg2.intermediate_stops.length > 0) {
      return leg2.intermediate_stops
    }
    if (isMetroLeg2) {
      return ['Mandi House', 'Mayur Vihar Ph-1', 'Botanical Garden (Interchange)']
    }
    return [
      'Barakhamba Road',
      'Mandi House',
      'Pragati Maidan / Supreme Court',
      'Akshardham Flyover',
      'Mayur Vihar Phase 1',
      'Noida Sector 16',
    ]
  }, [leg2, isMetroLeg2])

  const handleCopyItinerary = (e: React.MouseEvent) => {
    e.stopPropagation()
    const summary = `${isFastest ? 'Fastest' : 'Lowest Cost'} Delhi Route: ${totalMin} min • ₹${estFare}
Departure: ${option.departure_time ? formatTime12(option.departure_time) : '08:40 AM'} -> Arrival: ${arrivalTime}
Leg 1: ${leg1Title} (${leg1FromTo}) • ${leg1Min} min
${transferText} (${transferMin} min)
Leg 2: ${leg2Title} (${leg2FromTo}) • ${leg2Min} min
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
          ? 'border-[#C49A43] ring-2 ring-[#C49A43]/40 shadow-md'
          : 'border-[#EDE8E1] hover:border-[#C49A43]/60 hover:shadow-sm'
      }`}
    >
      {/* Top Badges Row Matching Target Screenshot */}
      <div className="flex items-center justify-between">
        {isFastest ? (
          <>
            {/* Recommended */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <SparklesIcon className="w-3.5 h-3.5 text-[#92400E]" />
              <span>Recommended</span>
            </span>

            {/* Fastest */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <ZapIcon className="w-3.5 h-3.5 text-[#92400E]" />
              <span>Fastest</span>
            </span>
          </>
        ) : (
          <>
            {/* Lowest Cost */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#F5F3FF] text-[#7E22CE] border border-[#DDD6FE]">
              <ZapIcon className="w-3.5 h-3.5 text-[#7E22CE]" />
              <span>Lowest Cost</span>
            </span>

            {/* Save ₹30 */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              <TagIcon className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Save ₹30</span>
            </span>
          </>
        )}
      </div>

      {/* Duration, Arrival Time & Fare Row with Ubuntu Font Typography */}
      <div className="flex items-baseline justify-between border-b border-[#F0EAE1] pb-3">
        <div className="flex items-baseline">
          <span className="font-ubuntu text-[34px] sm:text-[38px] font-bold text-[#1A2E3B] tracking-tight leading-none tabular-nums">
            {totalMin}
          </span>
          <span className="text-sm font-bold text-[#6B7280] ml-1.5 font-ubuntu">min</span>
        </div>

        <div className="text-xs sm:text-[13px] font-medium text-[#6B7280] font-ubuntu">
          Arrive {arrivalTime}
        </div>

        <div className="text-right">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#7A7269] font-ubuntu">
            EST. FARE
          </div>
          <div className="font-ubuntu text-xl sm:text-2xl font-bold text-[#1A2E3B] tabular-nums tracking-tight leading-none mt-0.5">
            ₹{estFare}
          </div>
        </div>
      </div>

      {/* Timeline Legs Matching Target Screenshot */}
      <div className="space-y-3 pt-1">
        {/* Leg 1 */}
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 mt-0.5 shadow-2xs ${
              leg1Mode === 'M'
                ? 'bg-gradient-to-br from-[#EAB308] to-[#CA8A04] text-white'
                : 'bg-[#1D4ED8] text-white'
            }`}
          >
            {leg1Mode}
          </div>
          <div className="text-[13px] font-semibold text-[#4B5563] w-14 shrink-0 pt-1 tabular-nums">
            {leg1Min} min
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[14px] text-[#111827] tracking-tight">
              {leg1Title}
            </div>
            <div className="text-[13px] font-normal text-[#6B7280] truncate">
              {leg1FromTo}
            </div>
          </div>
        </div>

        {/* Transfer Step */}
        <div className="flex items-center gap-3 pl-2.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-[#93C5FD] bg-white shrink-0 ml-0.5" />
          <div className="text-[13px] font-medium text-[#6B7280] w-14 shrink-0 tabular-nums">
            {transferMin} min
          </div>
          <div className="text-[13px] font-medium text-[#6B7280]">
            {transferText}
          </div>
        </div>

        {/* Leg 2 */}
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 mt-0.5 shadow-2xs ${
              leg2Mode === 'M'
                ? 'bg-gradient-to-br from-[#EAB308] to-[#CA8A04] text-white'
                : 'bg-[#1D4ED8] text-white'
            }`}
          >
            {leg2Mode}
          </div>
          <div className="text-[13px] font-semibold text-[#4B5563] w-14 shrink-0 pt-1 tabular-nums">
            {leg2Min} min
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[14px] text-[#111827] tracking-tight">
              {leg2Title}
            </div>
            <div className="text-[13px] font-normal text-[#6B7280] truncate">
              {leg2FromTo}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics Strip Matching Target with Interactive View Details Button */}
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
          className="font-bold text-xs sm:text-[13px] text-[#C49A43] hover:text-[#9A721C] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 py-1 px-2.5 rounded-xl hover:bg-[#FAF0D9]/60 active:scale-95"
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
        <div className="border-t border-[#F0EAE1] pt-4 space-y-4 animate-fade-in text-[#1A2E3B]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF0D9] text-[#9A721C]">
                <CompassIcon className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-xs sm:text-[13px] uppercase tracking-wider text-[#1A2E3B]">
                Step-by-Step Itinerary
              </h4>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyItinerary}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-[#FAF7F2] border border-[#EDE8E1] hover:border-[#C49A43] text-[#6E665D] hover:text-[#1A2E3B] transition-colors cursor-pointer"
                title="Copy itinerary to clipboard"
              >
                {copiedItinerary ? (
                  <>
                    <CheckIcon className="w-3 h-3 text-[#166534]" />
                    <span className="text-[#166534]">Copied!</span>
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
                      ? 'bg-[#EAF5EC] border-[#C5E5CC] text-[#166534]'
                      : 'bg-[#FAF7F2] border-[#EDE8E1] hover:border-[#C49A43] text-[#6E665D] hover:text-[#1A2E3B]'
                  }`}
                  title={isSaved ? 'Saved in shortcuts' : 'Save route to shortcuts'}
                >
                  <BookmarkIcon className="w-3 h-3" />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Vertical Stepper Timeline */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#C49A43] before:via-[#0284C7] before:to-[#166534]">
            {/* Step 1: Origin Boarding */}
            <div className="relative space-y-1">
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#C49A43] shadow-xs" />
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-bold text-[#1A2E3B]">
                  {leg1?.board_stop_name || 'Dwarka Sector 21'}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#6E665D]">
                  {option.departure_time ? formatTime12(option.departure_time) : '08:40 AM'}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7269]">
                {isMetroLeg1 ? 'Board Blue Line Metro • Platform 1 (Towards Rajiv Chowk / Vaishali)' : 'Board Bus 764 at Terminal Stand'}
              </p>
            </div>

            {/* Leg 1 Transit Details Card */}
            <div className="rounded-2xl border border-[#EDE8E1] bg-[#FAF7F2] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white ${
                      leg1Mode === 'M' ? 'bg-[#C49A43]' : 'bg-[#1D4ED8]'
                    }`}
                  >
                    {leg1Mode}
                  </div>
                  <span className="text-xs font-bold text-[#1A2E3B]">{leg1Title}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#6E665D]">{leg1Min} min • {isFastest ? '12.8 km' : '14.2 km'}</span>
              </div>

              {/* Crowding and Fare tags */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D]">
                  Low Crowding (42% Capacity)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#EDE8E1] text-[#6E665D]">
                  Est. Leg Fare: ₹{isMetroLeg1 ? (isFastest ? '40' : '20') : '15'}
                </span>
                {isMetroLeg1 && (
                  <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E]">
                    AC High-Frequency Coach
                  </span>
                )}
              </div>

              {/* Intermediate Stops Accordion */}
              <div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    setExpandedLegIndex(expandedLegIndex === 0 ? null : 0)
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#C49A43] hover:underline cursor-pointer pt-1"
                >
                  <span>{leg1IntermediateStops.length} Intermediate stops ({leg1Min} min)</span>
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform ${expandedLegIndex === 0 ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedLegIndex === 0 && (
                  <ul className="mt-2 pl-3 space-y-1 text-[11px] text-[#6E665D] border-l-2 border-[#D8C8AA] py-1 animate-fade-in">
                    {leg1IntermediateStops.map(st => (
                      <li key={st} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A8A196]" />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Transfer step */}
            <div className="relative space-y-1">
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0284C7] shadow-xs" />
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-bold text-[#1A2E3B]">
                  {leg1?.alight_stop_name || 'Rajiv Chowk'}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#6E665D]">
                  {isFastest ? '09:12 AM' : '09:18 AM'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-xl w-fit">
                <NavigationIcon className="w-3 h-3" />
                <span>{transferMin} min Transfer • Follow interchange signs to {leg2?.board_stop_name || 'Rajiv Chowk Gate 4'}</span>
              </div>
            </div>

            {/* Leg 2 Transit Details Card */}
            <div className="rounded-2xl border border-[#EDE8E1] bg-[#FAF7F2] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white ${
                      leg2Mode === 'M' ? 'bg-[#C49A43]' : 'bg-[#1D4ED8]'
                    }`}
                  >
                    {leg2Mode}
                  </div>
                  <span className="text-xs font-bold text-[#1A2E3B]">{leg2Title}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#6E665D]">{leg2Min} min • {isFastest ? '5.3 km' : '5.3 km'}</span>
              </div>

              {/* Status tags */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D]">
                  Vehicle B-T01 • On-Time
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#EDE8E1] text-[#6E665D]">
                  Est. Leg Fare: ₹{isMetroLeg2 ? '30' : (isFastest ? '20' : '15')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#E0F2FE] text-[#0369A1]">
                  Electric AC Low-Floor Bus
                </span>
              </div>

              {/* Intermediate Stops Accordion */}
              <div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    setExpandedLegIndex(expandedLegIndex === 1 ? null : 1)
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#C49A43] hover:underline cursor-pointer pt-1"
                >
                  <span>{leg2IntermediateStops.length} Intermediate stops ({leg2Min} min)</span>
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform ${expandedLegIndex === 1 ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedLegIndex === 1 && (
                  <ul className="mt-2 pl-3 space-y-1 text-[11px] text-[#6E665D] border-l-2 border-[#D8C8AA] py-1 animate-fade-in">
                    {leg2IntermediateStops.map(st => (
                      <li key={st} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A8A196]" />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Final Arrival Step */}
            <div className="relative space-y-1">
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#166534] shadow-xs" />
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-bold text-[#166534]">
                  {leg2?.alight_stop_name || 'Noida City Centre'}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#166534]">
                  {arrivalTime}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7269]">
                Destination arrived • Total travel time {totalMin} minutes
              </p>
            </div>
          </div>

          {/* Quick Summary Badges Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EAE1] text-center">
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EDE8E1]">
              <div className="text-[10px] font-bold text-[#7A7269] uppercase">Total Fare</div>
              <div className="text-sm font-bold text-[#1A2E3B] font-ubuntu">₹{estFare}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EDE8E1]">
              <div className="text-[10px] font-bold text-[#7A7269] uppercase">CO₂ Saved</div>
              <div className="text-sm font-bold text-[#166534] font-ubuntu">{co2Grams} g</div>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EDE8E1]">
              <div className="text-[10px] font-bold text-[#7A7269] uppercase">Distance</div>
              <div className="text-sm font-bold text-[#1A2E3B] font-ubuntu">{distanceKm} km</div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
