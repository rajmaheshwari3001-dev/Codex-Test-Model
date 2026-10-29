import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BusState, DisruptionResult } from '../types'
import { getFleetState, triggerDisruption, approveResponse } from '../services/api'
import ScenarioComparison from './ScenarioComparison'

export default function FleetDashboard() {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'roster'

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

  // Filters for bus roster
  const [routeFilter, setRouteFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const disruptionRef = useRef<HTMLDivElement>(null)
  const scenarioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab === 'disruptions' && disruptionRef.current) {
      disruptionRef.current.scrollIntoView({ behavior: 'smooth' })
    } else if (activeTab === 'scenarios' && scenarioRef.current) {
      scenarioRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTab])

  async function loadFleet() {
    setLoading(true)
    setLoadError('')
    try {
      const data = await getFleetState()
      setSimulated(data.simulated)
      updateFleetState(data.buses)
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

  useEffect(() => {
    void loadFleet()
  }, [])

  function updateFleetState(nextBuses: BusState[]) {
    setBuses(nextBuses)
    setSelectedBus(current => {
      if (nextBuses.some(b => b.bus_id === current && b.status === 'active')) {
        return current
      }
      return nextBuses.find(b => b.status === 'active')?.bus_id ?? ''
    })
  }

  async function handleDisrupt() {
    if (!selectedBus) return
    setSimulating(true)
    setResult(null)
    setActionMsg('')
    setActionError('')
    setDecisionMade(false)
    try {
      const res = await triggerDisruption({
        disruption_type: disruptionType,
        affected_bus_id: selectedBus,
        description: `Simulated ${disruptionType} for vehicle ${selectedBus}`,
        delay_minutes: disruptionType === 'delay' ? delayMinutes : 0,
      })
      updateFleetState(res.fleet_state.buses)
      setResult(res)
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
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Response decision failed.')
    } finally {
      setDecisionPending(false)
    }
  }

  const activeBuses = buses.filter(b => b.status === 'active')
  const spareBuses = buses.filter(b => b.status === 'spare')
  const brokenBuses = buses.filter(b => b.status === 'broken_down')
  const delayedBuses = buses.filter(b => b.delay_minutes > 0)

  const filteredBuses = buses.filter(b => {
    if (routeFilter !== 'ALL' && b.route_id !== routeFilter) return false
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
    if (searchQuery && !b.bus_id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const uniqueRoutes = Array.from(new Set(buses.map(b => b.route_id).filter(Boolean))).sort()

  const statusColor: Record<string, string> = {
    active: 'bg-[#EBF4F0] text-[#236B56] border border-[#236B56]/30',
    spare: 'bg-[#F4EBD9] text-[#B88A43] border border-[#B88A43]/40',
    broken_down: 'bg-[#F8ECE9] text-[#A44735] border border-[#A44735]/40',
    reassigned: 'bg-[#FAF7F2] text-[#25312D] border border-[#E8DFCE]',
  }

  const corridorHealth = [
    { id: 'R01', name: 'Blue Line (Dwarka ↔ Anand Vihar)', color: '#2196F3' },
    { id: 'R02', name: 'Green Line (Kashmere ↔ Hauz Khas)', color: '#16A34A' },
    { id: 'R03', name: 'Red Ring (CP ↔ Sarai Kale Khan)', color: '#DC2626' },
    { id: 'R04', name: 'Yellow Express (New Delhi ↔ Saket)', color: '#D97706' },
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
      <div className="py-16 text-center text-xs font-semibold text-[#53645F] flex items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-[#173B32] border-t-transparent rounded-full animate-spin" />
        <span>Loading simulated fleet telemetry…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <section role="alert" className="rounded-xl border border-[#A44735]/30 bg-[#F8ECE9] p-5 text-[#A44735]">
        <h2 className="text-sm font-bold">Fleet telemetry unavailable</h2>
        <p className="mt-1 text-xs">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadFleet()}
          className="mt-3 rounded-lg bg-[#173B32] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f4d42]"
        >
          Retry loading fleet
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simulation Transparency Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-base text-[#173B32]">ℹ</span>
          <div>
            <div className="text-xs font-bold text-[#25312D]">Simulated Fleet Telemetry</div>
            <div className="text-[11px] text-[#53645F]">
              Vehicles, incidents, and operational responses are generated deterministically by the backend simulator.
            </div>
          </div>
        </div>
        <span className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#173B32]">
          {simulated === true ? 'Simulated Model' : 'Local Telemetry'}
        </span>
      </div>

      {/* Disruption Alert Banner if any failures exist */}
      {(brokenBuses.length > 0 || delayedBuses.length > 0) && (
        <div className="rounded-xl border border-[#A44735]/30 bg-[#F8ECE9] p-4 flex items-center gap-3 text-xs text-[#A44735] shadow-xs">
          <span className="text-xl">⚠️</span>
          <div>
            <span className="font-bold">Active Fleet Disruption Alerts: </span>
            <span>
              {brokenBuses.length > 0 && `${brokenBuses.length} vehicle(s) broken down. `}
              {delayedBuses.length > 0 && `${delayedBuses.length} trip(s) delayed.`}
            </span>
          </div>
        </div>
      )}

      {/* Corridor Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {corridorHealth.map(c => (
          <div key={c.id} className="rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2 text-[#25312D]">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                {c.id} Corridor
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  c.brokenCount > 0
                    ? 'bg-[#F8ECE9] text-[#A44735] border border-[#A44735]/40'
                    : c.delayedCount > 0
                    ? 'bg-[#F4EBD9] text-[#B88A43] border border-[#B88A43]/40'
                    : 'bg-[#EBF4F0] text-[#236B56] border border-[#236B56]/30'
                }`}
              >
                {c.onTimePercent === null ? 'No data' : `${c.onTimePercent}% on time`}
              </span>
            </div>
            <div className="text-[11px] text-[#53645F] truncate">{c.name}</div>
            <div className="flex items-center justify-between text-[11px] text-[#53645F] pt-2 border-t border-[#E8DFCE]">
              <span>{c.busesCount} assigned</span>
              {c.delayedCount > 0 && <span className="text-[#B88A43] font-bold">+{c.delayedCount} delayed</span>}
              {c.brokenCount > 0 && <span className="text-[#A44735] font-bold">+{c.brokenCount} failed</span>}
              {c.busesCount > 0 && c.delayedCount === 0 && c.brokenCount === 0 && (
                <span className="text-[#236B56] font-bold">Nominal</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fleet Overview & Table */}
      <div className="rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8DFCE] gap-2">
          <div>
            <h2 className="text-base font-bold text-[#25312D]">Fleet Telemetry Roster</h2>
            <p className="text-xs text-[#53645F]">Status and passenger load across simulated bus vehicles</p>
          </div>
          <div className="text-xs text-[#53645F] font-mono">
            {buses.length} vehicles registered
          </div>
        </div>

        {/* Metric Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-3 text-center">
            <div className="text-2xl font-black text-[#25312D]">{buses.length}</div>
            <div className="text-xs font-semibold text-[#53645F]">Total Fleet</div>
          </div>
          <div className="rounded-lg border border-[#236B56]/30 bg-[#EBF4F0] p-3 text-center">
            <div className="text-2xl font-black text-[#236B56]">{activeBuses.length}</div>
            <div className="text-xs font-semibold text-[#236B56]">Active Service</div>
          </div>
          <div className="rounded-lg border border-[#B88A43]/40 bg-[#F4EBD9] p-3 text-center">
            <div className="text-2xl font-black text-[#B88A43]">{spareBuses.length}</div>
            <div className="text-xs font-semibold text-[#B88A43]">Depot Spares</div>
          </div>
          <div className="rounded-lg border border-[#A44735]/40 bg-[#F8ECE9] p-3 text-center">
            <div className="text-2xl font-black text-[#A44735]">{brokenBuses.length}</div>
            <div className="text-xs font-semibold text-[#A44735]">Disrupted</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DFCE]">
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Bus ID (e.g. B-T01)…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-[#E8DFCE] rounded-lg px-3 py-2 bg-[#FFFFFF] focus:outline-none focus:border-[#173B32]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={routeFilter}
              onChange={e => setRouteFilter(e.target.value)}
              className="text-xs border border-[#E8DFCE] rounded-lg px-3 py-2 bg-[#FFFFFF] focus:outline-none"
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
              className="text-xs border border-[#E8DFCE] rounded-lg px-3 py-2 bg-[#FFFFFF] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="spare">Spare Only</option>
              <option value="broken_down">Broken Down</option>
            </select>
          </div>
        </div>

        {/* Bus Table */}
        <div className="overflow-x-auto rounded-lg border border-[#E8DFCE]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF7F2] border-b border-[#E8DFCE] text-[#53645F] font-bold">
              <tr>
                <th className="py-2.5 px-3">Vehicle ID</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Active Trip</th>
                <th className="py-2.5 px-3">Operational Status</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3">Schedule Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFCE]">
              {filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#53645F]">
                    No vehicles match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBuses.map(b => (
                  <tr key={b.bus_id} className="hover:bg-[#FAF7F2]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#25312D]">{b.bus_id}</td>
                    <td className="py-2.5 px-3 font-bold text-[#25312D]">{b.route_id || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[#53645F]">{b.trip_id || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusColor[b.status] || ''}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#E8DFCE] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              b.occupancy_percent > 80
                                ? 'bg-[#A44735]'
                                : b.occupancy_percent > 50
                                ? 'bg-[#B88A43]'
                                : 'bg-[#236B56]'
                            }`}
                            style={{ width: `${Math.min(b.occupancy_percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-[#53645F]">{b.occupancy_percent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {b.delay_minutes > 0 ? (
                        <span className="text-[#A44735] font-bold">+{b.delay_minutes} min delay</span>
                      ) : (
                        <span className="text-[#236B56] font-semibold">On Schedule</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disruption Simulation Trigger Panel */}
      <div ref={disruptionRef} className="rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#E8DFCE]">
          <h2 className="text-base font-bold text-[#25312D]">Simulate Operational Disruption</h2>
          <p className="text-xs text-[#53645F]">
            Inject operational incidents to evaluate algorithm recommendations and alternative responses
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#53645F] mb-1">Incident Type</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full text-xs border border-[#E8DFCE] rounded-lg px-3 py-2 bg-[#FFFFFF] focus:outline-none focus:border-[#173B32]"
            >
              <option value="breakdown">Mechanical Breakdown (Bus Failure)</option>
              <option value="delay">Corridor Delay (Congestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#53645F] mb-1">Target Active Vehicle</label>
            <select
              value={selectedBus}
              onChange={e => setSelectedBus(e.target.value)}
              disabled={activeBuses.length === 0}
              className="w-full text-xs border border-[#E8DFCE] rounded-lg px-3 py-2 bg-[#FFFFFF] focus:outline-none focus:border-[#173B32]"
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
              <label className="block text-xs font-semibold text-[#53645F] mb-1">Delay Duration (minutes)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={e => setDelayMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
                min={1}
                max={120}
                className="w-full text-xs border border-[#E8DFCE] rounded-lg px-3 py-2 font-mono bg-[#FFFFFF] focus:outline-none focus:border-[#173B32]"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDisrupt}
          disabled={simulating || !selectedBus}
          className="rounded-lg bg-[#A44735] px-4 py-2 text-xs font-bold text-white hover:bg-[#883626] disabled:opacity-50 transition-colors shadow-xs"
        >
          {simulating ? 'Evaluating Responses…' : 'Simulate Disruption & Compare Responses'}
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
        <div role="alert" className="rounded-xl border border-[#A44735]/30 bg-[#F8ECE9] p-4 text-xs font-semibold text-[#A44735]">
          <div className="font-bold">Simulation Notice</div>
          <div>{result.error}</div>
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-xl border border-[#A44735]/30 bg-[#F8ECE9] p-4 text-xs font-semibold text-[#A44735]">
          {actionError}
        </div>
      )}

      {actionMsg && (
        <div role="status" className="rounded-xl border border-[#236B56]/30 bg-[#EBF4F0] p-4 text-xs font-semibold text-[#236B56]">
          {actionMsg}
        </div>
      )}
    </div>
  )
}
