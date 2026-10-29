import type { JourneyOption } from '../types'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave: () => void
}

export default function RouteResultCard({ option, selected, onSelect, onSave }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all border-2 ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
          option.label === 'Fastest' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {option.label}
        </span>
        <span className="text-xs text-gray-400">{option.data_status}</span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-gray-900">{option.total_duration_minutes}</span>
        <span className="text-sm text-gray-500">min</span>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {option.departure_time} → {option.arrival_time}
      </div>

      {/* Legs */}
      <div className="space-y-1 mb-2">
        {option.legs.map(leg => (
          <div key={leg.leg_index} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: leg.route_color }}
            />
            <span className="font-medium">{leg.route_name}</span>
            <span className="text-gray-400">
              {leg.board_stop_name} → {leg.alight_stop_name}
            </span>
          </div>
        ))}
      </div>

      {/* Transfers */}
      {option.transfers.length > 0 && (
        <div className="text-xs text-amber-600 mb-1">
          {option.transfers.length} transfer{option.transfers.length > 1 ? 's' : ''}
          {option.transfers.map(t => (
            <span key={t.at_stop_id}> • {t.at_stop_name} ({t.wait_minutes} min wait)</span>
          ))}
        </div>
      )}

      {/* Fare */}
      {option.fare_available && option.total_fare !== null && (
        <div className="text-sm font-semibold text-green-700 mb-1">
          Fare: ₹{option.total_fare}
        </div>
      )}

      {/* Warnings */}
      {option.delay_warnings.length > 0 && (
        <div className="text-xs text-red-600 mt-1">
          {option.delay_warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}
      {option.crowding_warnings.length > 0 && (
        <div className="text-xs text-orange-600 mt-1">
          {option.crowding_warnings.map((w, i) => <div key={i}>👥 {w}</div>)}
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); onSave() }}
        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        Save Route
      </button>
    </div>
  )
}
