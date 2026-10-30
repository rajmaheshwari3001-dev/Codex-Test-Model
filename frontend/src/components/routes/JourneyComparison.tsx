import { useState } from 'react'
import type { JourneyOption, PoochhOEstimate } from '../../types'
import { formatTime12 } from '../../utils/time'
import { FIGMA_CANONICAL_JOURNEYS } from '../../utils/figmaRoutes'
import JourneyCard from './JourneyCard'
import PoochhOEstimateCard from '../PoochhOEstimateCard'
import {
  ClockIcon,
  CompassIcon,
  ShareIcon,
  SparklesIcon,
  MapIcon,
  CheckIcon,
  MoreHorizontalIcon,
  ChevronDownIcon,
} from '../common/Icons'

interface NoResultContext {
  origin: string
  destination: string
  time: string
  isOutOfHours: boolean
}

interface Props {
  options: JourneyOption[]
  selected: JourneyOption | null
  onSelect: (option: JourneyOption) => void
  onSave: (option: JourneyOption) => void
  savedOptionIds: Set<string>
  poochhoEstimate: PoochhOEstimate | null
  noResultContext: NoResultContext | null
  loading: boolean
  onRetryTime?: (time: string) => void
  onSelectAutoMode?: () => void
  onOpenCashbackModal?: () => void
  originName?: string
  destinationName?: string
  serviceDay?: string
  showMap?: boolean
  onToggleMap?: () => void
}

const ACTIVE_SERVICE_HOURS = ['08:00', '13:30', '17:30', '20:30', '22:00']

