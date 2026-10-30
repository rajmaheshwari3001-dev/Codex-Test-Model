import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Stop, Route, JourneyOption, SavedRoute, ServiceDay, ModePreference, PoochhOEstimate } from '../types'
import { getStops, getRoutes, searchJourneys, createSavedRoute } from '../services/api'
import { parseToTime24 } from '../utils/time'

import JourneyPlanner from '../components/journey/JourneyPlanner'
import AssistantPanel from '../components/assistant/AssistantPanel'
import DelhiMap from '../components/map/DelhiMap'
import JourneyComparison from '../components/routes/JourneyComparison'
import SavedJourneysBar from '../components/saved/SavedJourneysBar'
import DataProvenanceModal from '../components/DataProvenanceModal'
import CashbackPerksModal from '../components/journey/CashbackPerksModal'
import {
  CompassIcon,
  SparklesIcon,
  BookmarkIcon,
  CheckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  DatabaseIcon,
  TrainIcon,
  BusIcon,
} from '../components/common/Icons'

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
    color: '#2563EB',
    originId: 'S13',
    originName: 'Dwarka Sec-21',
    destId: 'S18',
    destName: 'Anand Vihar ISBT',
    departure: '08:00',
    type: 'Metro • East-West Link',
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
    type: 'Metro • North-South Link',
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
    type: 'Ring Bus • Evening Feeder',
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

export default function PassengerPage({ defaultTab: _defaultTab }: PassengerPageProps) {
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
  const [showCashbackModal, setShowCashbackModal] = useState(false)
  const [poochhoEstimate, setPoochhOEstimate] = useState<PoochhOEstimate | null>(null)

  // Console active tab: 'plan' | 'assistant' | 'saved'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'plan' | 'assistant' | 'saved'>('plan')

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
    setActiveConsoleTab('plan')

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
        label: `${originStop?.stop_name || 'Origin'} to ${destinationStop?.stop_name || 'Destination'}`,
        origin_stop_id: firstLeg?.board_stop_id || '',
        origin_stop_name: originStop?.stop_name || '',
        destination_stop_id: finalLeg?.alight_stop_id || '',
        destination_stop_name: destinationStop?.stop_name || '',
        preferred_departure_time: option.departure_time,
        preference: option.label.toLowerCase(),
        service_day: serviceDay,
      })
      setSavedOptionIds(previous => new Set(previous).add(option.option_id))
      setSaveToast(`Route saved: ${option.label} • ₹${option.total_fare ?? 'N/A'}`)
      setSavedRefresh(previous => previous + 1)
      window.setTimeout(() => setSaveToast(''), 4000)
    } catch {
      setSaveToast('Could not save this route. Please try again.')
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
    <main
      id="main-content"
      role="main"
      aria-label="AAROH-SAARTHI Delhi Transit Assistant"
      className="space-y-6 animate-fade-in"
    >
      {/* Toast Alert / Status Feedback */}
      {saveToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-xs font-bold text-emerald-800 shadow-xl animate-fade-in"
        >
          <CheckIcon className="w-4 h-4 text-emerald-600" />
          <span>{saveToast}</span>
        </aside>
      )}

      {message && (
        <aside
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 animate-fade-in"
        >
          <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{message}</span>
        </aside>
      )}

      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-lg">
        {/* Background artwork with responsive PC vs Mobile switching */}
        <picture className="absolute inset-0 z-0 opacity-35">
          <source media="(min-width: 768px)" srcSet="/images/delhi_transit_pc.jpg" />
          <img
            src="/images/delhi_transit_mobile.jpg"
            alt="Delhi Transit Infrastructure Network"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-900/50" />

        <div className="relative z-10 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-0.5 text-xs font-semibold text-blue-300">
                  <TrainIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Delhi Multimodal Transit Network</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live GTFS</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Plan Seamless Journeys Across Delhi
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unified route optimization linking DMRC Metro lines, DTC bus networks, and DIMTS Poochh-O feeder tariffs with zero fabricated data.
              </p>
            </div>

            {/* Quick Metrics Badge Group */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-black text-white">20</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NCR Hubs</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-black text-blue-400">120</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Trips</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GTFS Verified</div>
              </div>
            </div>
          </div>

          {/* 1-Tap Corridor Quick Links Strip */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Popular Corridors:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {FEATURED_CORRIDORS.map(corridor => {
                const isMatch = origin === corridor.originId && destination === corridor.destId
                return (
                  <button
                    key={corridor.routeId}
                    type="button"
                    onClick={() => handleCorridorClick(corridor)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isMatch
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block shrink-0 shadow-xs"
                      style={{ backgroundColor: corridor.color }}
                    />
                    <span>{corridor.originName.split(' ')[0]}</span>
                    <ArrowRightIcon className="w-3 h-3 text-slate-400" />
                    <span>{corridor.destName.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2-COLUMN UNIFIED SPLIT LAYOUT (No Empty 3rd Column!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Console (Tabs for Plan Route, Copilot, Saved) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* Console Mode Switcher */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeConsoleTab === 'plan'}
              onClick={() => setActiveConsoleTab('plan')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'plan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CompassIcon className="w-4 h-4" />
              <span>Plan Journey</span>
              {options.length > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">
                  {options.length}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeConsoleTab === 'assistant'}
              onClick={() => setActiveConsoleTab('assistant')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'assistant'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Transit Copilot</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeConsoleTab === 'saved'}
              onClick={() => setActiveConsoleTab('saved')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'saved'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookmarkIcon className="w-4 h-4" />
              <span>Saved Routes</span>
            </button>
          </div>

          {/* TAB 1: JOURNEY PLANNER & RANKED RESULTS */}
          {activeConsoleTab === 'plan' && (
            <div className="space-y-4 animate-fade-in">
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
                onOpenCashbackModal={() => setShowCashbackModal(true)}
              />

              {/* ROUTE COMPARISON & RANKED RESULTS */}
              <div className="space-y-3">
                <header className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-slate-900">
                    Route Recommendations
                  </h2>
                  {options.length > 0 && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {options.length} {options.length === 1 ? 'Option' : 'Options'} Ranked
                    </span>
                  )}
                </header>

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
                  onOpenCashbackModal={() => setShowCashbackModal(true)}
                  originName={originName}
                  destinationName={destinationName}
                  serviceDay={serviceDay}
                />
              </div>
            </div>
          )}

          {/* TAB 2: TRANSIT COPILOT ASSISTANT */}
          {activeConsoleTab === 'assistant' && (
            <div className="animate-fade-in">
              <AssistantPanel />
            </div>
          )}

          {/* TAB 3: SAVED JOURNEYS */}
          {activeConsoleTab === 'saved' && (
            <div className="animate-fade-in">
              <SavedJourneysBar
                onReuse={handleReuse}
                refreshTrigger={savedRefresh}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Full-Height Interactive Map Canvas */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col min-h-[580px] lg:min-h-[720px] sticky top-20">
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
      </div>

      {/* Bottom Horizontal Saved Journeys Bar */}
      <div className="pt-2">
        <SavedJourneysBar
          onReuse={handleReuse}
          refreshTrigger={savedRefresh}
        />
      </div>

      {/* Modals */}
      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />

      <CashbackPerksModal
        isOpen={showCashbackModal}
        onClose={() => setShowCashbackModal(false)}
      />
    </main>
  )
}
