import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Stop, Route, JourneyOption, SavedRoute, ServiceDay, ModePreference, PoochhOEstimate } from '../types'
import { getStops, getRoutes, searchJourneys, createSavedRoute } from '../services/api'
import { parseToTime24 } from '../utils/time'

import AppShell from '../components/layout/AppShell'
import JourneyPlanner from '../components/journey/JourneyPlanner'
import AssistantPanel from '../components/assistant/AssistantPanel'
import DelhiMap from '../components/map/DelhiMap'
import JourneyComparison from '../components/routes/JourneyComparison'
import SavedJourneysBar from '../components/saved/SavedJourneysBar'
import DataProvenanceModal from '../components/DataProvenanceModal'

interface NoResultContext {
  origin: string
  destination: string
  time: string
  isOutOfHours: boolean
}

// 4 Primary Delhi Bus & Metro Corridors for 1-Tap Search
const FEATURED_CORRIDORS = [
  {
    routeId: 'R01',
    lineName: 'Blue Line',
    color: '#2196F3',
    originId: 'S13',
    originName: 'Dwarka Sec-21',
    destId: 'S18',
    destName: 'Anand Vihar ISBT',
    departure: '08:00',
    type: 'Bus Line • East-West Link',
  },
  {
    routeId: 'R02',
    lineName: 'Green Line',
    color: '#16A34A',
    originId: 'S02',
    originName: 'Kashmere Gate',
    destId: 'S16',
    destName: 'Dilli Haat - INA',
    departure: '13:30',
    type: 'Bus Line • North-South Link',
  },
  {
    routeId: 'R03',
    lineName: 'Red Ring',
    color: '#DC2626',
    originId: 'S05',
    originName: 'Connaught Place',
    destId: 'S20',
    destName: 'Sarai Kale Khan ISBT',
    departure: '17:30',
    type: 'Ring Bus • Evening Hub Link',
  },
  {
    routeId: 'R04',
    lineName: 'Yellow Express',
    color: '#D97706',
    originId: 'S04',
    originName: 'New Delhi Stn',
    destId: 'S17',
    destName: 'Mandi House',
    departure: '20:30',
    type: 'Express Bus • Cultural Link',
  },
]

interface PassengerPageProps {
  defaultTab?: 'planner' | 'map' | 'saved' | 'chat'
}

