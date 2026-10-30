import type { JourneyOption, PoochhOEstimate } from '../../types'
import { formatTime12 } from '../../utils/time'
import JourneyCard from './JourneyCard'
import PoochhOEstimateCard from '../PoochhOEstimateCard'

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
  originName = 'Origin',
  destinationName = 'Destination',
  serviceDay = 'weekday',
}: Props) {
  const fastestOption = options.find(o => o.label.toLowerCase() === 'fastest')
  const cheapestOption = options.find(o => o.label.toLowerCase() === 'cheapest')

  const hasDistinctComparison =
    fastestOption !== undefined &&
    cheapestOption !== undefined &&
    fastestOption.option_id !== cheapestOption.option_id &&
    (fastestOption.total_duration_minutes !== cheapestOption.total_duration_minutes ||
      fastestOption.total_fare !== cheapestOption.total_fare)

  // Other options that are neither primary fastest nor primary cheapest
  const otherOptions = options.filter(
    o => o.option_id !== fastestOption?.option_id && o.option_id !== cheapestOption?.option_id
  )

  return (
    <section aria-labelledby="comparison-heading" className="space-y-4">
      <h2 id="comparison-heading" className="sr-only">
        Journey Options and Comparison
      </h2>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] p-5 animate-pulse space-y-3">
            <div className="h-4 bg-[#EDE7DB] rounded w-1/3" />
            <div className="h-8 bg-[#EDE7DB] rounded w-full" />
            <div className="h-16 bg-[#EDE7DB] rounded w-full" />
          </div>
          <div className="rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] p-5 animate-pulse space-y-3">
            <div className="h-4 bg-[#EDE7DB] rounded w-1/3" />
            <div className="h-8 bg-[#EDE7DB] rounded w-full" />
            <div className="h-16 bg-[#EDE7DB] rounded w-full" />
          </div>
          <span className="sr-only">Searching available transit connections...</span>
        </div>
      )}

      {/* Default State */}
      {!loading && options.length === 0 && !noResultContext && (
        <div className="rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] p-6 text-center space-y-3 shadow-xs animate-fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE7DB] text-2xl">
            🧭
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#172D3B]">
              Ready for Your Delhi Journey
            </h3>
            <p className="mt-1 text-xs text-[#73766F] max-w-sm mx-auto">
              Select origin and destination stations, set your departure time, and click Search Journey to compare fastest and lowest-cost routes.
            </p>
          </div>
        </div>
      )}

      {/* Timetable Schedule Notice (Out of hours or no connection) */}
      {!loading && noResultContext && (
        <div className="space-y-3 animate-fade-in">
          <section
            role="status"
            className="rounded-xl border border-[#C49A43]/40 bg-[#F5F0E6] p-4 text-xs text-[#29343A] space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-[#DAD3C6] pb-2">
              <span className="font-bold text-[#A97C2E] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>⏱</span> Timetable Notice
              </span>
              <span className="font-mono font-bold text-[#172D3B]">
                {formatTime12(noResultContext.time)}
              </span>
            </div>
            <p className="leading-relaxed text-[#73766F]">
              {noResultContext.isOutOfHours ? (
                <>
                  The scheduled Delhi network runs from <strong>06:00 AM to 11:35 PM</strong>. No transit service runs at{' '}
                  <strong>{formatTime12(noResultContext.time)}</strong> for <strong>{originName}</strong> ➔ <strong>{destinationName}</strong>.
                </>
              ) : (
                <>
                  No scheduled connections found between <strong>{originName}</strong> and <strong>{destinationName}</strong> at{' '}
                  <strong>{formatTime12(noResultContext.time)}</strong> on the {serviceDay} schedule.
                </>
              )}
            </p>

            {onRetryTime && (
              <div className="pt-2 border-t border-[#DAD3C6] space-y-1.5">
                <div className="text-[11px] font-bold text-[#172D3B]">
                  Try active timetable hours:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVE_SERVICE_HOURS.filter(t => t !== noResultContext.time).map(retryTime => (
                    <button
                      key={retryTime}
                      type="button"
                      onClick={() => onRetryTime(retryTime)}
                      className="rounded border border-[#DAD3C6] bg-white px-2 py-1 text-[11px] font-bold text-[#172D3B] hover:border-[#C49A43] hover:bg-[#FBF8F1] transition-colors"
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

      {/* Comparison Insight Callout */}
      {!loading && hasDistinctComparison && fastestOption && cheapestOption && (
        <div className="rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] p-3 text-xs text-[#29343A] space-y-1 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-[#172D3B]">
            <span>📊</span>
            <span>Route Comparison Insight</span>
          </div>
          <div className="space-y-0.5 text-[11px] text-[#73766F]">
            {fastestOption.total_duration_minutes < cheapestOption.total_duration_minutes && (
              <p>
                • <strong className="text-[#172D3B]">Fastest Route</strong> saves{' '}
                <strong className="text-[#C49A43]">
                  {cheapestOption.total_duration_minutes - fastestOption.total_duration_minutes} min
                </strong>{' '}
                of travel time.
              </p>
            )}
            {cheapestOption.total_fare !== null &&
              fastestOption.total_fare !== null &&
              cheapestOption.total_fare < fastestOption.total_fare && (
                <p>
                  • <strong className="text-[#172D3B]">Lowest Cost</strong> saves{' '}
                  <strong className="text-[#547A60]">
                    ₹{fastestOption.total_fare - cheapestOption.total_fare}
                  </strong>{' '}
                  in transit fare.
                </p>
              )}
          </div>
        </div>
      )}

      {/* Primary Result Cards */}
      {!loading && options.length > 0 && (
        <div className="space-y-3.5 animate-fade-in-up">
          {/* Card A: FASTEST ROUTE */}
          {fastestOption && (
            <JourneyCard
              option={fastestOption}
              selected={selected?.option_id === fastestOption.option_id}
              onSelect={() => onSelect(fastestOption)}
              onSave={() => onSave(fastestOption)}
              isSaved={savedOptionIds.has(fastestOption.option_id)}
              type="fastest"
              onOpenCashbackModal={onOpenCashbackModal}
            />
          )}

          {/* Card B: LOWEST COST ROUTE (if different from fastest) */}
          {cheapestOption && cheapestOption.option_id !== fastestOption?.option_id && (
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

          {/* Single option fallback if neither or only 1 option returned */}
          {!fastestOption && !cheapestOption && options[0] && (
            <JourneyCard
              option={options[0]}
              selected={selected?.option_id === options[0].option_id}
              onSelect={() => onSelect(options[0])}
              onSave={() => onSave(options[0])}
              isSaved={savedOptionIds.has(options[0].option_id)}
              onOpenCashbackModal={onOpenCashbackModal}
            />
          )}

          {/* Additional Options */}
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
