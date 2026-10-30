import { useEffect, useState } from 'react'
import { getDataProvenance, refreshTransitData } from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface ProvenanceData {
  application: string
  version: string
  last_pipeline_run?: string
  datasets?: {
    delhi_buses?: {
      source: string
      transport_mode: string
      fare_rules: string
    }
    delhi_metro?: {
      source: string
      transport_mode: string
      fare_rules: string
    }
  }
  metrics?: {
    total_stations_and_stops: number
    total_transit_routes: number
    total_scheduled_trips: number
    total_stop_times: number
    total_verified_tariffs: number
    total_multimodal_interchanges: number
  }
}

export default function DataProvenanceModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<ProvenanceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      getDataProvenance()
        .then(res => setData(res))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshMsg('')
    try {
      const res = await refreshTransitData(false)
      setRefreshMsg('Pipeline normalized & reloaded successfully!')
      const updated = await getDataProvenance()
      setData(updated)
    } catch (err: unknown) {
      setRefreshMsg(err instanceof Error ? err.message : 'Pipeline refresh failed')
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(''), 4000)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E8DFCE] bg-[#FFFFFF] p-6 shadow-2xl text-[#25312D] space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8DFCE] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#173B32] px-2 py-0.5 text-xs font-bold text-white">
                Transit Data Pipeline
              </span>
              <span className="rounded-md border border-[#236B56]/30 bg-[#EBF4F0] px-2 py-0.5 text-xs font-semibold text-[#236B56]">
                Delhi NCR Grounded
              </span>
            </div>
            <h2 className="text-xl font-black text-[#173B32]">
              Real-World Data Sources & Provenance
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#53645F] hover:bg-[#FAF7F2] hover:text-[#25312D]"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 text-center text-sm text-[#53645F]">
            Loading transit metadata & provenance...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Pipeline Overview Banner */}
            <div className="rounded-xl border border-[#E8DFCE] bg-[#FAF7F2] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#173B32] text-sm">
                  {data?.application || 'Aaroh-Saarthi Delhi Multimodal Engine'}
                </span>
                <span className="font-mono text-[11px] text-[#53645F]">
                  v{data?.version || '2.1.0'}
                </span>
              </div>
              <p className="text-[#53645F] text-[11px] leading-relaxed">
                Ingests official GTFS feeds and published fare schedules for Delhi Buses (DTC) and Delhi Metro (DMRC), computing verified multimodal journey graphs without fabricated coordinates.
              </p>
              {data?.last_pipeline_run && (
                <div className="text-[10px] text-[#53645F] font-mono">
                  Last Normalized: {new Date(data.last_pipeline_run).toLocaleString()}
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            {data?.metrics && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-[#53645F] text-[11px] mb-2">
                  Network Ingestion Metrics
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-2.5">
                    <div className="text-base font-extrabold text-[#173B32]">
                      {data.metrics.total_stations_and_stops}
                    </div>
                    <div className="text-[10px] text-[#53645F]">Stations & Stops</div>
                  </div>
                  <div className="rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-2.5">
                    <div className="text-base font-extrabold text-[#173B32]">
                      {data.metrics.total_scheduled_trips}
                    </div>
                    <div className="text-[10px] text-[#53645F]">Scheduled Trips</div>
                  </div>
                  <div className="rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-2.5">
                    <div className="text-base font-extrabold text-[#173B32]">
                      {data.metrics.total_multimodal_interchanges}
                    </div>
                    <div className="text-[10px] text-[#53645F]">Interchanges</div>
                  </div>
                </div>
              </div>
            )}

            {/* Ingested Sources */}
            <div>
              <h3 className="font-bold uppercase tracking-wider text-[#53645F] text-[11px] mb-2">
                Verified Ingestion Sources
              </h3>
              <div className="space-y-2">
                {/* 1. Delhi Transport Stack */}
                <div className="rounded-lg border border-[#E8DFCE] p-3 space-y-1 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#25312D] flex items-center gap-1.5">
                      <span>🏛️</span> Delhi Transport Stack (Primary Source)
                    </div>
                    <a
                      href="https://delhi.transportstack.in/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-[#236B56] hover:underline"
                    >
                      delhi.transportstack.in ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-[#53645F]">
                    REST API endpoints for Dataset 1 (Delhi Buses GTFS) and Dataset 2 (Delhi Metro GTFS Static).
                  </p>
                </div>

                {/* 2. DTC Official Schedules & Tariffs */}
                <div className="rounded-lg border border-[#E8DFCE] p-3 space-y-1 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#25312D] flex items-center gap-1.5">
                      <span>🚍</span> Delhi Transport Corporation (DTC)
                    </div>
                    <a
                      href="https://dtc.delhi.gov.in/dtc/services-and-time-table"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-[#236B56] hover:underline"
                    >
                      dtc.delhi.gov.in ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-[#53645F]">
                    Official distance stages: Non-AC (₹5 / ₹10 / ₹15), AC (₹10 / ₹15 / ₹20 / ₹25), Pink Ticket free pass scheme for women.
                  </p>
                </div>

                {/* 3. DMRC Official Metro Tariffs */}
                <div className="rounded-lg border border-[#E8DFCE] p-3 space-y-1 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#25312D] flex items-center gap-1.5">
                      <span>🚇</span> Delhi Metro Rail Corporation (DMRC)
                    </div>
                    <a
                      href="https://delhimetrorail.com/fare"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-[#236B56] hover:underline"
                    >
                      delhimetrorail.com ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-[#53645F]">
                    6 official distance tariff slabs (₹11 to ₹64). Sunday concessions and 10%–20% smart card off-peak discounts.
                  </p>
                </div>

                {/* 4. Delhi Open Transit Data (OTD) */}
                <div className="rounded-lg border border-[#E8DFCE] p-3 space-y-1 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#25312D] flex items-center gap-1.5">
                      <span>📡</span> Delhi Open Transit Data (OTD)
                    </div>
                    <a
                      href="https://otd.delhi.gov.in/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-[#236B56] hover:underline"
                    >
                      otd.delhi.gov.in ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-[#53645F]">
                    GTFS static specifications audited. Note: Real-time Protobuf API (<code>VehiclePositions.pb</code>) requires registered developer API key.
                  </p>
                </div>

                {/* 5. Poochh-O (DIMTS) Auto & Taxi Model */}
                <div className="rounded-lg border border-[#E8DFCE] p-3 space-y-1 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#25312D] flex items-center gap-1.5">
                      <span>🛺</span> Poochh-O (DIMTS) Auto-Rickshaw & Taxi
                    </div>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.dimts.delhiautojunction"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-[#B88A43] hover:underline"
                    >
                      com.dimts.delhiautojunction ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-[#53645F]">
                    Statutory Delhi Government meter tariffs: Auto (₹30 for first 1.5 km + ₹11/km), Taxi (₹40 for first 1.0 km + ₹17-₹20/km), 25% night charge (23:00-05:00), and first/last-mile feeder intelligence.
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Refresh Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFCE] pt-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-lg bg-[#173B32] px-4 py-2 font-bold text-white hover:bg-[#236B56] transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Normalizing Network Data...' : '⚡ Re-Normalize Transit Pipeline'}
              </button>
              {refreshMsg && (
                <span className="font-semibold text-[#236B56] text-xs">
                  {refreshMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

