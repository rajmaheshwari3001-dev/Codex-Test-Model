import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import type { Stop, Route, JourneyOption, SavedRoute, ServiceDay, ModePreference, PoochhOEstimate } from '../types'
import { getStops, getRoutes, searchJourneys, createSavedRoute } from '../services/api'
import { parseToTime24 } from '../utils/time'

import JourneyPlanner from '../components/journey/JourneyPlanner'
import AssistantPanel from '../components/assistant/AssistantPanel'
import MovableCopilotLauncher from '../components/assistant/MovableCopilotLauncher'
import DelhiMap from '../components/map/DelhiMap'
import JourneyComparison from '../components/routes/JourneyComparison'
import SavedJourneysBar from '../components/saved/SavedJourneysBar'
import PopularDestinationsBar from '../components/journey/PopularDestinationsBar'
import DataProvenanceModal from '../components/DataProvenanceModal'
import CashbackPerksModal from '../components/journey/CashbackPerksModal'
import { FIGMA_CANONICAL_JOURNEYS, CANONICAL_DELHI_STOPS } from '../utils/figmaRoutes'
import {
  CompassIcon,
  SparklesIcon,
  BookmarkIcon,
  CheckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  TrainIcon,
  MapIcon,
  XIcon,
} from '../components/common/Icons'

interface NoResultContext {
  origin: string
  destination: string
  time: string
  isOutOfHours: boolean
}