export default function PassengerPage({ defaultTab }: PassengerPageProps) {
  const [searchParams] = useSearchParams()
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [options, setOptions] = useState<JourneyOption[]>([])
  const [selected, setSelected] = useState<JourneyOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [noResultContext, setNoResultContext] = useState<NoResultContext | null>(null)
  const [saveToast, setSaveToast] = useState('')
  const [savedRefresh, setSavedRefresh] = useState(0)
  const [savedOptionIds, setSavedOptionIds] = useState<Set<string>>(new Set())
  const [serviceDay, setServiceDay] = useState<ServiceDay>('weekday')
  const [origin, setOrigin] = useState('S13') // Default Dwarka Sec-21
  const [destination, setDestination] = useState('S01') // Default Rajiv Chowk
  const [time, setTime] = useState('08:00')
  const [preference, setPreference] = useState('fastest')
  const [modePreference, setModePreference] = useState<ModePreference>('all')
  const [maxBudget, setMaxBudget] = useState<string>('')
  const [showProvenanceModal, setShowProvenanceModal] = useState(false)
  const [poochhoEstimate, setPoochhOEstimate] = useState<PoochhOEstimate | null>(null)

  function loadInitialData() {
    setMessage('')
    Promise.all([getStops(), getRoutes()])
      .then(([nextStops, nextRoutes]) => {
        setStops(nextStops)
        setRoutes(nextRoutes)
      })
      .catch(error => {
        setMessage(
          error instanceof Error
            ? `Unable to load transit data: ${error.message}`
            : 'Unable to load transit data.'
        )
      })
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Hook query parameter into origin selection
  useEffect(() => {
    const originParam = searchParams.get('origin')
    if (originParam && stops.some(s => s.stop_id === originParam)) {
      setOrigin(originParam)
    }
  }, [searchParams, stops])

  async function handleSearch(
    originId: string = origin,
    destinationId: string = destination,
    departureTime: string = time,
    selectedPreference: string = preference,
    selectedServiceDay: ServiceDay = serviceDay,
    selectedModePreference: ModePreference = modePreference,
    selectedMaxBudget: string = maxBudget
  ) {
    if (!originId || !destinationId) return

    setOrigin(originId)
    setDestination(destinationId)
    setTime(departureTime)
    setPreference(selectedPreference)
    setServiceDay(selectedServiceDay)
    setModePreference(selectedModePreference)
    setMaxBudget(selectedMaxBudget)
    setLoading(true)
    setMessage('')
    setNoResultContext(null)
    setSaveToast('')
    setOptions([])
    setSelected(null)
    setPoochhOEstimate(null)

    const parsedBudget = selectedMaxBudget.trim() ? parseFloat(selectedMaxBudget.trim()) : null

    try {
      const response = await searchJourneys({
        origin_stop_id: originId,
        destination_stop_id: destinationId,
        departure_time: departureTime,
        preference: selectedPreference,
        service_day: selectedServiceDay,
        mode_preference: selectedModePreference,
        max_budget: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : undefined,
      })
      setOptions(response.options)
      if (response.poochho_estimate) {
        setPoochhOEstimate(response.poochho_estimate)
      }
      if (response.options.length > 0) {
        setSelected(response.options[0])
      } else {
        const canonical24 = parseToTime24(departureTime) || departureTime
        const [hours, minutes] = canonical24.split(':').map(Number)
        const totalMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
        setNoResultContext({
          origin: originId,
          destination: destinationId,
          time: departureTime,
          isOutOfHours: totalMinutes < 360 || totalMinutes > 1415,
        })
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Journey search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(option: JourneyOption) {
    const firstLeg = option.legs[0]
    const finalLeg = option.legs[option.legs.length - 1]
    const originStop = stops.find(stop => stop.stop_id === firstLeg?.board_stop_id)
    const destinationStop = stops.find(stop => stop.stop_id === finalLeg?.alight_stop_id)

    try {
      await createSavedRoute({
        label: `${originStop?.stop_name || 'Origin'} → ${destinationStop?.stop_name || 'Destination'}`,
        origin_stop_id: firstLeg?.board_stop_id || '',
        origin_stop_name: originStop?.stop_name || '',
        destination_stop_id: finalLeg?.alight_stop_id || '',
        destination_stop_name: destinationStop?.stop_name || '',
        preferred_departure_time: option.departure_time,
        preference: option.label.toLowerCase(),
        service_day: serviceDay,
      })
      setSavedOptionIds(previous => new Set(previous).add(option.option_id))
      setSaveToast(`Journey saved • ${option.label} • ₹${option.total_fare ?? 'N/A'}`)
      setSavedRefresh(previous => previous + 1)
      window.setTimeout(() => setSaveToast(''), 4000)
    } catch {
      setSaveToast('Could not save this journey. Please try again.')
      window.setTimeout(() => setSaveToast(''), 4000)
    }
  }

  function handleReuse(route: SavedRoute) {
    handleSearch(
      route.origin_stop_id,
      route.destination_stop_id,
      route.preferred_departure_time || '08:00',
      route.preference,
      route.service_day
    )
  }

  function handleSelectOriginFromMap(stopId: string) {
    setOrigin(stopId)
    const stopName = stops.find(s => s.stop_id === stopId)?.stop_name || stopId
    setSaveToast(`Origin set to ${stopName}`)
    window.setTimeout(() => setSaveToast(''), 3000)
  }

  function handleSelectDestinationFromMap(stopId: string) {
    setDestination(stopId)
    const stopName = stops.find(s => s.stop_id === stopId)?.stop_name || stopId
    setSaveToast(`Destination set to ${stopName}`)
    window.setTimeout(() => setSaveToast(''), 3000)
  }

  function handleCorridorClick(corridor: (typeof FEATURED_CORRIDORS)[number]) {
    setOrigin(corridor.originId)
    setDestination(corridor.destId)
    setTime(corridor.departure)
    handleSearch(corridor.originId, corridor.destId, corridor.departure, preference, serviceDay)
  }

  const originName = stops.find(stop => stop.stop_id === origin)?.stop_name || origin || 'Origin'
  const destinationName = stops.find(stop => stop.stop_id === destination)?.stop_name || destination || 'Destination'

  return (
    <div className="space-y-4">
      {/* Toast Alert / Status Feedback */}
      {saveToast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-[#547A60]/40 bg-[#EBF4F0] px-4 py-2.5 text-xs font-bold text-[#547A60] shadow-xs"
        >
          <span>✓</span>
          <span>{saveToast}</span>
        </div>
      )}

      {message && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[#A64C42]/30 bg-[#F9EBEA] p-3 text-xs font-semibold text-[#A64C42]"
        >
          <span>⚠️</span>
          <span>{message}</span>
        </div>
      )}

      {/* 3-Column Orchestration Shell */}
      <AppShell
        leftColumn={
          <div className="space-y-4">
            <JourneyPlanner
              stops={stops}
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              time={time}
              setTime={setTime}
              preference={preference}
              setPreference={setPreference}
              serviceDay={serviceDay}
              onServiceDayChange={setServiceDay}
              modePreference={modePreference}
              setModePreference={setModePreference}
              maxBudget={maxBudget}
              setMaxBudget={setMaxBudget}
              onSearch={handleSearch}
              loading={loading}
            />

            <AssistantPanel serviceDay={serviceDay} />
          </div>
        }
        centerColumn={
          <div className="space-y-3">
            {/* Quick Corridor Selection Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#73766F] shrink-0">
                Key Links:
              </span>
              {FEATURED_CORRIDORS.map(corridor => {
                const isMatch = origin === corridor.originId && destination === corridor.destId
                return (
                  <button
                    key={corridor.routeId}
                    type="button"
                    onClick={() => handleCorridorClick(corridor)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold border transition-all shrink-0 ${
                      isMatch
                        ? 'border-[#C49A43] bg-[#FBF8F1] text-[#172D3B] ring-1 ring-[#C49A43]'
                        : 'border-[#DAD3C6] bg-[#FFFFFF] text-[#73766F] hover:bg-[#EDE7DB] hover:text-[#29343A]'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: corridor.color }}
                    />
                    <span>{corridor.originName.split(' ')[0]} ➔ {corridor.destName.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Centerpiece Delhi Map */}
            <DelhiMap
              stops={stops}
              routes={routes}
              selectedJourney={selected}
              originStopId={origin}
              destinationStopId={destination}
              onSelectOrigin={handleSelectOriginFromMap}
              onSelectDestination={handleSelectDestinationFromMap}
            />
          </div>
        }
        rightColumn={
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#DAD3C6] pb-2 text-xs">
              <span className="font-serif font-bold text-sm text-[#172D3B]">
                Route Comparison
              </span>
              {options.length > 0 && (
                <span className="font-mono text-[11px] text-[#73766F]">
                  {options.length} {options.length === 1 ? 'Option' : 'Options'} Ranked
                </span>
              )}
            </div>

            <JourneyComparison
              options={options}
              selected={selected}
              onSelect={setSelected}
              onSave={handleSave}
              savedOptionIds={savedOptionIds}
              poochhoEstimate={poochhoEstimate}
              noResultContext={noResultContext}
              loading={loading}
              onRetryTime={retryTime => handleSearch(origin, destination, retryTime, preference, serviceDay, modePreference, maxBudget)}
              onSelectAutoMode={() => handleSearch(origin, destination, time, preference, serviceDay, 'auto', maxBudget)}
              originName={originName}
              destinationName={destinationName}
              serviceDay={serviceDay}
            />
          </div>
        }
        bottomSection={
          <SavedJourneysBar
            onReuse={handleReuse}
            refreshTrigger={savedRefresh}
          />
        }
      />

      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />
    </div>
  )
}