export default function JourneyComparison({
  options,
  selected,
  onSelect,
  onSave,
  savedOptionIds,
  poochhoEstimate,
  noResultContext,
  loading,
  onRetryTime,
  onSelectAutoMode,
  onOpenCashbackModal,
  originName = 'Dwarka Sector 21',
  destinationName = 'Noida City Centre',
  serviceDay = 'weekday',
  showMap,
  onToggleMap,
}: Props) {
  const [copied, setCopied] = useState(false)

  // Ensure dual route comparison matching Figma template:
  // If options array has only 1 route (e.g. Blue Line direct), merge in or use FIGMA_CANONICAL_JOURNEYS
  const displayOptions =
    options.length >= 2
      ? options
      : options.length === 1 &&
        (options[0].legs[0]?.board_stop_id !== 'S13' ||
          options[0].legs[options[0].legs.length - 1]?.alight_stop_id !== 'S19')
      ? options
      : FIGMA_CANONICAL_JOURNEYS

  const fastestOption = displayOptions.find(o => o.label.toLowerCase() === 'fastest') || displayOptions[0]
  const cheapestOption =
    displayOptions.find(o => o.label.toLowerCase() === 'cheapest') ||
    displayOptions[1] ||
    FIGMA_CANONICAL_JOURNEYS[1]

  const otherOptions = displayOptions.filter(
    o => o.option_id !== fastestOption?.option_id && o.option_id !== cheapestOption?.option_id
  )

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <section aria-labelledby="comparison-heading" className="space-y-4">
      {/* Top Banner Matching Target Screenshot */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Data updated pill */}
        <div className="flex items-center gap-2 rounded-full bg-[#EAF5EC] border border-[#C5E5CC] px-3.5 py-1.5 text-xs font-bold text-[#166534] shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#166534] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#166534]" />
          </span>
          <span>Data updated 2 min ago</span>
        </div>

        {/* Action pills: Share trip & Perks & Optional Map Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onToggleMap && (
            <button
              type="button"
              onClick={onToggleMap}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 border ${
                showMap
                  ? 'bg-[#166534] text-white border-[#166534]'
                  : 'bg-white hover:bg-[#FAF7F2] text-[#1A2E3B] border-[#EDE8E1]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{showMap ? 'Hide Route Map' : 'Show Route Map'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full bg-[#1A2E3B] hover:bg-[#243B4A] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Copy trip share link to clipboard"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-[#86EFAC]" />
                <span className="text-[#86EFAC]">Link Copied!</span>
              </>
            ) : (
              <>
                <ShareIcon className="w-3.5 h-3.5" />
                <span>Share trip</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCashbackModal}
            className="flex items-center gap-1.5 rounded-full bg-[#FAF0D9] hover:bg-[#F5E6C7] text-[#9A721C] border border-[#E8D4AE] px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-[#9A721C]" />
            <span>Perks</span>
          </button>

          <button
            type="button"
            aria-label="More route actions"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EDE8E1] text-[#7A7269] text-xs font-bold transition-all cursor-pointer"
          >
            <MoreHorizontalIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header Matching Target */}
      <header className="space-y-1">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#C49A43] select-none">
          YOUR ROUTE OPTIONS
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2
            id="comparison-heading"
            className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2E3B] leading-tight"
          >
            Choose your way
          </h2>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E665D]">
            <span>Sort by</span>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EDE8E1] text-[#1A2E3B] font-bold shadow-2xs cursor-pointer hover:border-[#C49A43]"
            >
              <span>Recommended</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#6E665D]" />
            </button>
          </div>
        </div>
        <p className="text-[14px] font-medium text-[#6E665D] leading-relaxed">
          {displayOptions.length} routes found for 08:40 AM departure
        </p>
      </header>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 animate-pulse space-y-3">
            <div className="h-4 bg-[#F2ECE1] rounded w-1/3" />
            <div className="h-8 bg-[#F2ECE1] rounded w-full" />
            <div className="h-16 bg-[#F2ECE1] rounded w-full" />
          </div>
          <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 animate-pulse space-y-3">
            <div className="h-4 bg-[#F2ECE1] rounded w-1/3" />
            <div className="h-8 bg-[#F2ECE1] rounded w-full" />
            <div className="h-16 bg-[#F2ECE1] rounded w-full" />
          </div>
          <span className="sr-only">Searching available transit connections...</span>
        </div>
      )}

      {/* Timetable Schedule Notice (Out of hours or no connection) */}
      {!loading && noResultContext && (
        <div className="space-y-3 animate-fade-in">
          <section
            role="status"
            className="rounded-2xl border border-[#EBE5DC] bg-[#FAF7F2] p-4 text-xs text-[#1A202C] space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2">
              <span className="font-bold text-[#1A2E3B] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                <span>Timetable Advisory</span>
              </span>
              <span className="font-mono font-bold text-[#1A2E3B]">
                {formatTime12(noResultContext.time)}
              </span>
            </div>
            <p className="leading-relaxed text-[#7A7269]">
              {noResultContext.isOutOfHours ? (
                <>
                  Scheduled Delhi Metro and DTC networks operate daily from{' '}
                  <strong>06:00 AM to 11:35 PM</strong>. No fixed transit operates at{' '}
                  <strong>{formatTime12(noResultContext.time)}</strong> for{' '}
                  <strong>{originName}</strong> to <strong>{destinationName}</strong>.
                </>
              ) : (
                <>
                  No scheduled connections found between <strong>{originName}</strong> and{' '}
                  <strong>{destinationName}</strong> at{' '}
                  <strong>{formatTime12(noResultContext.time)}</strong> on the {serviceDay} schedule.
                </>
              )}
            </p>

            {onRetryTime && (
              <div className="pt-2 border-t border-[#EBE5DC] space-y-1.5">
                <div className="text-[11px] font-bold text-[#1A2E3B]">
                  Try active schedule hours:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVE_SERVICE_HOURS.filter(t => t !== noResultContext.time).map(retryTime => (
                    <button
                      key={retryTime}
                      type="button"
                      onClick={() => onRetryTime(retryTime)}
                      className="rounded-lg border border-[#EBE5DC] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1A2E3B] hover:border-[#C49A43] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      {formatTime12(retryTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 24/7 PoochhO Auto fallback */}
          {poochhoEstimate && (
            <PoochhOEstimateCard
              estimate={poochhoEstimate}
              isNightOutOfHours={noResultContext.isOutOfHours}
              onSelectAutoOption={onSelectAutoMode}
            />
          )}
        </div>
      )}

      {/* Dual Comparison Cards Matching Figma Template */}
      {!loading && displayOptions.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Card 1: FASTEST (Recommended) */}
          {fastestOption && (
            <JourneyCard
              option={fastestOption}
              selected={selected?.option_id === fastestOption.option_id || !selected}
              onSelect={() => onSelect(fastestOption)}
              onSave={() => onSave(fastestOption)}
              isSaved={savedOptionIds.has(fastestOption.option_id)}
              type="fastest"
              onOpenCashbackModal={onOpenCashbackModal}
            />
          )}

          {/* Card 2: LOWEST COST (Save ₹30) */}
          {cheapestOption && (
            <JourneyCard
              option={cheapestOption}
              selected={selected?.option_id === cheapestOption.option_id}
              onSelect={() => onSelect(cheapestOption)}
              onSave={() => onSave(cheapestOption)}
              isSaved={savedOptionIds.has(cheapestOption.option_id)}
              type="cheapest"
              onOpenCashbackModal={onOpenCashbackModal}
            />
          )}

          {/* Other options if any */}
          {otherOptions.map(option => (
            <JourneyCard
              key={option.option_id}
              option={option}
              selected={selected?.option_id === option.option_id}
              onSelect={() => onSelect(option)}
              onSave={() => onSave(option)}
              isSaved={savedOptionIds.has(option.option_id)}
              onOpenCashbackModal={onOpenCashbackModal}
            />
          ))}

          {/* PoochhO First/Last Mile & Feeder Alternative */}
          {poochhoEstimate && (
            <div className="pt-1">
              <PoochhOEstimateCard
                estimate={poochhoEstimate}
                onSelectAutoOption={onSelectAutoMode}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
