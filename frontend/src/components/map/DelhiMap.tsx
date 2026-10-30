import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../../types'
import { getStationSubtitle, getStationIcon } from '../../utils/transitData'

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

export default function DelhiMap({
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
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([28.625, 77.215], 11)

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

  // Draw Network & Active Journey
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
        const isMetro = route.route_type === 'metro' || route.route_id.startsWith('M')
        const routeColor = isMetro ? '#C49A43' : (route.route_color || '#172D3B')

        const poly = L.polyline(validRoutePoints, {
          color: routeColor,
          weight: isFilteredIn && selectedRouteFilter !== 'ALL' ? 6 : 3,
          opacity: isFilteredIn ? (selectedRouteFilter !== 'ALL' ? 0.95 : 0.4) : 0.12,
          dashArray: isFilteredIn && selectedRouteFilter !== 'ALL' ? undefined : (isMetro ? undefined : '6, 6'),
        })

        poly.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
            <b>${isMetro ? 'Metro:' : 'Bus:'} ${route.route_name}</b>
          </div>`,
          { sticky: true }
        )
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

      let radius = 5
      let color = '#73766F'
      let fillColor = '#EDE7DB'
      let fillOpacity = 0.9
      let weight = 1.5

      if (isSelectedOrigin) {
        radius = 9
        color = '#243B4A'
        fillColor = '#547A60'
        fillOpacity = 1
        weight = 3
      } else if (isSelectedDest) {
        radius = 9
        color = '#243B4A'
        fillColor = '#A6533C'
        fillOpacity = 1
        weight = 3
      }

      const marker = L.circleMarker([s.stop_lat, s.stop_lon], {
        radius,
        color,
        fillColor,
        fillOpacity,
        weight,
      })

      const icon = getStationIcon(s.stop_name)
      const subtitle = getStationSubtitle(s.stop_id)

      marker.bindTooltip(
        `<div style="font-family: inherit;">
          <div style="font-weight: 700; color: #243B4A; font-size: 12px;">${icon} ${s.stop_name}</div>
          <div style="font-size: 11px; color: #C49A43; font-weight: 600;">${subtitle}</div>
          <div style="font-size: 10px; color: #77766D;">Zone ${s.zone_id} • Node ${s.stop_id}</div>
        </div>`,
        { direction: 'top', offset: [0, -7] }
      )

      // Rich interactive Transit Stop Card in Popup
      const popupDiv = document.createElement('div')
      popupDiv.className = 'text-xs p-1 min-w-[220px]'
      popupDiv.innerHTML = `
        <div style="font-family: inherit;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 20px;">${icon}</span>
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #243B4A; line-height: 1.2;">${s.stop_name}</div>
              <div style="font-size: 11px; font-weight: 600; color: #C49A43; margin-top: 1px;">${subtitle}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin: 6px 0 8px 0; font-size: 10px;">
            <span style="background: #EEE5D6; color: #29343A; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Zone ${s.zone_id}</span>
            <span style="background: #EEE5D6; color: #77766D; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Node ${s.stop_id}</span>
          </div>
          <div style="font-size: 11px; margin-bottom: 8px;">
            <span style="font-weight: 700; color: #77766D; font-size: 10px; text-transform: uppercase;">Lines Served:</span>
            <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${
                servingRoutes.length > 0
                  ? servingRoutes
                      .map(
                        r =>
                          `<span style="display:inline-flex; align-items:center; gap:3px; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; background-color: #EEE5D6; color: #243B4A; border: 1px solid #D8C8AA;">
                            <span style="width:5px; height:5px; border-radius:50%; background-color:${r.route_color || '#243B4A'};"></span>
                            ${r.route_name.split(' ')[0]}
                          </span>`
                      )
                      .join('')
                  : '<span style="color:#77766D; font-size: 10px;">Delhi Transit Stop</span>'
              }
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #D8C8AA;">
            <button id="btn-orig-${s.stop_id}" type="button" aria-label="Set ${s.stop_name} as Origin" style="padding: 7px 10px; font-size: 11px; font-weight: 700; color: #FFFCF5; background-color: #243B4A; border: none; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; min-height: 32px;">
              Set Origin
            </button>
            <button id="btn-dest-${s.stop_id}" type="button" aria-label="Set ${s.stop_name} as Destination" style="padding: 7px 10px; font-size: 11px; font-weight: 700; color: #FFFCF5; background-color: #A6533C; border: none; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; min-height: 32px;">
              Set Dest
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
          const isMetro = leg.route_type === 'metro' || leg.route_id.startsWith('M')
          const legColor = isMetro ? '#C49A43' : (leg.route_color || '#172D3B')

          // Glow shadow under active line
          L.polyline(legCoords, {
            color: legColor,
            weight: 9,
            opacity: 0.25,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: legColor,
            weight: 5,
            opacity: 1.0,
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
            color: '#172D3B',
            fillColor: '#547A60',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`<b>Origin: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (s.stop_id === finalAlightStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 10,
            color: '#243B4A',
            fillColor: '#A6533C',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`<b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8.5,
            color: '#243B4A',
            fillColor: '#C49A43',
            fillOpacity: 1,
            weight: 3,
          })
            .bindTooltip(`<b>Interchange: ${s.stop_name}</b>`, {
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
          padding: [50, 50],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
      if (validStops.length > 0 && selectedRouteFilter === 'ALL') {
        const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
        mapRef.current.fitBounds(L.latLngBounds(allCoords), {
          padding: [35, 35],
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
        padding: [35, 35],
      })
    } else {
      mapRef.current.setView([28.625, 77.215], 12)
    }
  }

  return (
    <figure
      role="region"
      aria-label="Interactive Delhi Transit Map"
      className="overflow-hidden rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] shadow-xs relative flex flex-col h-full min-h-[440px] lg:min-h-[620px] animate-fade-in"
    >
      <figcaption className="sr-only">
        Geographic map representing 20 Delhi stops and active routes with interactive origin and destination selection
      </figcaption>

      {/* Floating Mobility HUD Header */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Corridor Quick Selector */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[calc(100%-90px)] rounded-xl border border-[#D8C8AA] bg-[#FFFCF5]/95 p-1 text-[#29343A] shadow-md backdrop-blur-md pointer-events-auto scrollbar-thin">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#77766D] px-2 shrink-0">
            Corridors:
          </span>
          <button
            type="button"
            onClick={() => setSelectedRouteFilter('ALL')}
            aria-pressed={selectedRouteFilter === 'ALL'}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedRouteFilter === 'ALL'
                ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
                : 'text-[#77766D] hover:bg-[#EEE5D6] hover:text-[#243B4A]'
            }`}
          >
            All
          </button>
          {routes.map(r => (
            <button
              key={r.route_id}
              type="button"
              onClick={() => setSelectedRouteFilter(r.route_id)}
              aria-pressed={selectedRouteFilter === r.route_id}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedRouteFilter === r.route_id
                  ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
                  : 'text-[#77766D] hover:bg-[#EEE5D6] hover:text-[#243B4A]'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: r.route_color || '#C49A43' }}
                aria-hidden="true"
              />
              <span>{r.route_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#D8C8AA] bg-[#FFFCF5]/95 p-1 text-[#29343A] shadow-md backdrop-blur-md pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={handleResetView}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#77766D] hover:bg-[#EEE5D6] hover:text-[#243B4A] transition-colors cursor-pointer"
            title="Reset network view"
            aria-label="Reset map view"
          >
            Reset
          </button>
          {hasJourney && (
            <span className="flex items-center gap-1 rounded-lg bg-[#547A60]/15 border border-[#547A60]/30 px-2 py-0.5 text-[10px] font-bold text-[#547A60]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#547A60] animate-pulse" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[380px] sm:min-h-[460px] z-10"
        aria-label="Leaflet cartography canvas"
      />

      {/* Bottom Telemetry & Provenance Strip */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D8C8AA] bg-[#EEE5D6]/70 px-4 py-2.5 text-xs text-[#29343A] shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-[#547A60]">
            <span className="h-2 w-2 rounded-full bg-[#547A60]" aria-hidden="true" />
            Origin
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[#A6533C]">
            <span className="h-2 w-2 rounded-full bg-[#A6533C]" aria-hidden="true" />
            Destination
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[#C49A43]">
            <span className="h-2 w-2 rounded-full bg-[#C49A43]" aria-hidden="true" />
            Metro Line
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[#243B4A]">
            <span className="h-2 w-2 rounded-full bg-[#243B4A]" aria-hidden="true" />
            Bus Route
          </span>
        </div>
        <span className="text-[11px] text-[#77766D] font-medium">
          Delhi GTFS • Tap stop marker to set route
        </span>
      </footer>
    </figure>
  )
}
