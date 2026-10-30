import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import type { BusState } from '../../types'

interface Props {
  buses: BusState[]
  selectedBusId?: string
  onSelectBus?: (busId: string) => void
  onTriggerDisruptionForBus?: (busId: string, defaultType?: string) => void
}

// Canonical station waypoints for corridors
const CORRIDOR_R01: [number, number][] = [
  [28.5529, 77.0583], // Dwarka Sec 21
  [28.6296, 77.0815], // Janakpuri
  [28.6491, 77.1221], // Rajouri Garden
  [28.6328, 77.2197], // Rajiv Chowk
  [28.6258, 77.2342], // Mandi House
  [28.6469, 77.3160], // Anand Vihar
]

const CORRIDOR_R02: [number, number][] = [
  [28.6674, 77.2289], // Kashmere Gate
  [28.6425, 77.2193], // New Delhi Stn
  [28.6328, 77.2197], // Rajiv Chowk
  [28.5672, 77.2100], // AIIMS
  [28.5494, 77.2001], // Hauz Khas
]

const CORRIDOR_R03: [number, number][] = [
  [28.6315, 77.2167], // CP
  [28.6129, 77.2295], // India Gate
  [28.5888, 77.2544], // Sarai Kale Khan
  [28.5700, 77.2400], // Lajpat Nagar
  [28.5672, 77.2100], // AIIMS
  [28.5910, 77.1610], // Dhaula Kuan
  [28.6296, 77.0815], // Janakpuri
]

const CORRIDOR_R04: [number, number][] = [
  [28.6425, 77.2193], // New Delhi Stn
  [28.6328, 77.2197], // Rajiv Chowk
  [28.5744, 77.2105], // INA
  [28.5672, 77.2100], // AIIMS
  [28.5224, 77.2015], // Saket
]

// Fallback coordinate generator for buses along their assigned corridors
function getBusCoordinate(bus: BusState, index: number): [number, number] {
  if (bus.lat && bus.lon && !isNaN(bus.lat) && !isNaN(bus.lon) && bus.lat > 20) {
    return [bus.lat, bus.lon]
  }

  if (bus.status === 'spare') {
    if (bus.bus_id === 'B-SPARE-1') return [28.6674, 77.2289] // Kashmere Gate Depot
    return [28.5529, 77.0583] // Dwarka Depot
  }

  // Derive from route corridor
  const corridors: Record<string, [number, number][]> = {
    R01: CORRIDOR_R01,
    R02: CORRIDOR_R02,
    R03: CORRIDOR_R03,
    R04: CORRIDOR_R04,
  }

  const corridor = corridors[bus.route_id] || CORRIDOR_R01
  const ptIndex = index % corridor.length
  const base = corridor[ptIndex]

  // Add small deterministic jitter so overlapping buses remain distinct
  const offsetLat = ((index * 7) % 11 - 5) * 0.003
  const offsetLon = ((index * 13) % 11 - 5) * 0.003

  return [base[0] + offsetLat, base[1] + offsetLon]
}

