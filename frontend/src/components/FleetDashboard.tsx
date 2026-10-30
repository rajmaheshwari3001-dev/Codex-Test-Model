import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BusState, DisruptionResult, AuditLogRecord } from '../types'
import { getFleetState, triggerDisruption, approveResponse, resetFleetState, getFleetAuditLog } from '../services/api'
import ScenarioComparison from './ScenarioComparison'
import FleetMap from './fleet/FleetMap'
import {
  AlertTriangleIcon,
  InfoIcon,
  ShieldCheckIcon,
  RefreshIcon,
  FileTextIcon,
  BusIcon,
  ActivityIcon,
  ParkingIcon,
  BatteryIcon,
  MapIcon,
  BarChartIcon,
  ZapIcon,
} from './common/Icons'

export default function FleetDashboard() {
  const [searchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab')

  // Top View Navigation
  const [activeView, setActiveView] = useState<'radar' | 'roster' | 'green' | 'audit'>('radar')

  const [buses, setBuses] = useState<BusState[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [simulated, setSimulated] = useState<boolean | null>(null)
  const [disruptionType, setDisruptionType] = useState('breakdown')
  const [selectedBus, setSelectedBus] = useState('')
  const [delayMinutes, setDelayMinutes] = useState(15)
  const [result, setResult] = useState<DisruptionResult | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [decisionMade, setDecisionMade] = useState(false)
  const [decisionPending, setDecisionPending] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Live Telemetry Auto-Stream simulation toggle
  const [isLiveStream, setIsLiveStream] = useState(true)
  const [liveStreamTick, setLiveStreamTick] = useState(0)

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])

  // Filters for bus roster
  const [routeFilter, setRouteFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const disruptionRef = useRef<HTMLDivElement>(null)
  const scenarioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTabParam === 'disruptions' && disruptionRef.current) {
      disruptionRef.current.scrollIntoView({ behavior: 'smooth' })
    } else if (activeTabParam === 'scenarios' && scenarioRef.current) {
      scenarioRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTabParam])

  async function loadFleet() {
    setLoading(true)
    setLoadError('')
    try {
      const data = await getFleetState()
      setSimulated(data.simulated)
      updateFleetState(data.buses)
      loadAuditLog()
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? `Unable to load fleet telemetry: ${error.message}`
          : 'Unable to load fleet telemetry.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadAuditLog() {
    try {
      const data = await getFleetAuditLog()
      if (data && data.audit_log) {
        setAuditLogs(data.audit_log)
      }
    } catch {
      // Non-critical background telemetry
    }
  }

  useEffect(() => {
    void loadFleet()
  }, [])

  // Live telemetry ticker
  useEffect(() => {
    if (!isLiveStream) return
    const timer = setInterval(() => {
      setLiveStreamTick(prev => prev + 1)
      setBuses(prevBuses =>
        prevBuses.map((b, idx) => {
          if (b.status !== 'active') return b
          const deltaSpeed = Math.floor(Math.sin((liveStreamTick + idx) * 0.7) * 3)
          const baseSpeed = b.speed_kmh || 30
          return {
            ...b,
            speed_kmh: Math.max(18, Math.min(52, baseSpeed + deltaSpeed)),
          }
        })
      )
    }, 4000)
    return () => clearInterval(timer)
  }, [isLiveStream, liveStreamTick])

  function updateFleetState(nextBuses: BusState[]) {
    setBuses(nextBuses)
    setSelectedBus(current => {
      if (nextBuses.some(b => b.bus_id === current && b.status === 'active')) {
        return current
      }
      return nextBuses.find(b => b.status === 'active')?.bus_id ?? ''
    })
  }

  async function handleDisrupt(targetBusId?: string, targetType?: string) {
    const busId = targetBusId || selectedBus
    const type = targetType || disruptionType
    if (!busId) return

    setSimulating(true)
    setResult(null)
    setActionMsg('')
    setActionError('')
    setDecisionMade(false)
    try {
      const res = await triggerDisruption({
        disruption_type: type,
        affected_bus_id: busId,
        description: `Simulated ${type} for vehicle ${busId}`,
        delay_minutes: type === 'delay' ? delayMinutes : 0,
      })
      updateFleetState(res.fleet_state.buses)
      setResult(res)
      loadAuditLog()
      setTimeout(() => {
        scenarioRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Disruption evaluation failed.')
    } finally {
      setSimulating(false)
    }
  }

  async function handleApprove(responseId: string, approved: boolean) {
    if (!result || decisionMade || decisionPending) return
    setDecisionPending(true)
    setActionError('')
    try {
      const res = await approveResponse({
        disruption_id: result.disruption.disruption_id,
        response_id: responseId,
        approved,
      })
      updateFleetState(res.fleet_state.buses)
      setDecisionMade(true)
      setActionMsg(res.message)
      loadAuditLog()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Response decision failed.')
    } finally {
      setDecisionPending(false)
    }
  }

  async function handleResetFleet() {
    setIsResetting(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await resetFleetState()
      updateFleetState(res.fleet_state.buses)
      setResult(null)
      setDecisionMade(false)
      setActionMsg('Fleet reset to initial baseline conditions.')
      loadAuditLog()
      setTimeout(() => setActionMsg(''), 5000)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Fleet reset failed.')
    } finally {
      setIsResetting(false)
    }
  }

  function handleExportManifestCSV() {
    if (!buses.length) return
    const headers = ['Vehicle_ID', 'Route', 'Trip', 'Status', 'Model', 'Battery_SoC', 'Occupancy_Pct', 'Delay_Mins', 'Speed_kmh', 'Driver_ID', 'CO2_Saved_kg']
    const rows = buses.map(b => [
      b.bus_id,
      b.route_id || 'Depot',
      b.trip_id || 'N/A',
      b.status,
      `"${b.vehicle_type || 'Tata Starbus EV'}"`,
      `${b.battery_level || 85}%`,
      `${b.occupancy_percent}%`,
      b.delay_minutes,
      b.speed_kmh || 30,
      b.driver_id || 'DTC-D101',
      b.fuel_co2_saved_kg || 14.5,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `DTC_Fleet_Manifest_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeBuses = buses.filter(b => b.status === 'active')
  const spareBuses = buses.filter(b => b.status === 'spare')
  const brokenBuses = buses.filter(b => b.status === 'broken_down')
  const delayedBuses = buses.filter(b => b.delay_minutes > 0)

  // Green Energy Aggregations
  const totalCo2Saved = buses.reduce((acc, b) => acc + (b.fuel_co2_saved_kg || 14.5), 0)
  const averageBattery = Math.round(
    buses.reduce((acc, b) => acc + (b.battery_level || 85), 0) / Math.max(1, buses.length)
  )

  const filteredBuses = buses.filter(b => {
    if (routeFilter !== 'ALL' && b.route_id !== routeFilter) return false
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
    if (searchQuery && !b.bus_id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const uniqueRoutes = Array.from(new Set(buses.map(b => b.route_id).filter(Boolean))).sort()

  const statusBadgeStyle: Record<string, string> = {
    active: 'bg-[#EAF5EC] text-[#2E7D32] border border-[#D1E7D5]',
    spare: 'bg-[#E8EDF1] text-[#1A2E3B] border border-[#D0DDE5]',
    broken_down: 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]',
    reassigned: 'bg-[#FAF0D9] text-[#A67C1E] border border-[#F0E2C2]',
  }

  const corridorHealth = [
    { id: 'R01', name: 'Blue Line (Dwarka ↔ Anand Vihar)', color: '#C49A43' },
    { id: 'R02', name: 'Green Line (Kashmere ↔ Hauz Khas)', color: '#C49A43' },
    { id: 'R03', name: 'Red Ring (CP ↔ Sarai Kale Khan)', color: '#1A2E3B' },
    { id: 'R04', name: 'Yellow Express (New Delhi ↔ Saket)', color: '#1A2E3B' },
  ].map(corridor => {
    const routeBuses = buses.filter(b => b.route_id === corridor.id)
    const delayedCount = routeBuses.filter(b => b.delay_minutes > 0).length
    const brokenCount = routeBuses.filter(b => b.status === 'broken_down').length
    const onTimePercent =
      routeBuses.length > 0
        ? Math.round(((routeBuses.length - delayedCount - brokenCount) / routeBuses.length) * 100)
        : null

    return {
      ...corridor,
      busesCount: routeBuses.length,
      delayedCount,
      brokenCount,
      onTimePercent,
    }
  })

  if (loading) {
    return (
      <div className="py-16 text-center text-xs font-semibold text-[#7A7269] flex items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-[#C49A43] border-t-transparent rounded-full animate-spin" />
        <span>Loading simulated fleet telemetry…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <section role="alert" className="rounded-2xl border border-[#A6533C]/40 bg-white p-5 text-[#A6533C]">
        <h2 className="text-sm font-bold">Fleet telemetry unavailable</h2>
        <p className="mt-1 text-xs">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadFleet()}
          className="mt-3 rounded-xl bg-[#1A2E3B] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#243B4A] cursor-pointer"
        >
          Retry loading fleet
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Quick Actions Bar (Auto-Stream toggle + Reset + Export) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-[#EBE5DC] bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAF0D9] text-[#A67C1E]">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#1A202C] flex items-center gap-2">
              <span>Delhi DTC Operations Command</span>
              <span className="rounded-full bg-[#EAF5EC] px-2 py-0.5 text-[10px] font-bold text-[#2E7D32] border border-[#D1E7D5]">
                {simulated ? 'GTFS Connected' : 'Telemetry Live'}
              </span>
            </div>
            <div className="text-[11px] text-[#7A7269]">
              Algorithmic dispatch, predictive mitigation, and live electric fleet telemetry
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Telemetry Ticker Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveStream(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isLiveStream
                ? 'bg-[#EAF5EC] text-[#2E7D32] border-[#D1E7D5]'
                : 'bg-[#FAF7F2] text-[#7A7269] border-[#EBE5DC]'
            }`}
            title="Toggle live telemetry tick streaming"
          >
            <span className={`h-2 w-2 rounded-full ${isLiveStream ? 'bg-[#2E7D32] animate-pulse' : 'bg-[#7A7269]'}`} />
            <span>{isLiveStream ? 'Telemetry: Live' : 'Telemetry: Paused'}</span>
          </button>

          {/* Reset Fleet Simulator */}
          <button
            type="button"
            onClick={handleResetFleet}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A2E3B] bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EBE5DC] transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
            title="Reset fleet status and clear incidents back to baseline"
          >
            <RefreshIcon className="w-3.5 h-3.5 text-[#1A2E3B]" />
            <span>{isResetting ? 'Resetting…' : 'Reset Baseline'}</span>
          </button>

          {/* Export Manifest CSV */}
          <button
            type="button"
            onClick={handleExportManifestCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#1A2E3B] hover:bg-[#253E4E] transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Download CSV manifest of all vehicles"
          >
            <FileTextIcon className="w-3.5 h-3.5 text-white" />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* Disruption Alert Banner if any failures exist */}
      {(brokenBuses.length > 0 || delayedBuses.length > 0) && (
        <div className="rounded-2xl border border-[#F8B4B4] bg-[#FDE8E8] p-4 flex items-center justify-between gap-3 text-xs text-[#9B1C1C] shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="w-5 h-5 shrink-0 text-[#9B1C1C]" />
            <div>
              <span className="font-bold">Active Operational Alert: </span>
              <span>
                {brokenBuses.length > 0 && `${brokenBuses.length} vehicle(s) immobilized (breakdown). `}
                {delayedBuses.length > 0 && `${delayedBuses.length} trip(s) experiencing traffic delay.`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => disruptionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[11px] font-bold underline cursor-pointer shrink-0"
          >
            Review Mitigations ↓
          </button>
        </div>
      )}

      {/* 4 Primary Operational Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#EBE5DC] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#7A7269] text-xs font-semibold">
            <span>Total Fleet</span>
            <BusIcon className="w-4 h-4 text-[#7A7269]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1A2E3B] mt-1">{buses.length}</div>
          <div className="text-[11px] text-[#7A7269] mt-1 font-medium">100% Instrument Telemetry</div>
        </div>

        <div className="rounded-2xl border border-[#D1E7D5] bg-[#EAF5EC]/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#2E7D32] text-xs font-bold">
            <span>Active on Grid</span>
            <ActivityIcon className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2E7D32] mt-1">{activeBuses.length}</div>
          <div className="text-[11px] text-[#2E7D32] mt-1 font-semibold">
            {Math.round((activeBuses.length / Math.max(1, buses.length)) * 100)}% Fleet Utilization
          </div>
        </div>

        <div className="rounded-2xl border border-[#F0E2C2] bg-[#FAF0D9]/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#A67C1E] text-xs font-bold">
            <span>Depot Spares</span>
            <ParkingIcon className="w-4 h-4 text-[#A67C1E]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#A67C1E] mt-1">{spareBuses.length}</div>
          <div className="text-[11px] text-[#A67C1E] mt-1 font-semibold">
            Stationed at Kashmere & Dwarka
          </div>
        </div>

        <div className="rounded-2xl border border-[#F8B4B4] bg-[#FDE8E8]/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#9B1C1C] text-xs font-bold">
            <span>Disrupted</span>
            <AlertTriangleIcon className="w-4 h-4 text-[#9B1C1C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#9B1C1C] mt-1">
            {brokenBuses.length + delayedBuses.length}
          </div>
          <div className="text-[11px] text-[#9B1C1C] mt-1 font-semibold">
            {brokenBuses.length} broken • {delayedBuses.length} delayed
          </div>
        </div>
      </div>

      {/* Corridor Punctuality Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {corridorHealth.map(c => (
          <div key={c.id} className="rounded-2xl border border-[#EBE5DC] bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2 text-[#1A2E3B]">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                {c.id} Corridor
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  c.brokenCount > 0
                    ? 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]'
                    : c.delayedCount > 0
                    ? 'bg-[#FAF0D9] text-[#A67C1E] border border-[#F0E2C2]'
                    : 'bg-[#EAF5EC] text-[#2E7D32] border border-[#D1E7D5]'
                }`}
              >
                {c.onTimePercent === null ? 'No data' : `${c.onTimePercent}% on time`}
              </span>
            </div>
            <div className="text-[11px] text-[#7A7269] truncate">{c.name}</div>
            <div className="flex items-center justify-between text-[11px] text-[#7A7269] pt-2 border-t border-[#F0EAE1]">
              <span>{c.busesCount} assigned</span>
              {c.delayedCount > 0 && <span className="text-[#A67C1E] font-bold">+{c.delayedCount} delayed</span>}
              {c.brokenCount > 0 && <span className="text-[#9B1C1C] font-bold">+{c.brokenCount} failed</span>}
              {c.busesCount > 0 && c.delayedCount === 0 && c.brokenCount === 0 && (
                <span className="text-[#2E7D32] font-bold">Nominal</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Segmented View Mode Tabs: Radar Map vs Roster vs Green EV vs Audit Log */}
      <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2">
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#EBE5DC]">
          <button
            type="button"
            onClick={() => setActiveView('radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'radar'
                ? 'bg-[#1A2E3B] text-white shadow-2xs'
                : 'text-[#7A7269] hover:text-[#1A2E3B]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Live Fleet Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'roster'
                ? 'bg-[#1A2E3B] text-white shadow-2xs'
                : 'text-[#7A7269] hover:text-[#1A2E3B]'
            }`}
          >
            <BarChartIcon className="w-3.5 h-3.5" />
            <span>Roster & Table</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('green')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'green'
                ? 'bg-[#1A2E3B] text-white shadow-2xs'
                : 'text-[#7A7269] hover:text-[#1A2E3B]'
            }`}
          >
            <BatteryIcon className="w-3.5 h-3.5" />
            <span>EV & Green Telemetry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'audit'
                ? 'bg-[#1A2E3B] text-white shadow-2xs'
                : 'text-[#7A7269] hover:text-[#1A2E3B]'
            }`}
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            <span>Dispatch Audit Log ({auditLogs.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#7A7269] font-mono hidden sm:block">
          Tick: #{liveStreamTick} • Auto-Sync Active
        </div>
      </div>

      {/* VIEW 1: Interactive Live Fleet Radar Map */}
      {activeView === 'radar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C49A43]">
              Geospatial Corridor Map • Real-Time GPS Tracking
            </span>
            <span className="text-xs text-[#7A7269]">
              Click any vehicle icon on the map to inspect telemetry or simulate an incident
            </span>
          </div>
          <FleetMap
            buses={buses}
            selectedBusId={selectedBus}
            onSelectBus={id => setSelectedBus(id)}
            onTriggerDisruptionForBus={(id, type) => {
              setSelectedBus(id)
              setDisruptionType(type || 'breakdown')
              handleDisrupt(id, type)
            }}
          />
        </div>
      )}

      {/* VIEW 2: Fleet Telemetry Roster & Table */}
      {activeView === 'roster' && (
        <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EBE5DC] gap-2">
            <div className="space-y-1">
              <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
                LIVE ROSTER
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B]">Fleet Telemetry Roster</h2>
              <p className="text-xs sm:text-sm text-[#7A7269] leading-relaxed">
                Real-time operational status, position, driver, model, and passenger crowding across vehicles
              </p>
            </div>
            <div className="text-xs sm:text-sm text-[#7A7269] font-mono">
              {filteredBuses.length} of {buses.length} vehicles displayed
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE5DC]">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by Bus ID (e.g. B-T01) or Driver…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 bg-white text-[#1A202C] placeholder-[#7A7269] focus:outline-none focus:border-[#C49A43]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={routeFilter}
                onChange={e => setRouteFilter(e.target.value)}
                className="text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 bg-white text-[#1A202C] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Routes</option>
                {uniqueRoutes.map(r => (
                  <option key={r} value={r}>
                    Route {r}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 bg-white text-[#1A202C] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="spare">Spare Only</option>
                <option value="broken_down">Broken Down</option>
                <option value="reassigned">Reassigned</option>
              </select>
            </div>
          </div>

          {/* Bus Table */}
          <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#EBE5DC] text-[#7A7269] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Vehicle ID</th>
                  <th className="py-2.5 px-3">Vehicle Model</th>
                  <th className="py-2.5 px-3">Route & Trip</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Battery SoC</th>
                  <th className="py-2.5 px-3">Occupancy</th>
                  <th className="py-2.5 px-3">Schedule Adherence</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5DC]">
                {filteredBuses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-[#7A7269]">
                      No vehicles match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBuses.map(b => (
                    <tr
                      key={b.bus_id}
                      className={`hover:bg-[#FAF7F2]/60 transition-colors ${
                        selectedBus === b.bus_id ? 'bg-[#FAF0D9]/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A2E3B]">{b.bus_id}</td>
                      <td className="py-2.5 px-3 text-[#1A202C] font-medium">{b.vehicle_type || 'Tata Starbus EV'}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#1A2E3B]">{b.route_id || 'Depot'}</span>
                        {b.trip_id && <span className="font-mono text-[10px] text-[#7A7269] ml-1.5">({b.trip_id})</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeStyle[b.status] || ''}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A2E3B]">
                        {b.status === 'broken_down' ? '0 km/h' : `${b.speed_kmh || 30} km/h`}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <BatteryIcon className="w-3.5 h-3.5 text-[#2E7D32]" />
                          <span className="font-mono font-bold text-[#2E7D32]">{b.battery_level || 85}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-[#EBE5DC] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                b.occupancy_percent > 80
                                  ? 'bg-[#9B1C1C]'
                                  : b.occupancy_percent > 50
                                  ? 'bg-[#C49A43]'
                                  : 'bg-[#2E7D32]'
                              }`}
                              style={{ width: `${Math.min(b.occupancy_percent, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#7A7269]">{b.occupancy_percent}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {b.delay_minutes > 0 ? (
                          <span className="text-[#9B1C1C] font-bold">+{b.delay_minutes}m delay</span>
                        ) : (
                          <span className="text-[#2E7D32] font-semibold">On Schedule</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBus(b.bus_id)
                            disruptionRef.current?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className="text-[11px] font-bold text-[#C49A43] hover:underline cursor-pointer"
                        >
                          Target Incident →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Green Fleet & EV Telemetry Analytics */}
      {activeView === 'green' && (
        <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-[#EBE5DC] pb-3 space-y-1">
            <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#2E7D32] select-none">
              CLEAN TRANSIT INTELLIGENCE
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B]">
              Delhi EV Fleet Decarbonization & Energy Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7269]">
              Live monitoring of zero-emission battery buses, regenerative braking yield, and fossil fuel displacement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#D1E7D5] bg-[#EAF5EC]/50 p-4 space-y-1">
              <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">CO₂ Emissions Avoided</span>
              <div className="text-3xl font-black text-[#2E7D32]">{totalCo2Saved.toFixed(1)} kg</div>
              <p className="text-[11px] text-[#7A7269]">Displacing diesel PM2.5 emissions across NCT corridors today</p>
            </div>

            <div className="rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] p-4 space-y-1">
              <span className="text-xs font-bold text-[#1A2E3B] uppercase tracking-wider">Fleet Average State of Charge</span>
              <div className="text-3xl font-black text-[#1A2E3B]">{averageBattery}%</div>
              <p className="text-[11px] text-[#7A7269]">Nominal operating range &gt; 180 km remaining per vehicle</p>
            </div>

            <div className="rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] p-4 space-y-1">
              <span className="text-xs font-bold text-[#C49A43] uppercase tracking-wider">Regenerative Braking Efficiency</span>
              <div className="text-3xl font-black text-[#C49A43]">28.4%</div>
              <p className="text-[11px] text-[#7A7269]">Kinetic energy recovered on stop-and-go Delhi Ring Road segments</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#EBE5DC] p-4 bg-white space-y-3">
            <div className="text-xs font-bold text-[#1A2E3B] uppercase tracking-wider">
              Charging Infrastructure & Depot Reserves
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#7A7269]">
              <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#EBE5DC] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A2E3B]">Kashmere Gate ISBT Superchargers</div>
                  <div className="text-[11px]">8 / 10 Bays Available • 120kW DC Fast Charge</div>
                </div>
                <span className="flex items-center gap-1.5 text-[#2E7D32] font-bold">
                  <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
                  <span>Operational</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#EBE5DC] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A2E3B]">Dwarka Sector 21 Terminal Depot</div>
                  <div className="text-[11px]">6 / 8 Bays Available • Overnight CCS2 Feeders</div>
                </div>
                <span className="flex items-center gap-1.5 text-[#2E7D32] font-bold">
                  <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
                  <span>Operational</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Dispatch Decision Audit Log */}
      {activeView === 'audit' && (
        <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
            <div>
              <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
                COMPLIANCE & TRACEABILITY
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B]">
                Dispatch Decision Audit Log
              </h2>
            </div>
            <span className="text-xs font-mono text-[#7A7269]">{auditLogs.length} entries recorded</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#7A7269]">
              No dispatch interventions executed yet in this session. Trigger and approve a response below to see the audit trail.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] border-b border-[#EBE5DC] text-[#7A7269] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Disruption ID</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Evaluated</th>
                    <th className="py-2.5 px-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE5DC]">
                  {auditLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A2E3B]">{log.disruption_id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#C49A43]">{log.bus_id}</td>
                      <td className="py-2.5 px-3 uppercase text-[11px] font-semibold">{log.type}</td>
                      <td className="py-2.5 px-3 text-[#1A202C]">{log.description}</td>
                      <td className="py-2.5 px-3 text-[#7A7269]">{log.total_options_evaluated} responses</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            log.decision === 'approved'
                              ? 'bg-[#EAF5EC] text-[#2E7D32] border border-[#D1E7D5]'
                              : 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]'
                          }`}
                        >
                          {log.decision}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Disruption Simulation Trigger Panel */}
      <div ref={disruptionRef} className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#EBE5DC] space-y-1">
          <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
            INCIDENT CONTROL & WHAT-IF ENGINE
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B]">Simulate Operational Disruption</h2>
          <p className="text-xs sm:text-sm text-[#7A7269] leading-relaxed">
            Inject synthetic operational incidents to evaluate algorithmic response tradeoffs before committing fleet resources
          </p>
        </div>

        {/* 1-Click Incident Scenario Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
            1-Click Incident Scenarios (Quick Test Presets):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'B-T01 Breakdown (Rajiv Chowk)', bus: 'B-T01', type: 'breakdown', delay: 0 },
              { label: 'B-T03 Traffic Jam (+25m)', bus: 'B-T03', type: 'delay', delay: 25 },
              { label: 'B-T05 Mechanical Stall', bus: 'B-T05', type: 'breakdown', delay: 0 },
              { label: 'B-T07 Ring Road Jam (+15m)', bus: 'B-T07', type: 'delay', delay: 15 },
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSelectedBus(preset.bus)
                  setDisruptionType(preset.type)
                  if (preset.delay) setDelayMinutes(preset.delay)
                  handleDisrupt(preset.bus, preset.type)
                }}
                className="p-2.5 rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] hover:bg-[#FAF0D9] hover:border-[#C49A43] text-left transition-all cursor-pointer text-xs font-semibold text-[#1A2E3B] active:scale-95 shadow-2xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#7A7269] mb-1">Incident Type</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 bg-white text-[#1A202C] focus:outline-none focus:border-[#C49A43] cursor-pointer"
            >
              <option value="breakdown">Mechanical Breakdown (Bus Immobilized)</option>
              <option value="delay">Corridor Delay (Traffic Congestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A7269] mb-1">Target Active Vehicle</label>
            <select
              value={selectedBus}
              onChange={e => setSelectedBus(e.target.value)}
              disabled={activeBuses.length === 0}
              className="w-full text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 bg-white text-[#1A202C] focus:outline-none focus:border-[#C49A43] cursor-pointer"
            >
              {activeBuses.length === 0 && <option value="">No active vehicle available</option>}
              {activeBuses.map(b => (
                <option key={b.bus_id} value={b.bus_id}>
                  {b.bus_id} ({b.route_id} • Trip {b.trip_id})
                </option>
              ))}
            </select>
          </div>

          {disruptionType === 'delay' && (
            <div>
              <label className="block text-xs font-semibold text-[#7A7269] mb-1">Delay Duration (minutes)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={e => setDelayMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
                min={1}
                max={120}
                className="w-full text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 font-mono bg-white text-[#1A202C] focus:outline-none focus:border-[#C49A43]"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleDisrupt()}
          disabled={simulating || !selectedBus}
          className="group rounded-xl bg-gradient-to-r from-[#C49A43] via-[#BA8F39] to-[#AF842F] hover:from-[#B88E3B] hover:via-[#AF842F] hover:to-[#A17528] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 transition-all duration-200 shadow-[0_4px_14px_rgba(196,154,67,0.3)] hover:shadow-[0_6px_20px_rgba(196,154,67,0.4)] active:scale-[0.98] cursor-pointer flex items-center gap-2"
        >
          {simulating ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Evaluating Algorithmic Responses…</span>
            </>
          ) : (
            <>
              <span>Simulate Disruption & Compare Responses</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </>
          )}
        </button>
      </div>

      {/* Scenario Comparison Section */}
      <div ref={scenarioRef}>
        {result && !result.error && (
          <ScenarioComparison
            result={result}
            onApprove={handleApprove}
            decisionMade={decisionMade}
            decisionPending={decisionPending}
          />
        )}
      </div>

      {result?.error && (
        <div role="alert" className="rounded-2xl border border-[#F8B4B4] bg-[#FDE8E8] p-4 text-xs font-semibold text-[#9B1C1C]">
          <div className="font-bold">Simulation Notice</div>
          <div>{result.error}</div>
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-2xl border border-[#F8B4B4] bg-[#FDE8E8] p-4 text-xs font-semibold text-[#9B1C1C]">
          {actionError}
        </div>
      )}

      {actionMsg && (
        <div role="status" className="rounded-2xl border border-[#D1E7D5] bg-[#EAF5EC] p-4 text-xs font-semibold text-[#2E7D32]">
          {actionMsg}
        </div>
      )}
    </div>
  )
}
