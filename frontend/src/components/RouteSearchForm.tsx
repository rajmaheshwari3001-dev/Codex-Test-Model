import { useState, useEffect } from 'react'
import type { Stop } from '../types'

interface Props {
  stops: Stop[]
  onSearch: (origin: string, destination: string, time: string, preference: string) => void
  loading: boolean
}

export default function RouteSearchForm({ stops, onSearch, loading }: Props) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [time, setTime] = useState('08:00')
  const [preference, setPreference] = useState('fastest')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!origin) return setError('Please select an origin stop.')
    if (!destination) return setError('Please select a destination stop.')
    if (origin === destination) return setError('Origin and destination must be different.')
    onSearch(origin, destination, time, preference)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Find Your Route</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
          <select
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="">Select origin...</option>
            {stops.map(s => (
              <option key={s.stop_id} value={s.stop_id}>{s.stop_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
          <select
            value={destination}
            onChange={e => setDestination(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="">Select destination...</option>
            {stops.map(s => (
              <option key={s.stop_id} value={s.stop_id}>{s.stop_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Departure Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Preference</label>
          <select
            value={preference}
            onChange={e => setPreference(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="fastest">Fastest</option>
            <option value="cheapest">Cheapest</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Searching...' : 'Search Routes'}
      </button>
    </form>
  )
}
