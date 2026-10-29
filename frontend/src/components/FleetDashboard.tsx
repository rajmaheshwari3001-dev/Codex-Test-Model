import { useState, useEffect } from 'react'
import type { BusState, DisruptionResult } from '../types'
import { getFleetState, triggerDisruption, approveResponse } from '../services/api'
import ScenarioComparison from './ScenarioComparison'

export default function FleetDashboard() {
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

  // Filtered list
  const filteredBuses = buses.filter(b => {
    if (routeFilter !== 'ALL' && b.route_id !== routeFilter) return false
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
    if (searchQuery && !b.bus_id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const uniqueRoutes = Array.from(new Set(buses.map(b => b.route_id).filter(Boolean))).sort()

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    spare: 'bg-amber-100 text-amber-900 border-amber-200',
    broken_down: 'bg-rose-100 text-rose-900 border-rose-200',
    reassigned: 'bg-blue-100 text-blue-900 border-blue-200',
  }

  // Corridor route health breakdown
  const corridorHealth = [
    { id: 'R01', name: 'Blue Line (Kashmere ↔ Rajiv)', color: '#2563eb' },
    { id: 'R02', name: 'Green Line (Rajiv ↔ Saket)', color: '#16a34a' },
    { id: 'R03', name: 'Red Line (CP ↔ Saket Loop)', color: '#dc2626' },
    { id: 'R04', name: 'Yellow Line (Rohini ↔ Kashmere)', color: '#eab308' },
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
      <div className="py-16 text-center text-sm font-semibold text-slate-500 flex items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading simulated fleet telemetry…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <section role="alert" className="app-panel space-y-3 border-l-4 border-l-rose-600 p-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Fleet telemetry unavailable</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{loadError}</p>
        </div>
        <button type="button" onClick={() => void loadFleet()} className="app-button-primary px-4 text-sm">
          Retry loading fleet
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simulation Transparency Banner */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">ℹ</span>
          <div>
            <div className="text-sm font-semibold text-emerald-950">Simulated fleet data</div>
            <div className="mt-0.5 text-xs text-emerald-900/80 sm:text-sm">
              Vehicles, incidents, and operational responses are generated by the local simulator.
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
          {simulated === true ? 'Simulated data' : simulated === false ? 'Live telemetry' : 'Status unavailable'}
        </span>
      </div>

      {/* Active Operational Alerts Banner */}
      {(brokenBuses.length > 0 || delayedBuses.length > 0) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm text-rose-950 shadow-xs">
          <span className="text-2xl" aria-hidden="true">🚨</span>
          <div>
            <span className="font-bold">Active Fleet Disruption Alerts: </span>
            <span>
              {brokenBuses.length > 0 && `${brokenBuses.length} vehicle(s) currently broken down. `}
              {delayedBuses.length > 0 && `${delayedBuses.length} trip(s) experiencing route delays.`}
            </span>
          </div>
        </div>
      )}

      {/* Corridor Route Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {corridorHealth.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: c.color }}>
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                {c.id} Corridor
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  c.busesCount === 0
                    ? 'border border-slate-200 bg-slate-50 text-slate-600'
                    : c.brokenCount > 0
                    ? 'bg-rose-100 text-rose-900 border border-rose-200'
                    : c.delayedCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                {c.onTimePercent === null ? 'No telemetry' : `${c.onTimePercent}% on time`}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-600 truncate">{c.name}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <span>{c.busesCount} assigned buses</span>
              {c.delayedCount > 0 && <span className="text-amber-800 font-bold">+{c.delayedCount} delayed</span>}
              {c.brokenCount > 0 && <span className="text-rose-800 font-bold">+{c.brokenCount} failed</span>}
              {c.busesCount > 0 && c.delayedCount === 0 && c.brokenCount === 0 && (
                <span className="text-emerald-800 font-bold">Nominal</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fleet Overview & Telemetry Cards */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-5 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Fleet Operations Telemetry</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Live monitoring of simulated transit rolling stock</p>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-400">
            {buses.length} vehicles registered across {uniqueRoutes.length} corridors
          </div>
        </div>

        {buses.length === 0 && (
          <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Fleet state loaded successfully, but the simulator returned no vehicles. Zero counts below reflect the returned data.
          </div>
        )}

        {/* Metric summary counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-slate-950">{buses.length}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Total Fleet</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-emerald-800">{activeBuses.length}</div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-900 mt-1">Active Service</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-amber-800">{spareBuses.length}</div>
            <div className="text-xs sm:text-sm font-semibold text-amber-900 mt-1">Depot Spares</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-rose-800">{brokenBuses.length}</div>
            <div className="text-xs sm:text-sm font-semibold text-rose-900 mt-1">Disrupted</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Bus ID (e.g. B-T01)…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] text-sm border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={routeFilter}
              onChange={e => setRouteFilter(e.target.value)}
              className="min-h-[42px] text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="min-h-[42px] text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="spare">Spare Only</option>
              <option value="broken_down">Broken Down</option>
            </select>
          </div>
        </div>

        {/* Bus Roster Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th scope="col" className="py-3 px-4">Vehicle ID</th>
                <th scope="col" className="py-3 px-4">Route</th>
                <th scope="col" className="py-3 px-4">Active Trip</th>
                <th scope="col" className="py-3 px-4">Operational Status</th>
                <th scope="col" className="py-3 px-4">Passenger Load</th>
                <th scope="col" className="py-3 px-4">Schedule Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    {buses.length === 0
                      ? 'The current fleet state contains no vehicles.'
                      : 'No vehicles match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredBuses.map(b => (
                  <tr key={b.bus_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.bus_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{b.route_id || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{b.trip_id || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          statusColor[b.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              b.occupancy_percent > 80
                                ? 'bg-rose-500'
                                : b.occupancy_percent > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(b.occupancy_percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-700">{b.occupancy_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {b.delay_minutes > 0 ? (
                        <span className="text-rose-700 font-bold font-mono">+{b.delay_minutes} min late</span>
                      ) : (
                        <span className="text-emerald-800 font-semibold">On Schedule</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disruption Simulator Trigger Panel */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
        <div className="pb-3.5 mb-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-950">Simulate Operational Disruption</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inject synthetic operational incidents to compute candidate countermeasure evaluations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Incident Type</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="breakdown">Mechanical Breakdown (Bus Failure)</option>
              <option value="delay">Corridor Delay (Congestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Target Active Vehicle</label>
            <select
              value={selectedBus}
              onChange={e => setSelectedBus(e.target.value)}
              disabled={activeBuses.length === 0}
              className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Delay Magnitude (minutes)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={e => setDelayMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
                min={1}
                max={120}
                className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDisrupt}
          disabled={simulating || !selectedBus}
          className="bg-rose-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-rose-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2"
        >
          {simulating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Evaluating Countermeasures…</span>
            </>
          ) : (
            <span>{activeBuses.length > 0 ? 'Simulate disruption & compare responses' : 'No active vehicles available'}</span>
          )}
        </button>
      </div>

      {/* Scenario Comparison Section */}
      {result && !result.error && (
        <ScenarioComparison
          result={result}
          onApprove={handleApprove}
          decisionMade={decisionMade}
          decisionPending={decisionPending}
        />
      )}

      {result?.error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-950 font-semibold">
          <div className="font-bold text-base mb-1">Simulation Error</div>
          <div>{result.error}</div>
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900">
          {actionError}
        </div>
      )}

      {actionMsg && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold text-blue-950 shadow-xs sm:text-sm"
        >
          <span aria-hidden="true" className="text-base text-blue-700">ℹ</span>
          <span>{actionMsg}</span>
        </div>
      )}
    </div>
  )
}
