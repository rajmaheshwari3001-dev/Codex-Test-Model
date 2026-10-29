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
      zoomControl: false, // Custom zoom button placement
      scrollWheelZoom: true,
    }).setView([28.6139, 77.209], 12)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

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
          color: route.route_color || '#2563eb',
          weight: isFilteredIn && selectedRouteFilter !== 'ALL' ? 6 : 3.5,
          opacity: isFilteredIn ? (selectedRouteFilter !== 'ALL' ? 1.0 : 0.45) : 0.12,
          dashArray: isFilteredIn && selectedRouteFilter !== 'ALL' ? undefined : '5, 5',
        })

        poly.bindTooltip(`Route ${route.route_name}`, { sticky: true })
        poly.addTo(lg)

        if (selectedRouteFilter === route.route_id && mapRef.current) {
          mapRef.current.fitBounds(poly.getBounds(), { padding: [45, 45] })
        }
      }
    })

    // 2. Draw all stops as standard network node markers with interactive popup
    validStops.forEach(s => {
      const isSelectedOrigin = s.stop_id === originStopId
      const isSelectedDest = s.stop_id === destinationStopId
      const servingRoutes = routesByStopId.get(s.stop_id) || []

      let radius = 6
      let color = '#334155'
      let fillColor = '#e2e8f0'
      let fillOpacity = 0.9
      let weight = 2

      if (isSelectedOrigin) {
        radius = 10
        color = '#064e3b'
        fillColor = '#10b981'
        fillOpacity = 1
        weight = 3.5
      } else if (isSelectedDest) {
        radius = 10
        color = '#881337'
        fillColor = '#ef4444'
        fillOpacity = 1
        weight = 3.5
      }

      const marker = L.circleMarker([s.stop_lat, s.stop_lon], {
        radius,
        color,
        fillColor,
        fillOpacity,
        weight,
      })

      marker.bindTooltip(
        `<div style="font-family: inherit;"><b>${s.stop_name}</b><br/><span style="font-size:11px;color:#64748b">Zone ${s.zone_id} • Stop ${s.stop_id}</span></div>`,
        { direction: 'top', offset: [0, -7] }
      )

      // Rich interactive Transit Stop Card in Popup
      const popupDiv = document.createElement('div')
      popupDiv.className = 'text-xs font-sans p-1 min-w-[210px]'
      popupDiv.innerHTML = `
        <div style="font-family: inherit;">
          <div style="font-weight: 900; font-size: 15px; color: #0f172a; margin-bottom: 2px;">${s.stop_name}</div>
          <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px;">Zone ${s.zone_id} • Node ${s.stop_id}</div>
          <div style="font-size: 11px; margin-bottom: 10px;">
            <span style="font-weight: 700; color: #334155;">Connected Lines:</span>
            <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${
                servingRoutes.length > 0
                  ? servingRoutes
                      .map(
                        r =>
                          `<span style="display:inline-block; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; background-color: ${r.route_color || '#2563eb'}20; color: ${r.route_color || '#2563eb'}; border: 1px solid ${r.route_color || '#2563eb'}50;">${r.route_name}</span>`
                      )
                      .join('')
                  : '<span style="color:#94a3b8">Delhi Transit Stop</span>'
              }
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <button id="btn-orig-${s.stop_id}" type="button" style="padding: 7px 10px; font-size: 12px; font-weight: 800; color: #ffffff; background-color: #059669; border: none; border-radius: 8px; cursor: pointer; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
              📍 Set Origin
            </button>
            <button id="btn-dest-${s.stop_id}" type="button" style="padding: 7px 10px; font-size: 12px; font-weight: 800; color: #ffffff; background-color: #dc2626; border: none; border-radius: 8px; cursor: pointer; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
              🎯 Set Dest
            </button>
          </div>
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
            color: leg.route_color || '#2563eb',
            weight: 10,
            opacity: 0.35,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: leg.route_color || '#2563eb',
            weight: 5.5,
            opacity: 0.98,
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
            radius: 10,
            color: '#064e3b',
            fillColor: '#10b981',
            fillOpacity: 1,
            weight: 4,
          })
            .bindTooltip(`🟢 <b>Origin: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (s.stop_id === finalAlightStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 10,
            color: '#881337',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 4,
          })
            .bindTooltip(`🔴 <b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 9,
            color: '#4c1d95',
            fillColor: '#8b5cf6',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`🔄 <b>Interchange: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -11],
            })
            .addTo(lg)
        }
      })

      // Auto-fit bounds
      if (journeyCoords.length >= 2 && selectedRouteFilter === 'ALL') {
        mapRef.current.fitBounds(L.latLngBounds(journeyCoords.map(c => L.latLng(c[0], c[1]))), {
          padding: [55, 55],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
      if (validStops.length > 0 && selectedRouteFilter === 'ALL') {
        const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
        mapRef.current.fitBounds(L.latLngBounds(allCoords), {
          padding: [40, 40],
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
        padding: [40, 40],
      })
    } else {
      mapRef.current.setView([28.6139, 77.209], 12)
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm relative">
      {/* Floating Mobility HUD Header */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Corridor Quick Selector */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/20 bg-[#0B1020]/85 p-2 text-white shadow-xl backdrop-blur-xl pointer-events-auto">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Corridors:</span>
          <button
            type="button"
            onClick={() => setSelectedRouteFilter('ALL')}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              selectedRouteFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            All
          </button>
          {routes.map(r => (
            <button
              key={r.route_id}
              type="button"
              onClick={() => setSelectedRouteFilter(r.route_id)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                selectedRouteFilter === r.route_id
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full inline-block shadow-2xs"
                style={{ backgroundColor: r.route_color || '#2563eb' }}
              />
              <span>{r.route_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0B1020]/85 p-2 text-white shadow-xl backdrop-blur-xl pointer-events-auto">
          <button
            type="button"
            onClick={handleResetView}
            className="rounded-xl px-3 py-1 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            title="Reset network view"
          >
            Reset Grid
          </button>
          {hasJourney && (
            <span className="flex items-center gap-1.5 rounded-xl bg-blue-600/90 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Path Active
            </span>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-[480px] sm:h-[530px] lg:h-[580px] z-10"
        aria-label="Interactive Transit Map"
        role="region"
      />

      {/* Bottom Telemetry & Provenance Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-900 px-5 py-3 text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
            Origin Station
          </span>
          <span className="flex items-center gap-1.5 font-bold text-rose-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
            Destination
          </span>
          <span className="flex items-center gap-1.5 font-bold text-purple-400">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-sm" />
            Interchange Hub
          </span>
        </div>
        <span className="text-slate-400 font-medium">
          Delhi GTFS Network Coordinates • Click any station node to route
        </span>
      </div>
    </div>
  )
}
