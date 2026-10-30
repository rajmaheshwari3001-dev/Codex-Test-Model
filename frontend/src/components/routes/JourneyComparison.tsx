import type { JourneyOption, PoochhOEstimate } from '../../types'
import { formatTime12 } from '../../utils/time'
import JourneyCard from './JourneyCard'
import PoochhOEstimateCard from '../PoochhOEstimateCard'
import {
  ClockIcon,
  CompassIcon,
  BarChartIcon,
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
          <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-5 animate-pulse space-y-3">
            <div className="h-4 bg-[#EEE5D6] rounded w-1/3" />
            <div className="h-8 bg-[#EEE5D6] rounded w-full" />
            <div className="h-16 bg-[#EEE5D6] rounded w-full" />
          </div>
          <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-5 animate-pulse space-y-3">
            <div className="h-4 bg-[#EEE5D6] rounded w-1/3" />
            <div className="h-8 bg-[#EEE5D6] rounded w-full" />
            <div className="h-16 bg-[#EEE5D6] rounded w-full" />
          </div>
          <span className="sr-only">Searching available transit connections...</span>
        </div>
      )}

      {/* Default State */}
      {!loading && options.length === 0 && !noResultContext && (
        <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-6 text-center space-y-3 shadow-xs animate-fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEE5D6] text-[#C49A43]">
            <CompassIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#243B4A]">
              Ready for Your Delhi Journey
            </h3>
            <p className="mt-1 text-xs text-[#77766D] max-w-sm mx-auto leading-relaxed">
              Select origin and destination stations above, set your departure time, and click Find Best Routes to compare heritage rail and bus options.
            </p>
          </div>
        </div>
      )}

      {/* Timetable Schedule Notice (Out of hours or no connection) */}
      {!loading && noResultContext && (
        <div className="space-y-3 animate-fade-in">
          <section
            role="status"
            className="rounded-2xl border border-[#D8C8AA] bg-[#EEE5D6]/80 p-4 text-xs text-[#29343A] space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-[#D8C8AA] pb-2">
              <span className="font-bold text-[#243B4A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                <span>Timetable Advisory</span>
              </span>
              <span className="font-mono font-bold text-[#243B4A]">
                {formatTime12(noResultContext.time)}
              </span>
            </div>
            <p className="leading-relaxed text-[#77766D]">
              {noResultContext.isOutOfHours ? (
                <>
                  Scheduled Delhi Metro and DTC networks operate daily from <strong>06:00 AM to 11:35 PM</strong>. No fixed transit operates at{' '}
                  <strong>{formatTime12(noResultContext.time)}</strong> for <strong>{originName}</strong> to <strong>{destinationName}</strong>.
                </>
              ) : (
                <>
                  No scheduled connections found between <strong>{originName}</strong> and <strong>{destinationName}</strong> at{' '}
                  <strong>{formatTime12(noResultContext.time)}</strong> on the {serviceDay} schedule.
                </>
              )}
            </p>

            {onRetryTime && (
              <div className="pt-2 border-t border-[#D8C8AA] space-y-1.5">
                <div className="text-[11px] font-bold text-[#243B4A]">
                  Try active schedule hours:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVE_SERVICE_HOURS.filter(t => t !== noResultContext.time).map(retryTime => (
                    <button
                      key={retryTime}
                      type="button"
                      onClick={() => onRetryTime(retryTime)}
                      className="rounded-lg border border-[#D8C8AA] bg-[#FFFCF5] px-2.5 py-1 text-[11px] font-bold text-[#243B4A] hover:border-[#C49A43] hover:bg-[#EEE5D6] transition-colors cursor-pointer"
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
        <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-3.5 text-xs text-[#29343A] space-y-1.5 shadow-xs animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-[#243B4A]">
            <BarChartIcon className="w-4 h-4 text-[#C49A43]" />
            <span>Route Comparison Insight</span>
          </div>
          <div className="space-y-1 text-xs text-[#77766D]">
            {fastestOption.total_duration_minutes < cheapestOption.total_duration_minutes && (
              <p className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C49A43]" />
                <span>
                  <strong>Fastest Route</strong> saves{' '}
                  <strong className="text-[#C49A43] font-bold">
                    {cheapestOption.total_duration_minutes - fastestOption.total_duration_minutes} min
                  </strong>{' '}
                  of travel time.
                </span>
              </p>
            )}
            {cheapestOption.total_fare !== null &&
              fastestOption.total_fare !== null &&
              cheapestOption.total_fare < fastestOption.total_fare && (
                <p className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#547A60]" />
                  <span>
                    <strong>Lowest Fare</strong> saves{' '}
                    <strong className="text-[#547A60] font-bold">
                      ₹{fastestOption.total_fare - cheapestOption.total_fare}
                    </strong>{' '}
                    in transit expenses.
                  </span>
                </p>
              )}
          </div>
        </div>
      )}

      {/* Primary Result Cards */}
      {!loading && options.length > 0 && (
        <div className="space-y-4 animate-fade-in">
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
