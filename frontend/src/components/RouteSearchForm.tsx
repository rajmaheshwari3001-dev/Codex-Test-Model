import { useState } from 'react'
import type { ServiceDay, Stop } from '../types'

const SERVICE_TIME_PATTERN = /^(?:[0-3]\d|4[0-7]):[0-5]\d$/

interface Props {
  stops: Stop[]
  serviceDay: ServiceDay
  onServiceDayChange: (day: ServiceDay) => void
  onSearch: (origin: string, destination: string, time: string, preference: string, serviceDay: ServiceDay) => void
  loading: boolean
}

export default function RouteSearchForm({ stops, serviceDay, onServiceDayChange, onSearch, loading }: Props) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [time, setTime] = useState('08:00')
  const [preference, setPreference] = useState('fastest')
  const [error, setError] = useState('')

  function handleSwap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function handlePreset(origId: string, destId: string, presetTime: string) {
    setOrigin(origId)
    setDestination(destId)
    setTime(presetTime)
    setError('')
    onSearch(origId, destId, presetTime, preference, serviceDay)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!origin) return setError('Please select an origin stop.')
    if (!destination) return setError('Please select a destination stop.')
    if (origin === destination) return setError('Origin and destination must be different.')
    if (!SERVICE_TIME_PATTERN.test(time)) {
      return setError('Enter a valid time from 00:00 to 47:59 in HH:MM format.')
    }
    onSearch(origin, destination, time, preference, serviceDay)
  }

  // Calculate if the entered departure time is outside active timetable operating hours (06:30 to 12:30)
  const [hours, minutes] = time.split(':').map(Number)
  const currentMinutesVal = (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes)
  const isOutOfServiceHours = currentMinutesVal < 6 * 60 + 30 || currentMinutesVal > 12 * 60 + 30

  // Active timetable hours in the sample dataset are between 06:30 and 12:30
  const quickTimes = [
    { label: '07:00 (Early)', value: '07:00' },
    { label: '08:00 (Peak AM)', value: '08:00' },
    { label: '09:30', value: '09:30' },
    { label: '10:30', value: '10:30' },
    { label: '11:30', value: '11:30' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Plan Transit Journey</h2>
          <p className="text-xs text-gray-500">Schedule-aware routing across Delhi network stops</p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
          {serviceDay}
        </span>
      </div>

      {/* Origin, Destination & Swap */}
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="origin-stop" className="block text-xs font-medium text-gray-700 mb-1">
            Origin Stop (From)
          </label>
          <select
            id="origin-stop"
            value={origin}
            onChange={e => {
              setOrigin(e.target.value)
              if (error) setError('')
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="">Select origin stop...</option>
            {stops.map(s => (
              <option key={s.stop_id} value={s.stop_id}>
                {s.stop_name} (Zone {s.zone_id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center -my-1">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!origin && !destination}
            aria-label="Swap origin and destination"
            title="Swap stops"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200 disabled:opacity-40 transition-colors"
          >
            <span aria-hidden="true">⇅</span> Swap Stops
          </button>
        </div>

        <div>
          <label htmlFor="dest-stop" className="block text-xs font-medium text-gray-700 mb-1">
            Destination Stop (To)
          </label>
          <select
            id="dest-stop"
            value={destination}
            onChange={e => {
              setDestination(e.target.value)
              if (error) setError('')
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="">Select destination stop...</option>
            {stops.map(s => (
              <option key={s.stop_id} value={s.stop_id}>
                {s.stop_name} (Zone {s.zone_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timetable Operating Windows Block */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-800">
          <span className="flex items-center gap-1.5">
            <span>🕒</span>
            <span>Timetable Operating Windows</span>
          </span>
          <span className="text-[10px] text-gray-500 font-normal">06:30 – 12:30 Active</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
          <button
            type="button"
            onClick={() => setTime('08:00')}
            className={`p-2 rounded-lg border text-left transition-all ${
              currentMinutesVal >= 390 && currentMinutesVal <= 570
                ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300 text-emerald-950 font-bold shadow-2xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="font-semibold text-emerald-700 text-xs">06:30 – 09:30</div>
            <div className="text-[10px] text-gray-500 leading-tight">Morning Peak (All routes)</div>
          </button>
          <button
            type="button"
            onClick={() => setTime('10:30')}
            className={`p-2 rounded-lg border text-left transition-all ${
              currentMinutesVal > 570 && currentMinutesVal <= 750
                ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300 text-blue-950 font-bold shadow-2xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="font-semibold text-blue-700 text-xs">09:30 – 12:30</div>
            <div className="text-[10px] text-gray-500 leading-tight">Midday Service</div>
          </button>
          <div className="p-2 rounded-lg border border-dashed border-gray-300 bg-gray-100/70 text-gray-400 text-left cursor-not-allowed">
            <div className="font-semibold text-gray-500 text-xs">12:31 – 23:59</div>
            <div className="text-[10px] text-gray-400 leading-tight">Off Service (No trips)</div>
          </div>
        </div>
      </div>

      {/* Out of Service Hours Warning Block (Appears when user types e.g. 17:30 or 21:00) */}
      {isOutOfServiceHours && (
        <div role="status" className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span>⚠️</span>
            <span>Selected Departure ({time}) is Outside Service Hours</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            In this sample dataset, all daily transit timetables operate between <strong>06:30 and 12:30</strong>. Searches at {time} will return zero scheduled buses.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-amber-900">Switch to active time:</span>
            <button
              type="button"
              onClick={() => setTime('08:00')}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px] transition-colors"
            >
              08:00 (Peak AM)
            </button>
            <button
              type="button"
              onClick={() => setTime('09:30')}
              className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded font-medium text-[11px] transition-colors"
            >
              09:30
            </button>
            <button
              type="button"
              onClick={() => setTime('11:00')}
              className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded font-medium text-[11px] transition-colors"
            >
              11:00
            </button>
          </div>
        </div>
      )}

      {/* Departure Time & Service Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label htmlFor="departure-time" className="block text-xs font-medium text-gray-700 mb-1">
            Departure Time (HH:MM)
          </label>
          <input
            id="departure-time"
            type="text"
            placeholder="08:00"
            maxLength={5}
            value={time}
            aria-describedby="departure-time-hint"
            aria-invalid={Boolean(error && !SERVICE_TIME_PATTERN.test(time))}
            onChange={e => {
              setTime(e.target.value)
              if (error) setError('')
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <p id="departure-time-hint" className="mt-1 text-[11px] text-gray-500">
            Enter between 06:30 and 12:30 for active trips.
          </p>
        </div>

        <div>
          <label htmlFor="service-day" className="block text-xs font-medium text-gray-700 mb-1">
            Schedule Calendar
          </label>
          <select
            id="service-day"
            value={serviceDay}
            onChange={e => onServiceDayChange(e.target.value as ServiceDay)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="weekday">Weekday Timetable</option>
            <option value="weekend">Weekend Timetable</option>
          </select>
          <p className="mt-1 text-[11px] text-gray-500">
            Filters weekday vs weekend trips.
          </p>
        </div>
      </div>

      {/* Quick Time Preset Chips (Matched to actual dataset trips) */}
      <div>
        <span className="block text-[11px] font-medium text-gray-500 mb-1.5">
          Active Timetable Departure Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickTimes.map(qt => (
            <button
              key={qt.value}
              type="button"
              onClick={() => {
                setTime(qt.value)
                if (error) setError('')
              }}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                time === qt.value
                  ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Active Routes to Try */}
      <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px]">
        <span className="font-semibold text-indigo-900 block mb-1">✨ Popular Active Routes to Try:</span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handlePreset('S02', 'S08', '08:00')}
            className="text-[11px] bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded font-medium transition-colors"
          >
            Kashmere Gate → Saket (08:00)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('S13', 'S01', '07:00')}
            className="text-[11px] bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded font-medium transition-colors"
          >
            Dwarka → Rajiv Chowk (07:00)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('S05', 'S08', '09:00')}
            className="text-[11px] bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded font-medium transition-colors"
          >
            Connaught Place → Saket (09:00)
          </button>
        </div>
      </div>

      {/* Routing Preference */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Routing Preference</label>
        <div className="grid grid-cols-2 gap-2">
          <label
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
              preference === 'fastest'
                ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 text-indigo-900'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <input
              type="radio"
              name="preference"
              value="fastest"
              checked={preference === 'fastest'}
              onChange={() => setPreference('fastest')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <div className="text-xs font-semibold">Fastest Arrival</div>
              <div className="text-[10px] text-gray-500">Minimizes transit duration</div>
            </div>
          </label>

          <label
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
              preference === 'cheapest'
                ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 text-emerald-900'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <input
              type="radio"
              name="preference"
              value="cheapest"
              checked={preference === 'cheapest'}
              onChange={() => setPreference('cheapest')}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <div className="text-xs font-semibold">Cheapest Fare</div>
              <div className="text-[10px] text-gray-500">Prioritizes lower tariffs</div>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-xs"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span>Scanning Timetable...</span>
          </>
        ) : (
          <span>Search Available Routes</span>
        )}
      </button>
    </form>
  )
}
