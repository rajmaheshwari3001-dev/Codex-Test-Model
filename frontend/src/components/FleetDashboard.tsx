import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BusState, DisruptionResult } from '../types'
import { getFleetState, triggerDisruption, approveResponse } from '../services/api'
import ScenarioComparison from './ScenarioComparison'
import { AlertTriangleIcon, InfoIcon } from './common/Icons'

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
      {/* Simulation Transparency Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#EBE5DC] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <InfoIcon className="w-4 h-4 text-[#C49A43] shrink-0" />
          <div>
            <div className="text-xs font-bold text-[#1A202C]">Simulated Fleet Telemetry Active</div>
            <div className="text-[11px] text-[#7A7269]">
              Vehicles, corridors, and mitigation dispatches are generated deterministically by the Aaroh-Saarthi engine.
            </div>
          </div>
        </div>
        <span className="rounded-full border border-[#EBE5DC] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#1A2E3B]">
          {simulated === true ? 'Simulated Model' : 'Local Telemetry'}
        </span>
      </div>

      {/* Disruption Alert Banner if any failures exist */}
      {(brokenBuses.length > 0 || delayedBuses.length > 0) && (
        <div className="rounded-2xl border border-[#F8B4B4] bg-[#FDE8E8] p-4 flex items-center gap-3 text-xs text-[#9B1C1C] shadow-xs">
          <AlertTriangleIcon className="w-5 h-5 shrink-0 text-[#9B1C1C]" />
          <div>
            <span className="font-bold">Active Corridor Disruption Alerts: </span>
            <span>
              {brokenBuses.length > 0 && `${brokenBuses.length} vehicle(s) broken down. `}
              {delayedBuses.length > 0 && `${delayedBuses.length} trip(s) delayed.`}
            </span>
          </div>
        </div>
      )}

      {/* Corridor Health Summary Cards */}
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

      {/* Fleet Overview & Table */}
      <div className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EBE5DC] gap-2">
          <div className="space-y-1">
            <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
              LIVE ROSTER
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B]">Fleet Telemetry Roster</h2>
            <p className="text-xs sm:text-sm text-[#7A7269] leading-relaxed">Real-time operational status, position, and passenger crowding across vehicles</p>
          </div>
          <div className="text-xs sm:text-sm text-[#7A7269] font-mono">
            {buses.length} vehicles registered
          </div>
        </div>

        {/* Metric Summary Counters Matching Figma Palette */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] p-3 text-center">
            <div className="text-2xl font-black text-[#1A2E3B]">{buses.length}</div>
            <div className="text-xs font-semibold text-[#7A7269]">Total Fleet</div>
          </div>
          <div className="rounded-xl border border-[#D1E7D5] bg-[#EAF5EC] p-3 text-center">
            <div className="text-2xl font-black text-[#2E7D32]">{activeBuses.length}</div>
            <div className="text-xs font-semibold text-[#2E7D32]">Active Service</div>
          </div>
          <div className="rounded-xl border border-[#F0E2C2] bg-[#FAF0D9] p-3 text-center">
            <div className="text-2xl font-black text-[#A67C1E]">{spareBuses.length}</div>
            <div className="text-xs font-semibold text-[#A67C1E]">Depot Spares</div>
          </div>
          <div className="rounded-xl border border-[#F8B4B4] bg-[#FDE8E8] p-3 text-center">
            <div className="text-2xl font-black text-[#9B1C1C]">{brokenBuses.length}</div>
            <div className="text-xs font-semibold text-[#9B1C1C]">Disrupted</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE5DC]">
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Bus ID (e.g. B-T01)…"
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
            </select>
          </div>
        </div>

        {/* Bus Table */}
        <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF7F2] border-b border-[#EBE5DC] text-[#7A7269] font-bold">
              <tr>
                <th className="py-2.5 px-3">Vehicle ID</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Active Trip</th>
                <th className="py-2.5 px-3">Operational Status</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3">Schedule Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE5DC]">
              {filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#7A7269]">
                    No vehicles match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBuses.map(b => (
                  <tr key={b.bus_id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A2E3B]">{b.bus_id}</td>
                    <td className="py-2.5 px-3 font-bold text-[#1A2E3B]">{b.route_id || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[#7A7269]">{b.trip_id || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeStyle[b.status] || ''}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#EBE5DC] rounded-full h-1.5 overflow-hidden">
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
                        <span className="text-[#9B1C1C] font-bold">+{b.delay_minutes} min delay</span>
                      ) : (
                        <span className="text-[#2E7D32] font-semibold">On Schedule</span>
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
      <div ref={disruptionRef} className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#EBE5DC] space-y-1">
          <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
            INCIDENT CONTROL
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B]">Simulate Operational Disruption</h2>
          <p className="text-xs sm:text-sm text-[#7A7269] leading-relaxed">
            Inject operational incidents to evaluate algorithm dispatch recommendations and alternative fleet mitigation plans
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#7A7269] mb-1">Incident Type</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full text-xs border border-[#EBE5DC] rounded-xl px-3 py-2 bg-white text-[#1A202C] focus:outline-none focus:border-[#C49A43] cursor-pointer"
            >
              <option value="breakdown">Mechanical Breakdown (Bus Failure)</option>
              <option value="delay">Corridor Delay (Congestion)</option>
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
          onClick={handleDisrupt}
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