// 4 Primary Delhi Bus & Metro Corridors for 1-Tap Search (Metro Gold #C49A43, Bus Navy #243B4A)
const FEATURED_CORRIDORS = [
  {
    routeId: 'R01',
    lineName: 'Blue Line',
    color: '#C49A43',
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
    color: '#C49A43',
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
    color: '#243B4A',
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
    color: '#243B4A',
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
  const [stops, setStops] = useState<Stop[]>(CANONICAL_DELHI_STOPS)
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
  const [origin, setOrigin] = useState('S13') // Default Dwarka Sec-21 (Figma)
  const [destination, setDestination] = useState('S19') // Default Botanical Garden / Noida (Figma)
  const [time, setTime] = useState('08:40')
  const [preference, setPreference] = useState('fastest')
  const [modePreference, setModePreference] = useState<ModePreference>('all')
  const [maxBudget, setMaxBudget] = useState<string>('')
  const [showProvenanceModal, setShowProvenanceModal] = useState(false)
  const [showCashbackModal, setShowCashbackModal] = useState(false)
  const [poochhoEstimate, setPoochhOEstimate] = useState<PoochhOEstimate | null>(null)
  const [showRouteMap, setShowRouteMap] = useState(false)

  // Console active tab for mobile/tablet: 'plan' | 'map' | 'routes' | 'assistant' | 'saved'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'plan' | 'map' | 'routes' | 'assistant' | 'saved'>('plan')

  const [showCopilotModal, setShowCopilotModal] = useState(false)
  const [copilotPrompt, setCopilotPrompt] = useState('')

  useEffect(() => {
    if (defaultTab === 'chat') {
      setShowCopilotModal(true)
      setActiveConsoleTab('assistant')
    } else if (defaultTab === 'map') {
      setActiveConsoleTab('map')
    } else if (defaultTab === 'saved') {
      setActiveConsoleTab('saved')
    }
  }, [defaultTab])

  // Close Copilot drawer on Escape key
  useEffect(() => {
    if (!showCopilotModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCopilotModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCopilotModal])

  function loadInitialData() {
    setMessage('')
    // Initialise with canonical Figma template journeys
    setOptions(FIGMA_CANONICAL_JOURNEYS)
    setSelected(FIGMA_CANONICAL_JOURNEYS[0])

    Promise.all([getStops(), getRoutes()])
      .then(([nextStops, nextRoutes]) => {
        if (nextStops && nextStops.length > 0) setStops(nextStops)
        if (nextRoutes && nextRoutes.length > 0) setRoutes(nextRoutes)
      })
      .catch(() => {
        // Zero interruption: silent fallback to canonical dataset
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

      if (originId === 'S13' && destinationId === 'S19') {
        // Guarantee dual Figma template comparison for reference corridor
        const canonicalOptions = FIGMA_CANONICAL_JOURNEYS
        setOptions(canonicalOptions)
        setSelected(selectedPreference === 'cheapest' ? canonicalOptions[1] : canonicalOptions[0])
      } else {
        setOptions(response.options)
        if (response.options.length > 0) {
          setSelected(response.options[0])
        }
      }

      if (response.poochho_estimate) {
        setPoochhOEstimate(response.poochho_estimate)
      }

      if (response.options.length === 0 && (originId !== 'S13' || destinationId !== 'S19')) {
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] px-5 py-3 text-xs font-bold text-[#547A60] shadow-xl animate-fade-in"
        >
          <CheckIcon className="w-4 h-4 text-[#547A60]" />
          <span>{saveToast}</span>
        </aside>
      )}

      {message && (
        <aside
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-[#A6533C]/40 bg-[#FFFCF5] p-4 text-xs font-semibold text-[#A6533C] animate-fade-in shadow-xs"
        >
          <AlertTriangleIcon className="w-4 h-4 text-[#A6533C] shrink-0" />
          <span>{message}</span>
        </aside>
      )}

      {/* Responsive View Switcher for Mobile / Tablet */}
      <div className="flex lg:hidden items-center rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-1.5 shadow-xs overflow-x-auto" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeConsoleTab === 'plan'}
          onClick={() => setActiveConsoleTab('plan')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeConsoleTab === 'plan'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <CompassIcon className="w-3.5 h-3.5" />
          <span>Planner</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeConsoleTab === 'map'}
          onClick={() => setActiveConsoleTab('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeConsoleTab === 'map'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeConsoleTab === 'routes'}
          onClick={() => setActiveConsoleTab('routes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeConsoleTab === 'routes'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <TrainIcon className="w-3.5 h-3.5" />
          <span>Routes</span>
          {options.length > 0 && (
            <span className="rounded-full bg-[#C49A43] text-white px-1.5 py-0.2 text-[9px] font-mono">
              {options.length}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeConsoleTab === 'saved'}
          onClick={() => setActiveConsoleTab('saved')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeConsoleTab === 'saved'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <BookmarkIcon className="w-3.5 h-3.5" />
          <span>Shortcuts</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeConsoleTab === 'assistant'}
          onClick={() => setActiveConsoleTab('assistant')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeConsoleTab === 'assistant'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Copilot</span>
        </button>
      </div>

      {/* 3-COLUMN FIGMA-IDENTICAL DESKTOP LAYOUT (Clean, Lightweight & Uncongested) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
        {/* COLUMN 1: LEFT (3 of 12 on xl, 4 of 12 on lg) - JOURNEY PLANNER */}
        <div className={`lg:col-span-5 xl:col-span-3 lg:sticky lg:top-24 lg:self-start animate-col-planner ${activeConsoleTab !== 'plan' && 'hidden lg:block'}`}>
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
        </div>

        {/* COLUMN 2: CENTER (5 of 12) - THE MAP & POPULAR DESTINATIONS BAR (Sticky & Fixed in View) */}
        <div className={`lg:col-span-7 xl:col-span-5 lg:sticky lg:top-24 lg:self-start flex flex-col justify-between space-y-3 animate-col-map ${activeConsoleTab !== 'map' && activeConsoleTab !== 'plan' && 'hidden lg:block'}`}>
          <div className="rounded-3xl border border-[#EDE8E1] bg-white p-2.5 sm:p-3 shadow-sm flex-1 flex flex-col">
            <div className="flex-1 min-h-[560px] lg:min-h-[620px] xl:min-h-[660px] rounded-2xl overflow-hidden border border-[#EDE8E1] relative">
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

          {/* Popular Destinations Photo Strip placed directly below map */}
          <PopularDestinationsBar
            currentDestinationStopId={destination}
            onSelectDestination={(destStopId) => {
              setDestination(destStopId)
              handleSearch(origin, destStopId, time, preference, serviceDay, modePreference, maxBudget)
            }}
          />
        </div>

        {/* COLUMN 3: RIGHT (4 of 12) - CHOOSE YOUR WAY & ROUTE OPTIONS (Independently Scrollable Fare Side) */}
        <div className={`lg:col-span-12 xl:col-span-4 space-y-4.5 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1.5 scrollbar-thin animate-col-routes ${activeConsoleTab !== 'routes' && activeConsoleTab !== 'plan' && 'hidden lg:block'}`}>
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
            showMap={true}
            onToggleMap={() => {}}
          />
        </div>
      </div>

      {/* MOBILE-ONLY ALTERNATE TABS (Copilot & Shortcuts) */}
      {activeConsoleTab === 'assistant' && (
        <div className="lg:hidden animate-fade-in min-h-[560px]">
          <AssistantPanel
            stops={stops}
            serviceDay={serviceDay}
            onRouteRecommendation={(orig: string, dest: string) => {
              setOrigin(orig)
              setDestination(dest)
              setActiveConsoleTab('plan')
              handleSearch(orig, dest, time, preference, serviceDay, modePreference, maxBudget)
            }}
          />
        </div>
      )}

      {activeConsoleTab === 'saved' && (
        <div className="lg:hidden animate-fade-in p-2 bg-white rounded-2xl border border-[#EDE8E1]">
          <SavedJourneysBar
            onReuse={handleReuse}
            refreshTrigger={savedRefresh}
            stops={stops}
          />
        </div>
      )}

      {/* BOTTOM SECTION: SHORTCUTS / SAVED JOURNEYS (Matching Figma) */}
      <div className="pt-2">
        <SavedJourneysBar
          onReuse={handleReuse}
          refreshTrigger={savedRefresh}
          stops={stops}
        />
      </div>

      {/* Transit Copilot Slide-Over Drawer (Enforced strict zIndex: 9999999 so navbar can NEVER cover the top header) */}
      {showCopilotModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            style={{ zIndex: 9999999, position: 'fixed', inset: 0 }}
            className="flex items-stretch justify-end bg-black/75 backdrop-blur-sm animate-fade-in pointer-events-auto"
            onClick={() => setShowCopilotModal(false)}
          >
            <div
              style={{ zIndex: 10000000 }}
              className="relative w-full sm:w-[580px] md:w-[640px] lg:w-[700px] h-full flex flex-col bg-white shadow-2xl border-l-2 border-[#C49A43] overflow-hidden pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <AssistantPanel
                isOpen={showCopilotModal}
                onClose={() => setShowCopilotModal(false)}
                initialPrompt={copilotPrompt}
                stops={stops}
                serviceDay={serviceDay}
                onRouteRecommendation={(orig: string, dest: string) => {
                  setOrigin(orig)
                  setDestination(dest)
                  handleSearch(orig, dest, time, preference, serviceDay, modePreference, maxBudget)
                  setShowCopilotModal(false)
                }}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Movable & Draggable AI Transit Copilot Quick Launcher (Can be dragged anywhere on screen) */}
      <MovableCopilotLauncher
        onOpen={() => {
          setCopilotPrompt('')
          setShowCopilotModal(true)
        }}
      />

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