export default function FleetMap({
  buses,
  selectedBusId,
  onSelectBus,
  onTriggerDisruptionForBus,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const [mapStyle, setMapStyle] = useState<'streets' | 'hot' | 'dark' | 'satellite'>('streets')
  const [filterMode, setFilterMode] = useState<'ALL' | 'active' | 'spare' | 'broken_down'>('ALL')
  const [showCorridors, setShowCorridors] = useState(true)

  // Expose bus disruption trigger to window for Leaflet HTML popups
  useEffect(() => {
    ;(window as unknown as { __triggerFleetDisrupt?: (id: string, type: string) => void }).__triggerFleetDisrupt = (
      id: string,
      type: string
    ) => {
      onTriggerDisruptionForBus?.(id, type)
    }

    return () => {
      delete (window as unknown as { __triggerFleetDisrupt?: (id: string, type: string) => void }).__triggerFleetDisrupt
    }
  }, [onTriggerDisruptionForBus])

  // Tile layer updater using 100% free watermark-free Esri & OSM tile services
  const updateTiles = useCallback((style: 'streets' | 'hot' | 'dark' | 'satellite', map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    let attribution = '&copy; Esri, HERE, Garmin'
    let maxZoom = 19

    if (style === 'hot') {
      url = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      attribution = '&copy; OpenStreetMap contributors, Humanitarian OSM Team'
      maxZoom = 19
    } else if (style === 'dark') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      attribution = '&copy; Esri, DeLorme, NAVTEQ'
      maxZoom = 16
    } else if (style === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      attribution = '&copy; Esri, Maxar, Earthstar Geographics'
      maxZoom = 18
    }

    const newLayer = L.tileLayer(url, { attribution, maxZoom, minZoom: 9 }).addTo(map)
    tileLayerRef.current = newLayer
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([28.615, 77.215], 11)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    updateTiles(mapStyle, map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapStyle, updateTiles])

  // Update Map Layer
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    // 1. Draw Fleet Corridors
    if (showCorridors) {
      const corridorsData = [
        { name: 'R01 (Dwarka ↔ Anand Vihar)', color: '#C49A43', pts: CORRIDOR_R01 },
        { name: 'R02 (Kashmere ↔ Hauz Khas)', color: '#00A651', pts: CORRIDOR_R02 },
        { name: 'R03 (Mudrika Ring Expressway)', color: '#E31B23', pts: CORRIDOR_R03 },
        { name: 'R04 (Yellow Express New Delhi ↔ Saket)', color: '#E5A800', pts: CORRIDOR_R04 },
      ]

      corridorsData.forEach(c => {
        L.polyline(c.pts, {
          color: c.color,
          weight: 4,
          opacity: 0.65,
          dashArray: '6, 6',
        }).addTo(lg)
      })
    }

    // 2. Depot Hub Markers
    const depots = [
      { name: 'Kashmere Gate ISBT Depot', coord: [28.6674, 77.2289] as [number, number], code: 'DEPOT-NORTH' },
      { name: 'Dwarka Sector 21 Depot', coord: [28.5529, 77.0583] as [number, number], code: 'DEPOT-WEST' },
    ]

    depots.forEach(d => {
      const depotIcon = L.divIcon({
        className: 'fleet-depot-marker',
        html: `
          <div style="background: #1A2E3B; color: #FFF; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; border: 1.5px solid #C49A43; white-space: nowrap; transform: translate(-50%, -100%); margin-top: -4px;">
            DEPOT • ${d.name}
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(d.coord, { icon: depotIcon }).addTo(lg)
    })

    // 3. Vehicles
    const visibleBuses = buses.filter(b => {
      if (filterMode === 'ALL') return true
      if (filterMode === 'active') return b.status === 'active'
      if (filterMode === 'spare') return b.status === 'spare'
      if (filterMode === 'broken_down') return b.status === 'broken_down'
      return true
    })

    visibleBuses.forEach((bus, i) => {
      const coord = getBusCoordinate(bus, i)
      const isSelected = selectedBusId === bus.bus_id
      const isBroken = bus.status === 'broken_down'
      const isSpare = bus.status === 'spare'
      const isReassigned = bus.status === 'reassigned'
      const isDelayed = bus.delay_minutes > 0

      let bgColor = '#2E7D32' // Active on-time
      let statusLabel = 'ACTIVE'

      if (isBroken) {
        bgColor = '#9B1C1C'
        statusLabel = 'FAILED'
      } else if (isSpare) {
        bgColor = '#1A2E3B'
        statusLabel = 'SPARE'
      } else if (isReassigned) {
        bgColor = '#A67C1E'
        statusLabel = 'DIVERTED'
      } else if (isDelayed) {
        bgColor = '#A67C1E'
        statusLabel = `+${bus.delay_minutes}m`
      }

      const iconHtml = `
        <div style="position: absolute; transform: translate(-50%, -50%); cursor: pointer; pointer-events: auto; font-family: 'Ubuntu', -apple-system, sans-serif;">
          ${
            isBroken
              ? '<div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(155,28,28,0.4); animation: pulseGlow 1.4s infinite ease-out;"></div>'
              : ''
          }
          <div style="
            background: ${bgColor};
            color: #FFFFFF;
            padding: ${isSelected ? '5px 11px' : '3px 8px'};
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 5px;
            border: ${isSelected ? '2.5px solid #FFD700' : '2px solid #FFFFFF'};
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            white-space: nowrap;
          ">
            <span style="font-weight: 800; background: rgba(255,255,255,0.25); border-radius: 4px; padding: 0 4px; font-size: 10px;">${isBroken ? '!' : isSpare ? 'P' : 'B'}</span>
            <span style="font-family: 'Ubuntu', sans-serif; font-weight: 700; letter-spacing: -0.2px;">${bus.bus_id}</span>
            <span style="font-size: 9px; opacity: 0.95; background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 999px; font-family: 'Ubuntu', sans-serif; font-weight: 700;">
              ${statusLabel}
            </span>
          </div>
        </div>
      `

      const marker = L.marker(coord, {
        icon: L.divIcon({
          className: `fleet-bus-marker-${bus.bus_id}`,
          html: iconHtml,
          iconSize: [0, 0],
        }),
      }).addTo(lg)

      // Interactive Telemetry Popup
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; min-width: 240px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #EDE8E1; padding-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #C49A43; text-transform: uppercase; letter-spacing: 0.5px;">
              ${bus.vehicle_type || 'Tata Starbus EV'}
            </span>
            <span style="font-size: 10px; font-weight: 700; padding: 1.5px 7px; border-radius: 999px; background: ${bgColor}; color: #FFF; font-family: 'Ubuntu', sans-serif;">
              ${bus.status.toUpperCase()}
            </span>
          </div>
          <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #1A2E3B; margin-top: 6px;">
            Vehicle ${bus.bus_id}
          </div>
          <div style="font-size: 11.5px; color: #7A7269; margin-top: 8px; line-height: 1.6;">
            <div>Corridor: <strong style="color: #1A2E3B; font-weight: 700;">${bus.route_id || 'Depot Reserve'}</strong> • Trip: <span style="font-family: 'Ubuntu', sans-serif; font-weight: 600;">${bus.trip_id || '—'}</span></div>
            <div>Speed: <strong style="color: #1A2E3B; font-family: 'Ubuntu', sans-serif; font-weight: 700;">${bus.speed_kmh || (isBroken ? 0 : 28)} km/h</strong> • Battery SoC: <strong style="color: #2E7D32; font-family: 'Ubuntu', sans-serif; font-weight: 700;">${bus.battery_level || 82}%</strong></div>
            <div>Passenger Occupancy: <strong style="color: #1A2E3B; font-family: 'Ubuntu', sans-serif; font-weight: 700;">${bus.occupancy_percent}% (${Math.round(bus.occupancy_percent * 0.5)}/50)</strong></div>
            <div>Driver ID: <span style="font-family: 'Ubuntu', sans-serif; font-weight: 600; color: #1A2E3B;">${bus.driver_id || 'DTC-D104'}</span></div>
            <div>Schedule: ${
              bus.delay_minutes > 0
                ? `<strong style="color: #9B1C1C; font-family: 'Ubuntu', sans-serif; font-weight: 700;">+${bus.delay_minutes} min behind schedule</strong>`
                : '<strong style="color: #2E7D32; font-weight: 700;">On Schedule (Nominal)</strong>'
            }</div>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 12px; border-top: 1px solid #EDE8E1; padding-top: 10px;">
            <button
              onclick="window.__triggerFleetDisrupt && window.__triggerFleetDisrupt('${bus.bus_id}', 'breakdown')"
              style="flex: 1; padding: 6px 10px; font-size: 11px; font-weight: 700; background: #FDE8E8; color: #9B1C1C; border: 1px solid #F8B4B4; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
            >
              Simulate Failure
            </button>
            <button
              onclick="window.__triggerFleetDisrupt && window.__triggerFleetDisrupt('${bus.bus_id}', 'delay')"
              style="flex: 1; padding: 6px 10px; font-size: 11px; font-weight: 700; background: #FAF0D9; color: #A67C1E; border: 1px solid #F0E2C2; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
            >
              Simulate Delay
            </button>
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)
      marker.on('click', () => onSelectBus?.(bus.bus_id))
    })
  }, [buses, filterMode, selectedBusId, showCorridors, onSelectBus])

  const handleFitFleet = () => {
    if (!mapRef.current) return
    mapRef.current.fitBounds(
      L.latLngBounds([
        [28.5529, 77.0583], // Dwarka
        [28.6674, 77.2289], // Kashmere Gate
        [28.5641, 77.3341], // Noida
      ]),
      { padding: [50, 50], maxZoom: 12 }
    )
  }

  const handleCenterDelhi = () => {
    if (!mapRef.current) return
    mapRef.current.setView([28.615, 77.215], 11, { animate: true })
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#EBE5DC] bg-white shadow-xs relative flex flex-col h-[480px] sm:h-[560px] animate-fade-in map-tiles-${mapStyle}`}>
      {/* Floating Top Control HUD */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Quick Vehicle Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE5DC] bg-white/95 p-1 shadow-md backdrop-blur-md pointer-events-auto">
          {(
            [
              { id: 'ALL', label: `All (${buses.length})` },
              { id: 'active', label: `Active (${buses.filter(b => b.status === 'active').length})` },
              { id: 'spare', label: `Spares (${buses.filter(b => b.status === 'spare').length})` },
              { id: 'broken_down', label: `Failed (${buses.filter(b => b.status === 'broken_down').length})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-[#1A2E3B] text-white shadow-2xs'
                  : 'text-[#7A7269] hover:text-[#1A2E3B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Map Controls & Corridors */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE5DC] bg-white/95 p-1 shadow-md backdrop-blur-md pointer-events-auto">
          {/* Basemap Styles */}
          <div className="flex rounded-lg bg-[#FAF7F2] p-0.5 border border-[#EBE5DC]">
            <button
              type="button"
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'streets'
                  ? 'bg-white text-[#1A2E3B] shadow-2xs'
                  : 'text-[#7A7269] hover:text-[#1A2E3B]'
              }`}
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('hot')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'hot'
                  ? 'bg-white text-[#1A2E3B] shadow-2xs'
                  : 'text-[#7A7269] hover:text-[#1A2E3B]'
              }`}
            >
              Pastel
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'dark'
                  ? 'bg-[#1A2E3B] text-white shadow-2xs'
                  : 'text-[#7A7269] hover:text-[#1A2E3B]'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'text-[#7A7269] hover:text-[#1A2E3B]'
              }`}
            >
              Aerial
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCorridors(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              showCorridors ? 'bg-[#FAF0D9] text-[#A67C1E]' : 'text-[#7A7269]'
            }`}
          >
            Corridors
          </button>

          <button
            type="button"
            onClick={handleFitFleet}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#1A2E3B] hover:bg-[#FAF7F2] cursor-pointer"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={handleCenterDelhi}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#1A2E3B] hover:bg-[#FAF7F2] cursor-pointer"
          >
            Delhi
          </button>
        </div>
      </div>

      {/* Floating Bottom Legend */}
      <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-3 rounded-xl border border-[#EBE5DC] bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md pointer-events-auto text-[11px] font-bold text-[#1A2E3B]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
          <span>Active EV</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1A2E3B]" />
          <span>Depot Spare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9B1C1C]" />
          <span>Broken Down</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A67C1E]" />
          <span>Delayed</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={containerRef} className="w-full h-full flex-1" />
    </div>
  )
}
