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
import { FIGMA_CANONICAL_JOURNEYS } from '../utils/figmaRoutes'
import {
  CompassIcon,
  SparklesIcon,
  BookmarkIcon,
  CheckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  TrainIcon,
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
  const [origin, setOrigin] = useState('S13') // Default Dwarka Sec-21 (Figma)
  const [destination, setDestination] = useState('S19') // Default Botanical Garden / Noida (Figma)
  const [time, setTime] = useState('08:40')
  const [preference, setPreference] = useState('fastest')
  const [modePreference, setModePreference] = useState<ModePreference>('all')
  const [maxBudget, setMaxBudget] = useState<string>('')
  const [showProvenanceModal, setShowProvenanceModal] = useState(false)
  const [showCashbackModal, setShowCashbackModal] = useState(false)
  const [poochhoEstimate, setPoochhOEstimate] = useState<PoochhOEstimate | null>(null)

  // Console active tab: 'plan' | 'assistant' | 'saved'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'plan' | 'assistant' | 'saved'>('plan')

  const [showCopilotModal, setShowCopilotModal] = useState(false)

  function loadInitialData() {
    setMessage('')
    // Initialise with canonical Figma template journeys
    setOptions(FIGMA_CANONICAL_JOURNEYS)
    setSelected(FIGMA_CANONICAL_JOURNEYS[0])

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
      <div className="flex lg:hidden items-center rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-1.5 shadow-xs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeConsoleTab === 'plan'}
          onClick={() => setActiveConsoleTab('plan')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeConsoleTab === 'plan'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <CompassIcon className="w-3.5 h-3.5" />
          <span>Plan & Routes</span>
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeConsoleTab === 'assistant'
              ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
              : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]'
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Copilot</span>
        </button>
      </div>

      {/* 3-COLUMN UNIFIED DESKTOP LAYOUT (Matching Figma Design Specification) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: LEFT (~3 of 12) - PLANNER & ASK COPILOT CARD */}
        <div className={`lg:col-span-4 xl:col-span-3 space-y-4 ${activeConsoleTab !== 'plan' && 'hidden lg:block'}`}>
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

          {/* Ask Aaroh-Saarthi Card Matching Figma */}
          <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-[#C49A43]" />
              <h3 className="font-serif text-base font-bold text-[#1A2E3B]">
                Ask Aaroh-Saarthi
              </h3>
            </div>
            <p className="text-xs text-[#7A7269] leading-relaxed">
              An easier way to navigate the city.
            </p>
            <button
              type="button"
              onClick={() => setShowCopilotModal(true)}
              className="w-full flex items-center justify-between rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] hover:bg-[#F2ECE1] p-2.5 text-left text-xs font-medium text-[#7A7269] transition-colors cursor-pointer group"
            >
              <span className="truncate text-xs">Try: "Which line is faster from Janakpuri to..."</span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-[#C49A43] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        {/* COLUMN 2: CENTER (~5 of 12) - INTERACTIVE DELHI TRANSIT MAP */}
        <div className={`lg:col-span-4 xl:col-span-5 flex flex-col min-h-[500px] lg:min-h-[660px] sticky top-20 ${activeConsoleTab !== 'plan' && 'hidden lg:flex'}`}>
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

        {/* COLUMN 3: RIGHT (~4 of 12) - ROUTE OPTIONS / CHOOSE YOUR WAY */}
        <div className={`lg:col-span-4 xl:col-span-4 space-y-4 ${activeConsoleTab !== 'plan' && 'hidden lg:block'}`}>
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

      {/* MOBILE-ONLY ALTERNATE TABS (Copilot & Shortcuts) */}
      {activeConsoleTab === 'assistant' && (
        <div className="lg:hidden animate-fade-in">
          <AssistantPanel />
        </div>
      )}

      {/* BOTTOM SECTION: SHORTCUTS / SAVED JOURNEYS (Matching Figma) */}
      <div className="pt-2">
        <SavedJourneysBar
          onReuse={handleReuse}
          refreshTrigger={savedRefresh}
        />
      </div>

      {/* Transit Copilot Modal */}
      {showCopilotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#D8C8AA] bg-[#FFFCF5] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8C8AA] pb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[#C49A43]" />
                <h3 className="font-serif text-lg font-bold text-[#243B4A]">Transit Copilot</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCopilotModal(false)}
                className="rounded-xl p-2 text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6] cursor-pointer"
                aria-label="Close copilot"
              >
                ✕
              </button>
            </div>
            <AssistantPanel />
          </div>
        </div>
      )}

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
