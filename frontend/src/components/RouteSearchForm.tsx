import { useState } from 'react'
import type { ServiceDay, Stop } from '../types'

const SERVICE_TIME_PATTERN = /^(?:[0-3]\d|4[0-7]):[0-5]\d$/

interface Props {
  stops: Stop[]
  origin: string
  setOrigin: (origin: string) => void
  destination: string
  setDestination: (destination: string) => void
  time: string
  setTime: (time: string) => void
  preference: string
  setPreference: (preference: string) => void
  serviceDay: ServiceDay
  onServiceDayChange: (day: ServiceDay) => void
  onSearch: (origin?: string, destination?: string, time?: string, preference?: string, serviceDay?: ServiceDay) => void
  loading: boolean
}

const QUICK_TIMES = [
  { label: '07:00', note: 'Early', value: '07:00' },
  { label: '08:00', note: 'Peak', value: '08:00' },
  { label: '09:30', note: 'Midday', value: '09:30' },
  { label: '11:30', note: 'Late AM', value: '11:30' },
]

const SAMPLE_CORRIDORS = [
  { label: 'Kashmere Gate → Saket', origin: 'S02', destination: 'S08', time: '08:00' },
  { label: 'Dwarka → Rajiv Chowk', origin: 'S13', destination: 'S01', time: '07:00' },
  { label: 'Connaught Place → Saket', origin: 'S05', destination: 'S08', time: '09:00' },
  { label: 'Rohini West → Kashmere Gate', origin: 'S10', destination: 'S02', time: '07:00' },
]

