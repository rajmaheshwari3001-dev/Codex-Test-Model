import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../types'

interface Props {
  stops: Stop[]
  routes: TRoute[]
  selectedJourney: JourneyOption | null
  originStopId?: string
  destinationStopId?: string
  onSelectOrigin?: (stopId: string) => void
  onSelectDestination?: (stopId: string) => void
}

function isValidCoord(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

export default function TransportMap({
  stops,
  routes,
  selectedJourney,
  originStopId,
  destinationStopId,
  onSelectOrigin,
  onSelectDestination,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('ALL')
  const [hasJourney, setHasJourney] = useState(false)

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([28.6139, 77.209], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 9,
    }).addTo(map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw Layers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    const validStops = stops.filter(s => isValidCoord(s.stop_lat, s.stop_lon))
    const stopsById = new Map(validStops.map(s => [s.stop_id, s]))

    // Map which routes serve each stop
    const routesByStopId = new Map<string, TRoute[]>()
    routes.forEach(route => {
      route.stops?.forEach(s => {
        const arr = routesByStopId.get(s.stop_id) || []
        if (!arr.some(r => r.route_id === route.route_id)) {
          arr.push(route)
        }
        routesByStopId.set(s.stop_id, arr)
      })
    })

    // 1. Draw all transit route polylines
    routes.forEach(route => {
      if (!route.stops || route.stops.length < 2) return
      const isFilteredIn = selectedRouteFilter === 'ALL' || selectedRouteFilter === route.route_id
      const validRoutePoints = route.stops
        .filter(s => isValidCoord(s.stop_lat, s.stop_lon))
        .map(s => [s.stop_lat, s.stop_lon] as [number, number])

      if (validRoutePoints.length >= 2) {
        const poly = L.polyline(validRoutePoints, {
          color: route.route_color || '#94a3b8',
          weight: isFilteredIn && selectedRouteFilter !== 'ALL' ? 6 : 3,
          opacity: isFilteredIn ? (selectedRouteFilter !== 'ALL' ? 0.95 : 0.4) : 0.1,
          dashArray: isFilteredIn && selectedRouteFilter !== 'ALL' ? undefined : '4, 4',
        })

        poly.bindTooltip(`Route ${route.route_name}`, { sticky: true })
        poly.addTo(lg)

        if (selectedRouteFilter === route.route_id && mapRef.current) {
          mapRef.current.fitBounds(poly.getBounds(), { padding: [40, 40] })
        }
      }
    })

    // 2. Draw all stops as standard network node markers with interactive popup
    validStops.forEach(s => {
      const isSelectedOrigin = s.stop_id === originStopId
      const isSelectedDest = s.stop_id === destinationStopId
      const servingRoutes = routesByStopId.get(s.stop_id) || []

      // Determine marker styling
      let radius = 5
      let color = '#64748b'
      let fillColor = '#cbd5e1'
      let fillOpacity = 0.8
      let weight = 1.5

      if (isSelectedOrigin) {
        radius = 8
        color = '#065f46'
        fillColor = '#10b981'
        fillOpacity = 1
        weight = 2.5
      } else if (isSelectedDest) {
        radius = 8
        color = '#991b1b'
        fillColor = '#ef4444'
        fillOpacity = 1
        weight = 2.5
      }

      const marker = L.circleMarker([s.stop_lat, s.stop_lon], {
        radius,
        color,
        fillColor,
        fillOpacity,
        weight,
      })

      // Tooltip for quick hover
      marker.bindTooltip(
        `<b>${s.stop_name}</b><br/><span style="font-size:10px;color:#64748b">Zone ${s.zone_id} • Stop ${s.stop_id}</span>`,
        { direction: 'top', offset: [0, -6] }
      )

      // Rich interactive Leaflet Popup on click
      const popupDiv = document.createElement('div')
      popupDiv.className = 'text-xs font-sans p-1 min-w-[180px]'
      popupDiv.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${s.stop_name}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Zone ${s.zone_id} • Stop ID: ${s.stop_id}</div>
        <div style="font-size: 10px; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #475569;">Serving Lines:</span>
          <div style="margin-top: 3px; display: flex; flex-wrap: wrap; gap: 3px;">
            ${
              servingRoutes.length > 0
                ? servingRoutes
                    .map(
                      r =>
                        `<span style="display:inline-block; padding: 1px 5px; border-radius: 4px; font-weight: 600; font-size: 10px; background-color: ${r.route_color || '#4f46e5'}18; color: ${r.route_color || '#4f46e5'}; border: 1px solid ${r.route_color || '#4f46e5'}40;">${r.route_name}</span>`
                    )
                    .join('')
                : '<span style="color:#94a3b8">Delhi Transit Stop</span>'
            }
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
          <button id="btn-orig-${s.stop_id}" type="button" style="padding: 4px 6px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: #059669; border: none; border-radius: 5px; cursor: pointer; text-align: center;">
            📍 Set Origin
          </button>
          <button id="btn-dest-${s.stop_id}" type="button" style="padding: 4px 6px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: #dc2626; border: none; border-radius: 5px; cursor: pointer; text-align: center;">
            🎯 Set Dest
          </button>
        </div>
      `

      marker.bindPopup(popupDiv)

      marker.on('popupopen', () => {
        const origBtn = document.getElementById(`btn-orig-${s.stop_id}`)
        const destBtn = document.getElementById(`btn-dest-${s.stop_id}`)

        if (origBtn && onSelectOrigin) {
          origBtn.onclick = () => {
            onSelectOrigin(s.stop_id)
            marker.closePopup()
          }
        }
        if (destBtn && onSelectDestination) {
          destBtn.onclick = () => {
            onSelectDestination(s.stop_id)
            marker.closePopup()
          }
        }
      })

      marker.addTo(lg)
    })

    // 3. Highlight selected journey path and key stops
    if (selectedJourney && selectedJourney.legs.length > 0) {
      setHasJourney(true)
      const journeyCoords: [number, number][] = []
      const boardStopId = selectedJourney.legs[0]?.board_stop_id
      const finalAlightStopId = selectedJourney.legs[selectedJourney.legs.length - 1]?.alight_stop_id
      const transferStopIds = new Set(selectedJourney.transfers.map(t => t.at_stop_id))

      selectedJourney.legs.forEach(leg => {
        const legStopIds = [
          leg.board_stop_id,
          ...(leg.intermediate_stop_ids || []),
          leg.alight_stop_id,
        ]

        const legCoords: [number, number][] = []
        legStopIds.forEach(stopId => {
          const stopObj = stopsById.get(stopId)
          if (stopObj && isValidCoord(stopObj.stop_lat, stopObj.stop_lon)) {
            legCoords.push([stopObj.stop_lat, stopObj.stop_lon])
          }
        })

        if (legCoords.length >= 2) {
          // Glow shadow under active line
          L.polyline(legCoords, {
            color: leg.route_color || '#4f46e5',
            weight: 8,
            opacity: 0.35,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: leg.route_color || '#4f46e5',
            weight: 4.5,
            opacity: 0.95,
          })
            .bindTooltip(`${leg.route_name} (${leg.departure_time} - ${leg.arrival_time})`, {
              sticky: true,
            })
            .addTo(lg)

          journeyCoords.push(...legCoords)
        }
      })

      // Key Stop Markers on Selected Journey
      validStops.forEach(s => {
        if (s.stop_id === boardStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8.5,
            color: '#065f46',
            fillColor: '#10b981',
            fillOpacity: 1,
            weight: 3,
          })
            .bindTooltip(`🟢 <b>Origin: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -10],
            })
            .addTo(lg)
        } else if (s.stop_id === finalAlightStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8.5,
            color: '#991b1b',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 3,
          })
            .bindTooltip(`🔴 <b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -10],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 7.5,
            color: '#5b21b6',
            fillColor: '#8b5cf6',
            fillOpacity: 1,
            weight: 2.5,
          })
            .bindTooltip(`🔄 <b>Transfer: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -9],
            })
            .addTo(lg)
        }
      })

      // Auto-fit bounds
      if (journeyCoords.length >= 2 && selectedRouteFilter === 'ALL') {
        mapRef.current.fitBounds(L.latLngBounds(journeyCoords.map(c => L.latLng(c[0], c[1]))), {
          padding: [50, 50],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
      // Fit all stops when no journey is selected and no single corridor is filtered
      if (validStops.length > 0 && selectedRouteFilter === 'ALL') {
        const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
        mapRef.current.fitBounds(L.latLngBounds(allCoords), {
          padding: [30, 30],
        })
      }
    }
  }, [stops, routes, selectedJourney, selectedRouteFilter, originStopId, destinationStopId, onSelectOrigin, onSelectDestination])

  function handleResetView() {
    setSelectedRouteFilter('ALL')
    if (!mapRef.current) return
    const validStops = stops.filter(s => isValidCoord(s.stop_lat, s.stop_lon))
    if (validStops.length > 0) {
      const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
      mapRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [30, 30],
      })
    } else {
      mapRef.current.setView([28.6139, 77.209], 12)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden relative">
      {/* Top Floating Controls: Corridor Filter & Network Reset */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Corridor Filter Badges */}
        <div className="flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs pointer-events-auto">
          <span className="text-[10px] font-bold text-gray-500 uppercase px-1">Corridors:</span>
          <button
            type="button"
            onClick={() => setSelectedRouteFilter('ALL')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              selectedRouteFilter === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {routes.map(r => (
            <button
              key={r.route_id}
              type="button"
              onClick={() => setSelectedRouteFilter(r.route_id)}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                selectedRouteFilter === r.route_id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: r.route_color || '#4f46e5' }}
              />
              <span>{r.route_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs pointer-events-auto">
          <button
            type="button"
            onClick={handleResetView}
            className="px-2.5 py-1 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded font-medium transition-colors"
            title="Reset network view"
          >
            Reset View
          </button>
          {hasJourney && (
            <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
              Active Path
            </span>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-[400px] sm:h-[460px] z-10"
        aria-label="Interactive Transit Map"
        role="region"
      />

      {/* Map Footer Provenance Note & Interactive Legend */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-medium text-emerald-800">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Origin
          </span>
          <span className="flex items-center gap-1 font-medium text-rose-800">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
            Destination
          </span>
          <span className="flex items-center gap-1 font-medium text-purple-800">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" />
            Transfer
          </span>
          <span className="text-gray-400">| Click any stop marker to set origin/destination</span>
        </div>
        <span className="text-gray-400">
          OpenStreetMap tiles • Real GPS Coordinates • Deterministic Timetable
        </span>
      </div>
    </div>
  )
}