export default function RouteSearchForm({
  stops,
  origin,
  setOrigin,
  destination,
  setDestination,
  time,
  setTime,
  preference,
  setPreference,
  serviceDay,
  onServiceDayChange,
  onSearch,
  loading,
}: Props) {
  const [error, setError] = useState('')
  const [hours, minutes] = time.split(':').map(Number)
  const departureMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
  const outsideServiceWindow = departureMinutes < 390 || departureMinutes > 750

  function handleSwap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!origin) return setError('Choose an origin stop to continue.')
    if (!destination) return setError('Choose a destination stop to continue.')
    if (origin === destination) return setError('Choose two different stops.')
    if (!SERVICE_TIME_PATTERN.test(time)) {
      return setError('Enter a valid time from 00:00 to 47:59 in HH:MM format.')
    }

    onSearch(origin, destination, time, preference, serviceDay)
  }

  function chooseSampleRoute(sample: (typeof SAMPLE_CORRIDORS)[number]) {
    setOrigin(sample.origin)
    setDestination(sample.destination)
    setTime(sample.time)
    setError('')
    onSearch(sample.origin, sample.destination, sample.time, preference, serviceDay)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[1.75rem] border border-[#d8d3c7] bg-[#fffdf7] shadow-[0_18px_50px_-36px_rgba(27,39,35,0.5)]"
    >
      <header className="flex items-start justify-between gap-3 bg-[#d9ed55] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#172421] font-mono text-xs font-bold text-[#e2f57b]">
            01
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4c5a35]">Journey builder</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#172421] sm:text-2xl">Where to next?</h2>
          </div>
        </div>
        <span className="rounded-full border border-[#7f8e3b]/30 bg-white/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#303c29]">
          {serviceDay}
        </span>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2.5">
          <div>
            <label htmlFor="origin-stop" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#68736a]">
              From
            </label>
            <select
              id="origin-stop"
              value={origin}
              onChange={event => {
                setOrigin(event.target.value)
                setError('')
              }}
              className="min-h-12 w-full rounded-xl border border-[#d8d5ca] bg-[#f6f4ed] px-3.5 py-2.5 text-sm font-semibold text-[#1d2b27] outline-none transition focus:border-[#53652f] focus:ring-4 focus:ring-[#d9ed55]/35"
            >
              <option value="">Select a starting stop…</option>
              {stops.map(stop => (
                <option key={stop.stop_id} value={stop.stop_id}>
                  {stop.stop_name} (Zone {stop.zone_id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pl-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9a9e91]">Your direction of travel</span>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!origin && !destination}
              aria-label="Swap origin and destination"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#47572d] transition hover:bg-[#eff3d8] disabled:opacity-40"
            >
              <span aria-hidden="true" className="text-base leading-none">↕</span>
              Swap
            </button>
          </div>

          <div>
            <label htmlFor="dest-stop" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#68736a]">
              To
            </label>
            <select
              id="dest-stop"
              value={destination}
              onChange={event => {
                setDestination(event.target.value)
                setError('')
              }}
              className="min-h-12 w-full rounded-xl border border-[#d8d5ca] bg-[#f6f4ed] px-3.5 py-2.5 text-sm font-semibold text-[#1d2b27] outline-none transition focus:border-[#53652f] focus:ring-4 focus:ring-[#d9ed55]/35"
            >
              <option value="">Select a destination…</option>
              {stops.map(stop => (
                <option key={stop.stop_id} value={stop.stop_id}>
                  {stop.stop_name} (Zone {stop.zone_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1.2fr] gap-3">
          <div>
            <label htmlFor="departure-time" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#68736a]">
              Depart at
            </label>
            <input
              id="departure-time"
              type="text"
              inputMode="numeric"
              placeholder="08:00"
              maxLength={5}
              value={time}
              onChange={event => {
                setTime(event.target.value)
                setError('')
              }}
              aria-describedby="service-window-note"
              aria-invalid={Boolean(error && !SERVICE_TIME_PATTERN.test(time))}
              className={`min-h-12 w-full rounded-xl border bg-[#f6f4ed] px-3.5 py-2.5 font-mono text-sm font-bold text-[#1d2b27] outline-none transition focus:ring-4 focus:ring-[#d9ed55]/35 ${
                outsideServiceWindow ? 'border-[#d9a25c] focus:border-[#bd7b32]' : 'border-[#d8d5ca] focus:border-[#53652f]'
              }`}
            />
          </div>
          <div>
            <label htmlFor="service-day" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#68736a]">
              Timetable
            </label>
            <select
              id="service-day"
              value={serviceDay}
              onChange={event => onServiceDayChange(event.target.value as ServiceDay)}
              className="min-h-12 w-full rounded-xl border border-[#d8d5ca] bg-[#f6f4ed] px-3 py-2.5 text-sm font-semibold text-[#1d2b27] outline-none transition focus:border-[#53652f] focus:ring-4 focus:ring-[#d9ed55]/35"
            >
              <option value="weekday">Weekday</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>
        </div>

        <div id="service-window-note" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e5e1d6] bg-[#f7f5ee] px-3.5 py-2.5 text-xs">
          <span className="font-semibold text-[#68736a]">Sample service window</span>
          <span className="font-mono font-extrabold text-[#263b31]">06:30 — 12:30</span>
        </div>

        {outsideServiceWindow && (
          <div role="status" className="rounded-xl border border-[#e4c291] bg-[#fff5e3] px-3.5 py-3 text-xs leading-relaxed text-[#6e4b21]">
            <strong className="block text-[#624016]">No sample trips are scheduled at {time}.</strong>
            This demo timetable only includes service from 06:30 to 12:30.
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#68736a]">Quick departure</span>
            <span className="text-[10px] text-[#9a9e91]">Choose a time</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_TIMES.map(quickTime => (
              <button
                key={quickTime.value}
                type="button"
                onClick={() => {
                  setTime(quickTime.value)
                  setError('')
                }}
                aria-pressed={time === quickTime.value}
                className={`rounded-xl border px-1.5 py-2 text-center transition ${
                  time === quickTime.value
                    ? 'border-[#263b31] bg-[#263b31] text-[#f2f3dd]'
                    : 'border-[#e2ded3] bg-white text-[#33423b] hover:border-[#9aab59]'
                }`}
              >
                <span className="block font-mono text-xs font-extrabold">{quickTime.label}</span>
                <span className={`mt-0.5 block text-[9px] ${time === quickTime.value ? 'text-[#d9ed55]' : 'text-[#879086]'}`}>
                  {quickTime.note}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#68736a]">Plan for</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'fastest', title: 'Fastest arrival', note: 'Less time travelling' },
              { value: 'cheapest', title: 'Lowest fare', note: 'Spend less on the trip' },
            ].map(option => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                  preference === option.value
                    ? 'border-[#6c7d36] bg-[#f2f5df] ring-2 ring-[#d9ed55]/55'
                    : 'border-[#e2ded3] bg-white hover:border-[#b8c0a0]'
                }`}
              >
                <input
                  type="radio"
                  name="preference"
                  value={option.value}
                  checked={preference === option.value}
                  onChange={() => setPreference(option.value)}
                  className="mt-0.5 accent-[#53652f]"
                />
                <span>
                  <span className="block text-xs font-extrabold text-[#25342d]">{option.title}</span>
                  <span className="mt-0.5 block text-[10px] text-[#7b837a]">{option.note}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <details className="group rounded-xl border border-dashed border-[#d6d2c6] bg-[#faf8f2]">
          <summary className="cursor-pointer list-none px-3.5 py-3 text-xs font-bold text-[#455345] marker:hidden">
            <span className="flex items-center justify-between">
              Try a sample corridor
              <span className="font-mono text-[#78816d] transition group-open:rotate-45">＋</span>
            </span>
          </summary>
          <div className="flex flex-wrap gap-2 border-t border-[#e9e5db] px-3.5 py-3">
            {SAMPLE_CORRIDORS.map(sample => (
              <button
                key={sample.label}
                type="button"
                onClick={() => chooseSampleRoute(sample)}
                className="rounded-lg border border-[#ddd9cc] bg-white px-2.5 py-1.5 text-left text-[10px] font-semibold text-[#44534b] transition hover:border-[#9aab59] hover:bg-[#f4f6e8]"
              >
                {sample.label} <span className="font-mono text-[#8b9284]">@ {sample.time}</span>
              </button>
            ))}
          </div>
        </details>

        {error && (
          <div role="alert" className="rounded-xl border border-[#e3b8b2] bg-[#fff1ee] px-3.5 py-3 text-xs font-semibold text-[#853c35]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group flex min-h-12 w-full items-center justify-between rounded-xl bg-[#172421] px-4 text-sm font-extrabold text-[#f7f4e9] transition hover:bg-[#263b31] focus:outline-none focus:ring-4 focus:ring-[#d9ed55]/50 disabled:cursor-wait disabled:opacity-60"
        >
          <span>{loading ? 'Checking the timetable…' : 'Find scheduled journeys'}</span>
          <span className="text-lg text-[#d9ed55] transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  )
}
