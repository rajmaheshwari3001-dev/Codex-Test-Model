import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../../types'

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

// Canonical Station coordinates for primary corridors & hubs
const DWARKA_COORD: [number, number] = [28.5529, 77.0583]
const JANAKPURI_COORD: [number, number] = [28.6296, 77.0815]
const RAJOURI_COORD: [number, number] = [28.6491, 77.1221]
const RAJIV_COORD: [number, number] = [28.6328, 77.2197]
const MANDI_COORD: [number, number] = [28.6258, 77.2342]
const MAYUR_COORD: [number, number] = [28.6129, 77.2750]
const NOIDA_COORD: [number, number] = [28.5641, 77.3341]
const KASHMERE_COORD: [number, number] = [28.6674, 77.2289]
const CHANDNI_COORD: [number, number] = [28.6560, 77.2300]
const NDLS_COORD: [number, number] = [28.6425, 77.2193]
const CP_COORD: [number, number] = [28.6315, 77.2167]
const INDIA_GATE_COORD: [number, number] = [28.6129, 77.2295]
const LAJPAT_COORD: [number, number] = [28.5700, 77.2400]
const SAKET_COORD: [number, number] = [28.5224, 77.2015]
const HAUZ_KHAS_COORD: [number, number] = [28.5494, 77.2001]
const AIIMS_COORD: [number, number] = [28.5672, 77.2100]
const ITO_COORD: [number, number] = [28.6275, 77.2455]
const NEHRU_COORD: [number, number] = [28.5489, 77.2533]
const INA_COORD: [number, number] = [28.5744, 77.2105]
const ANAND_VIHAR_COORD: [number, number] = [28.6469, 77.3160]
const SARAI_KALE_COORD: [number, number] = [28.5888, 77.2544]
const DHAULA_KUAN_COORD: [number, number] = [28.5910, 77.1610]
const AEROCITY_COORD: [number, number] = [28.5480, 77.1220]
const AIRPORT_T3_COORD: [number, number] = [28.5560, 77.0850]
const BOTANICAL_COORD: [number, number] = [28.5645, 77.3340]

// Helper to linearly interpolate between two points
function lerpPoint(
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t]
}

// Polyline interpolation along an array of waypoints
function interpolateRoute(
  waypoints: [number, number][],
  progress: number
): [number, number] {
  if (waypoints.length === 0) return [28.615, 77.215]
  if (waypoints.length === 1) return waypoints[0]

  const totalSegments = waypoints.length - 1
  const scaled = progress * totalSegments
  const index = Math.min(Math.floor(scaled), totalSegments - 1)
  const t = scaled - index

  return lerpPoint(waypoints[index], waypoints[index + 1], t)
}

type MapStyle = 'sandstone' | 'dark' | 'satellite'

export default function DelhiMap({
  stops,
  routes: _routes,
  selectedJourney,
  originStopId = 'S13',
  destinationStopId = 'S19',
  onSelectOrigin,
  onSelectDestination,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mapStyle, setMapStyle] = useState<MapStyle>('sandstone')

  // Map Filter Toggles
  const [showMetro, setShowMetro] = useState(true)
  const [showBus, setShowBus] = useState(true)
  const [showLiveVehicles, setShowLiveVehicles] = useState(true)

  // Real-Time GPS Simulation Ticker (Advances every 1.5s)
  const [simTick, setSimTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSimTick(prev => (prev + 1) % 100)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  // Expose origin & destination select to window for Leaflet HTML popups
  useEffect(() => {
    ;(window as unknown as { __selectOrigin?: (id: string) => void }).__selectOrigin = onSelectOrigin
    ;(window as unknown as { __selectDest?: (id: string) => void }).__selectDest = onSelectDestination

    return () => {
      delete (window as unknown as { __selectOrigin?: (id: string) => void }).__selectOrigin
      delete (window as unknown as { __selectDest?: (id: string) => void }).__selectDest
    }
  }, [onSelectOrigin, onSelectDestination])

  // Change Basemap Tiles dynamically based on mapStyle
  const updateTileLayer = useCallback((style: MapStyle, map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    let attribution = '&copy; OpenStreetMap contributors'
    let maxZoom = 18

    if (style === 'dark') {
      // High-contrast clean dark tile via standard OpenStreetMap with midnight filter
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      attribution = '&copy; OpenStreetMap contributors'
      maxZoom = 19
    } else if (style === 'satellite') {
      // High-resolution aerial satellite imagery (Esri World Imagery)
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      attribution = '&copy; Esri, Maxar, Earthstar Geographics'
      maxZoom = 18
    } else {
      // Classic Sandstone / Warm OSM
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      attribution = '&copy; OpenStreetMap contributors'
      maxZoom = 18
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom,
      minZoom: 9,
    }).addTo(map)

    tileLayerRef.current = newLayer
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([28.615, 77.215], 11)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    updateTileLayer(mapStyle, map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapStyle, updateTileLayer])

  // Handle map style changes
  useEffect(() => {
    if (mapRef.current) {
      updateTileLayer(mapStyle, mapRef.current)
    }
  }, [mapStyle, updateTileLayer])

  // Draw Delhi Multi-Modal Network, Halos, Active Route, and GPS Vehicles
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    // 1. OFFICIAL DELHI TRANSIT NETWORK CORRIDORS

    // A. Blue Line (DMRC Line 3/4) - Dwarka Sec-21 to Anand Vihar & Noida
    if (showMetro) {
      const blueLineWest: [number, number][] = [
        DWARKA_COORD,
        JANAKPURI_COORD,
        RAJOURI_COORD,
        RAJIV_COORD,
        MANDI_COORD,
      ]
      const blueLineNoidaBranch: [number, number][] = [
        MANDI_COORD,
        MAYUR_COORD,
        NOIDA_COORD,
      ]
      const blueLineAnandBranch: [number, number][] = [
        MANDI_COORD,
        ITO_COORD,
        ANAND_VIHAR_COORD,
      ]

      ;[blueLineWest, blueLineNoidaBranch, blueLineAnandBranch].forEach(pts => {
        L.polyline(pts, {
          color: '#0072CE', // Official Blue Line
          weight: 4.5,
          opacity: 0.85,
        }).addTo(lg)
      })
    }

    // B. Yellow Line Spine (DMRC Line 2) - Kashmere Gate to Saket / Gurugram
    if (showMetro) {
      const yellowSpine: [number, number][] = [
        KASHMERE_COORD,
        CHANDNI_COORD,
        NDLS_COORD,
        CP_COORD,
        RAJIV_COORD,
        INA_COORD,
        AIIMS_COORD,
        HAUZ_KHAS_COORD,
        SAKET_COORD,
      ]
      L.polyline(yellowSpine, {
        color: '#E5A800', // Official Yellow Line
        weight: 4.5,
        opacity: 0.85,
      }).addTo(lg)
    }

    // C. Airport Express Line (Orange Line) - New Delhi to IGI Airport & Dwarka
    if (showMetro) {
      const orangeAirport: [number, number][] = [
        NDLS_COORD,
        [28.6290, 77.2130], // Shivaji Stadium
        DHAULA_KUAN_COORD,
        AEROCITY_COORD,
        AIRPORT_T3_COORD,
        DWARKA_COORD,
      ]
      L.polyline(orangeAirport, {
        color: '#FF6F00', // High-Speed Airport Express Orange
        weight: 4.5,
        opacity: 0.9,
      }).addTo(lg)
    }

    // D. Magenta Line (DMRC Line 8) - Janakpuri West to Hauz Khas to Botanical Garden
    if (showMetro) {
      const magentaLine: [number, number][] = [
        JANAKPURI_COORD,
        HAUZ_KHAS_COORD,
        NEHRU_COORD,
        BOTANICAL_COORD,
      ]
      L.polyline(magentaLine, {
        color: '#C2185B', // Magenta Line
        weight: 4,
        opacity: 0.8,
      }).addTo(lg)
    }

    // E. Pink Line (DMRC Line 7) - Rajouri Garden to Dhaula Kuan to Mayur Vihar
    if (showMetro) {
      const pinkLine: [number, number][] = [
        RAJOURI_COORD,
        DHAULA_KUAN_COORD,
        INA_COORD,
        LAJPAT_COORD,
        MAYUR_COORD,
      ]
      L.polyline(pinkLine, {
        color: '#E91E63', // Pink Line
        weight: 4,
        opacity: 0.75,
      }).addTo(lg)
    }

    // F. Green Line (DMRC Line 5) - Kashmere Gate to Rajouri Garden
    if (showMetro) {
      const greenLine: [number, number][] = [
        KASHMERE_COORD,
        [28.674, 77.165],
        RAJOURI_COORD,
      ]
      L.polyline(greenLine, {
        color: '#00A651', // Green Line
        weight: 4,
        opacity: 0.75,
      }).addTo(lg)
    }

    // G. Violet Line (DMRC Line 6) - Kashmere Gate to Nehru Place
    if (showMetro) {
      const violetLine: [number, number][] = [
        KASHMERE_COORD,
        ITO_COORD,
        MANDI_COORD,
        SARAI_KALE_COORD,
        LAJPAT_COORD,
        NEHRU_COORD,
      ]
      L.polyline(violetLine, {
        color: '#8A2BE2', // Violet Line
        weight: 4,
        opacity: 0.75,
      }).addTo(lg)
    }

    // H. DTC Ring Road Feeder (Bus Mudrika Express)
    if (showBus) {
      const ringRoadBus: [number, number][] = [
        CP_COORD,
        INDIA_GATE_COORD,
        SARAI_KALE_COORD,
        LAJPAT_COORD,
        AIIMS_COORD,
        DHAULA_KUAN_COORD,
        JANAKPURI_COORD,
      ]
      L.polyline(ringRoadBus, {
        color: '#E31B23', // Red Ring
        weight: 3,
        opacity: 0.7,
        dashArray: '6, 6',
      }).addTo(lg)
    }

    // I. DTC City Bus 764 Special (Rajiv Chowk to Noida)
    if (showBus) {
      const bus764Whole: [number, number][] = [
        DWARKA_COORD,
        [28.59, 77.10],
        CP_COORD,
        MANDI_COORD,
        MAYUR_COORD,
        NOIDA_COORD,
      ]
      L.polyline(bus764Whole, {
        color: '#1A2E3B',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '8, 6',
      }).addTo(lg)
    }

    // 2. INTERACTIVE STATION STOPS WITH GLOWING HALOS
    stops.forEach(stop => {
      if (!isValidCoord(stop.stop_lat, stop.stop_lon)) return

      const isRajiv = stop.stop_id === 'S01'
      const isKashmere = stop.stop_id === 'S02'
      const isInterchange =
        isRajiv ||
        isKashmere ||
        stop.stop_id === 'S04' || // New Delhi Stn
        stop.stop_id === 'S10' || // AIIMS
        stop.stop_id === 'S13' || // Dwarka Sec 21
        stop.stop_id === 'S19' || // Noida
        stop.stop_id === 'S15' || // Rajouri
        stop.stop_id === 'S17'    // Mandi House

      const isOrigin = stop.stop_id === originStopId
      const isDest = stop.stop_id === destinationStopId

      // Highlight active origin / destination with distinct glowing hero badges
      if (isOrigin || isDest) return

      // Station Marker
      const circle = L.circleMarker([stop.stop_lat, stop.stop_lon], {
        radius: isInterchange ? 6.5 : 4.5,
        color: '#FFFFFF',
        fillColor: isRajiv ? '#C49A43' : isInterchange ? '#1A2E3B' : '#7A7269',
        fillOpacity: 0.95,
        weight: 2,
      }).addTo(lg)

      // Station Tooltip on Hover
      circle.bindTooltip(
        `<strong>${stop.stop_name}</strong><br/><span style="font-size: 10px; color: #7A7269;">Zone ${stop.zone_id} ${isInterchange ? '• Major Hub' : ''}</span>`,
        { direction: 'top', offset: [0, -6] }
      )

      // Connected line badges HTML
      const lineBadges = isRajiv
        ? '<span style="background: #0072CE; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Blue Line</span> <span style="background: #E5A800; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Yellow Line</span>'
        : isKashmere
        ? '<span style="background: #E31B23; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Red Line</span> <span style="background: #E5A800; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Yellow Line</span> <span style="background: #8A2BE2; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Violet Line</span>'
        : stop.stop_id === 'S04'
        ? '<span style="background: #E5A800; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Yellow Line</span> <span style="background: #FF6F00; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Airport Express</span>'
        : '<span style="background: #1A2E3B; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">DMRC Network</span>'

      // Station Popup on Click
      const popupHtml = `
        <div style="font-family: 'Manrope', -apple-system, sans-serif; min-width: 220px;">
          <div style="font-size: 10px; font-weight: 800; color: #C49A43; text-transform: uppercase; letter-spacing: 0.5px;">
            ${isInterchange ? 'Major Interchange Hub' : 'Delhi Transit Station'} • Zone ${stop.zone_id}
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #1A2E3B; margin-top: 3px;">
            ${stop.stop_name}
          </div>
          <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
            ${lineBadges}
          </div>
          <div style="font-size: 11px; color: #2E7D32; font-weight: 700; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #2E7D32;"></span>
            Operating normally • Next train in 2 min
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px; border-top: 1px solid #EBE5DC; padding-top: 8px;">
            <button onclick="window.__selectOrigin && window.__selectOrigin('${stop.stop_id}')" style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 800; background: #FAF0D9; color: #9A721C; border: 1px solid #E8D4AE; border-radius: 8px; cursor: pointer;">
              📍 Set Origin
            </button>
            <button onclick="window.__selectDest && window.__selectDest('${stop.stop_id}')" style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 800; background: #1A2E3B; color: #FFFFFF; border: none; border-radius: 8px; cursor: pointer;">
              🎯 Set Dest
            </button>
          </div>
        </div>
      `
      circle.bindPopup(popupHtml)
    })

    // 3. ACTIVE ROUTE NEON HIGHLIGHTING (Selected Journey)
    const activeJourney = selectedJourney
    const isFigmaRoute =
      !activeJourney ||
      (activeJourney.legs[0]?.board_stop_id === 'S13' &&
        activeJourney.legs[activeJourney.legs.length - 1]?.alight_stop_id === 'S19')

    if (isFigmaRoute || (activeJourney && activeJourney.legs.length > 0)) {
      const isFastestActive =
        !activeJourney || activeJourney.label.toLowerCase() === 'fastest'

      if (isFastestActive) {
        // Leg 1: Metro Dwarka to Rajiv Chowk (Gold Neon)
        const metroCoords: [number, number][] = [
          DWARKA_COORD,
          JANAKPURI_COORD,
          RAJOURI_COORD,
          RAJIV_COORD,
        ]

        if (showMetro) {
          L.polyline(metroCoords, {
            color: '#C49A43',
            weight: 14,
            opacity: 0.3,
          }).addTo(lg)

          L.polyline(metroCoords, {
            color: '#C49A43',
            weight: 6,
            opacity: 1.0,
          }).addTo(lg)

          L.polyline(metroCoords, {
            color: '#FFFFFF',
            weight: 2.5,
            opacity: 0.9,
            dashArray: '10, 10',
            className: 'delhi-path-flow',
          }).addTo(lg)
        }

        // Leg 2: City Bus Rajiv Chowk to Noida City Centre (Navy Neon)
        const busCoords: [number, number][] = [
          RAJIV_COORD,
          MANDI_COORD,
          MAYUR_COORD,
          NOIDA_COORD,
        ]

        if (showBus) {
          L.polyline(busCoords, {
            color: '#1A2E3B',
            weight: 14,
            opacity: 0.28,
          }).addTo(lg)

          L.polyline(busCoords, {
            color: '#1A2E3B',
            weight: 6,
            opacity: 1.0,
          }).addTo(lg)

          L.polyline(busCoords, {
            color: '#C49A43',
            weight: 2.5,
            opacity: 0.9,
            dashArray: '10, 10',
            className: 'delhi-path-flow',
          }).addTo(lg)
        }
      } else {
        // Lowest Cost: Entire Bus Corridor
        const busWholeCoords: [number, number][] = [
          DWARKA_COORD,
          [28.59, 77.10],
          CP_COORD,
          MANDI_COORD,
          MAYUR_COORD,
          NOIDA_COORD,
        ]

        if (showBus) {
          L.polyline(busWholeCoords, {
            color: '#1A2E3B',
            weight: 14,
            opacity: 0.28,
          }).addTo(lg)

          L.polyline(busWholeCoords, {
            color: '#1A2E3B',
            weight: 6,
            opacity: 1.0,
          }).addTo(lg)

          L.polyline(busWholeCoords, {
            color: '#C49A43',
            weight: 2.5,
            opacity: 0.9,
            dashArray: '10, 10',
            className: 'delhi-path-flow',
          }).addTo(lg)
        }
      }

      // Origin Hero Pin Marker (Dwarka Sec 21)
      const originIcon = L.divIcon({
        className: 'delhi-pin-origin',
        html: `
          <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
            <div style="background-color: #C49A43; color: #FFFFFF; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(196,154,67,0.5); white-space: nowrap; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 12px;">📍</span>
              <span>DWARKA SEC 21</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #C49A43; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(DWARKA_COORD, { icon: originIcon }).addTo(lg)

      // Transfer Hero Marker (Rajiv Chowk)
      const transferIcon = L.divIcon({
        className: 'delhi-pin-transfer',
        html: `
          <div style="position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 6px; pointer-events: auto;">
            <div style="width: 22px; height: 22px; border-radius: 50%; border: 3px solid #1A2E3B; background: #C49A43; box-shadow: 0 2px 10px rgba(0,0,0,0.3);" class="delhi-station-halo"></div>
            <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(6px); padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #1A2E3B; border: 1.5px solid #C49A43; white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.15);">
              🔄 RAJIV CHOWK • 5m TRANSFER
            </div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(RAJIV_COORD, { icon: transferIcon }).addTo(lg)

      // Destination Hero Pin Marker (Noida City Centre)
      const destIcon = L.divIcon({
        className: 'delhi-pin-dest',
        html: `
          <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
            <div style="background-color: #1A2E3B; color: #FFFFFF; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(26,46,59,0.5); white-space: nowrap; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 12px;">🎯</span>
              <span>NOIDA CITY CENTRE</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #1A2E3B; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(NOIDA_COORD, { icon: destIcon }).addTo(lg)

      // 4. DYNAMIC MOVING LIVE GPS TELEMETRY VEHICLES
      if (showLiveVehicles) {
        // Train 302 Simulation along Blue Line
        const trainRouteWaypoints: [number, number][] = [
          JANAKPURI_COORD,
          RAJOURI_COORD,
          RAJIV_COORD,
          MANDI_COORD,
          RAJIV_COORD,
          RAJOURI_COORD,
        ]
        // Calculate train current progress (cycles smoothly between 0 and 1)
        const trainProgress = (simTick % 50) / 50
        const currentTrainPos = interpolateRoute(trainRouteWaypoints, trainProgress)
        const trainSpeed = 50 + (simTick % 8)

        const trainIcon = L.divIcon({
          className: 'delhi-vehicle-metro',
          html: `
            <div class="delhi-vehicle-live" style="position: absolute; transform: translate(-50%, -50%); background: #C49A43; color: #FFFFFF; padding: 4px 9px; border-radius: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px; border: 2px solid #FFFFFF; box-shadow: 0 4px 14px rgba(196,154,67,0.6); cursor: pointer; white-space: nowrap;">
              <span>🚆</span>
              <span>LINE 3 • ${trainSpeed} km/h</span>
            </div>
          `,
          iconSize: [0, 0],
        })
        const trainMarker = L.marker(currentTrainPos, { icon: trainIcon }).addTo(lg)
        trainMarker.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; min-width: 210px;">
            <div style="font-size: 10px; font-weight: 800; color: #C49A43; text-transform: uppercase;">
              Delhi Metro • Blue Line 3
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #1A2E3B; margin-top: 2px;">
              Train #DMRC-302 (8-Coach)
            </div>
            <div style="font-size: 11px; color: #7A7269; margin-top: 6px; line-height: 1.5;">
              Status: <strong style="color: #2E7D32;">Live GPS (${trainSpeed} km/h)</strong><br />
              Next Stop: <strong>Rajiv Chowk in 1m 40s</strong><br />
              Crowd Density: <strong>42% (Normal)</strong><br />
              Overhead Traction: <strong>25kV AC Electric</strong>
            </div>
          </div>
        `)

        // City Bus 764 Simulation along Mandi House to Noida
        const busRouteWaypoints: [number, number][] = [
          RAJIV_COORD,
          MANDI_COORD,
          MAYUR_COORD,
          NOIDA_COORD,
          MAYUR_COORD,
          MANDI_COORD,
        ]
        const busProgress = ((simTick + 25) % 50) / 50
        const currentBusPos = interpolateRoute(busRouteWaypoints, busProgress)
        const busSpeed = 26 + (simTick % 6)

        const busIcon = L.divIcon({
          className: 'delhi-vehicle-bus',
          html: `
            <div class="delhi-vehicle-live" style="position: absolute; transform: translate(-50%, -50%); background: #1A2E3B; color: #FFFFFF; padding: 4px 9px; border-radius: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px; border: 2px solid #FFFFFF; box-shadow: 0 4px 14px rgba(26,46,59,0.6); cursor: pointer; white-space: nowrap;">
              <span>🚌</span>
              <span>BUS 764 (EV) • ${busSpeed} km/h</span>
            </div>
          `,
          iconSize: [0, 0],
        })
        const busMarker = L.marker(currentBusPos, { icon: busIcon }).addTo(lg)
        busMarker.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; min-width: 210px;">
            <div style="font-size: 10px; font-weight: 800; color: #1A2E3B; text-transform: uppercase;">
              Delhi Transport Corp • Electric
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #1A2E3B; margin-top: 2px;">
              Bus #DL-1PC-7640
            </div>
            <div style="font-size: 11px; color: #7A7269; margin-top: 6px; line-height: 1.5;">
              Route: <strong>764 Special Express</strong><br />
              Status: <strong style="color: #2E7D32;">Active Telemetry (${busSpeed} km/h)</strong><br />
              Next Stop: <strong>Mayur Vihar in 2 min</strong><br />
              Seating: <strong>32/50 Available</strong><br />
              Battery Level: <strong>81% Charged</strong>
            </div>
          </div>
        `)

        // Vehicle 3: Poochh-O Auto Rickshaw feeder near AIIMS
        const autoRouteWaypoints: [number, number][] = [
          AIIMS_COORD,
          INA_COORD,
          HAUZ_KHAS_COORD,
          AIIMS_COORD,
        ]
        const autoProgress = ((simTick + 15) % 40) / 40
        const currentAutoPos = interpolateRoute(autoRouteWaypoints, autoProgress)

        const autoIcon = L.divIcon({
          className: 'delhi-vehicle-auto',
          html: `
            <div class="delhi-vehicle-live" style="position: absolute; transform: translate(-50%, -50%); background: #2E7D32; color: #FFFFFF; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 3px; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(46,125,50,0.6); cursor: pointer; white-space: nowrap;">
              <span>🛺</span>
              <span>POOCHH-O AUTO</span>
            </div>
          `,
          iconSize: [0, 0],
        })
        const autoMarker = L.marker(currentAutoPos, { icon: autoIcon }).addTo(lg)
        autoMarker.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; min-width: 190px;">
            <div style="font-size: 10px; font-weight: 800; color: #2E7D32; text-transform: uppercase;">
              Delhi Poochh-O • DIMTS Auto
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #1A2E3B; margin-top: 2px;">
              Statutory Meter Auto #DL-1R-8821
            </div>
            <div style="font-size: 11px; color: #7A7269; margin-top: 4px; line-height: 1.4;">
              Statutory Tariff: <strong>₹30 (1st 1.5 km) + ₹11/km</strong><br />
              Status: <strong>Available at AIIMS Gate 2</strong><br />
              Verification: <strong>Delhi Transport Dept Approved</strong>
            </div>
          </div>
        `)
      }
    }
  }, [
    stops,
    selectedJourney,
    originStopId,
    destinationStopId,
    showMetro,
    showBus,
    showLiveVehicles,
    simTick,
  ])

  // Fit active journey bounds
  const handleFitRoute = () => {
    if (!mapRef.current) return
    mapRef.current.fitBounds(
      L.latLngBounds([DWARKA_COORD, RAJIV_COORD, NOIDA_COORD]),
      { padding: [60, 60], maxZoom: 13 }
    )
  }

  // Reset to full Delhi NCR overview
  const handleCenterDelhi = () => {
    if (!mapRef.current) return
    mapRef.current.setView([28.615, 77.215], 11, { animate: true })
  }

  // Jump to specific landmark
  const handleFlyToCoord = (coord: [number, number], zoom = 14) => {
    if (!mapRef.current) return
    mapRef.current.flyTo(coord, zoom, { duration: 1.2 })
  }

  const filteredSearchStops = searchQuery.trim()
    ? stops.filter(s =>
        s.stop_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleSelectSearchStop = (stop: Stop) => {
    setSearchQuery('')
    setShowSearchResults(false)
    if (mapRef.current && isValidCoord(stop.stop_lat, stop.stop_lon)) {
      mapRef.current.flyTo([stop.stop_lat, stop.stop_lon], 14, {
        duration: 1.2,
      })
    }
  }

  return (
    <figure
      role="region"
      aria-label="Interactive Delhi Transit Map"
      className={`overflow-hidden rounded-2xl border border-[#EBE5DC] bg-white shadow-xs relative flex flex-col h-full min-h-[500px] lg:min-h-[660px] animate-fade-in map-tiles-${mapStyle}`}
    >
      <figcaption className="sr-only">
        Geographic map representing Delhi transit multimodal network
      </figcaption>

      {/* Floating Top HUD Bar (Search + Basemap Switcher + Layer Toggles) */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm pointer-events-auto">
            <div className="flex items-center rounded-xl border border-[#EBE5DC] bg-white/95 px-3 py-2 shadow-md backdrop-blur-md transition-colors focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
              <span className="text-xs text-[#7A7269] mr-2">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search station or landmark..."
                aria-label="Search Delhi transit stops"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1A202C] placeholder-[#7A7269] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchResults(false)
                  }}
                  className="text-[#7A7269] hover:text-[#1A202C] p-0.5 cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchResults && filteredSearchStops.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#EBE5DC] bg-white shadow-xl z-[501] divide-y divide-[#EBE5DC]/50 scrollbar-thin">
                {filteredSearchStops.map(s => (
                  <div
                    key={s.stop_id}
                    onClick={() => handleSelectSearchStop(s)}
                    className="flex items-center justify-between p-2.5 text-xs sm:text-sm hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#C49A43]" />
                      <span className="font-bold text-[#1A202C]">{s.stop_name}</span>
                    </div>
                    <span className="text-[10px] text-[#7A7269] font-mono">
                      Zone {s.zone_id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Map Controls HUD: Basemap Switcher + Layer Toggles */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE5DC] bg-white/95 p-1 shadow-md backdrop-blur-md pointer-events-auto flex-wrap">
            {/* Basemap Style Switcher */}
            <div className="flex rounded-lg bg-[#FAF7F2] p-0.5 border border-[#EBE5DC]">
              <button
                type="button"
                onClick={() => setMapStyle('sandstone')}
                title="Classic Carto Sandstone"
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mapStyle === 'sandstone'
                    ? 'bg-white text-[#1A2E3B] shadow-2xs'
                    : 'text-[#7A7269] hover:text-[#1A2E3B]'
                }`}
              >
                🗺️ Classic
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                title="Midnight Metro Mode"
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mapStyle === 'dark'
                    ? 'bg-[#1A2E3B] text-white shadow-2xs'
                    : 'text-[#7A7269] hover:text-[#1A2E3B]'
                }`}
              >
                🌙 Dark
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                title="Aerial Satellite Imagery"
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mapStyle === 'satellite'
                    ? 'bg-[#2E7D32] text-white shadow-2xs'
                    : 'text-[#7A7269] hover:text-[#1A2E3B]'
                }`}
              >
                🛰️ Aerial
              </button>
            </div>

            {/* Layer Toggles */}
            <button
              type="button"
              onClick={() => setShowMetro(prev => !prev)}
              title="Toggle Metro Lines"
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                showMetro
                  ? 'bg-[#FAF0D9] text-[#9A721C] border border-[#F3E2BD]'
                  : 'text-[#7A7269] hover:bg-[#FAF7F2]'
              }`}
            >
              Metro
            </button>

            <button
              type="button"
              onClick={() => setShowBus(prev => !prev)}
              title="Toggle Bus Lines"
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                showBus
                  ? 'bg-[#E8EDF1] text-[#1A2E3B] border border-[#D3DEE6]'
                  : 'text-[#7A7269] hover:bg-[#FAF7F2]'
              }`}
            >
              Bus
            </button>

            <button
              type="button"
              onClick={() => setShowLiveVehicles(prev => !prev)}
              title="Toggle Live GPS Transit Vehicles"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                showLiveVehicles
                  ? 'bg-[#EAF5EC] text-[#2E7D32] border border-[#D1E7D5]'
                  : 'text-[#7A7269] hover:bg-[#FAF7F2]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
              <span>GPS</span>
            </button>

            {/* Fit & Center Controls */}
            <button
              type="button"
              onClick={handleFitRoute}
              title="Fit Active Route to Viewport"
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#1A2E3B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={handleCenterDelhi}
              title="Re-Center Delhi NCR"
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#1A2E3B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              Delhi
            </button>
          </div>
        </div>

        {/* Landmark Speed-Dial HUD: 1-Click Pan & Zoom to iconic transit hubs */}
        <div className="hidden lg:flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1 rounded-xl border border-[#EBE5DC] bg-white/95 px-2.5 py-1 shadow-xs backdrop-blur-md text-[11px] font-bold text-[#1A2E3B]">
            <span className="text-[#C49A43] mr-1">⚡ Hubs:</span>
            <button
              type="button"
              onClick={() => handleFlyToCoord(RAJIV_COORD, 14)}
              className="px-2 py-0.5 rounded-md hover:bg-[#FAF0D9] text-[#1A2E3B] transition-colors cursor-pointer"
            >
              🏛️ Rajiv Chowk
            </button>
            <button
              type="button"
              onClick={() => handleFlyToCoord(AIRPORT_T3_COORD, 14)}
              className="px-2 py-0.5 rounded-md hover:bg-[#FAF0D9] text-[#1A2E3B] transition-colors cursor-pointer"
            >
              ✈️ IGI Airport
            </button>
            <button
              type="button"
              onClick={() => handleFlyToCoord(KASHMERE_COORD, 14)}
              className="px-2 py-0.5 rounded-md hover:bg-[#FAF0D9] text-[#1A2E3B] transition-colors cursor-pointer"
            >
              🏰 Kashmere Gate
            </button>
            <button
              type="button"
              onClick={() => handleFlyToCoord(AIIMS_COORD, 14)}
              className="px-2 py-0.5 rounded-md hover:bg-[#FAF0D9] text-[#1A2E3B] transition-colors cursor-pointer"
            >
              🏥 AIIMS
            </button>
            <button
              type="button"
              onClick={() => handleFlyToCoord(NOIDA_COORD, 14)}
              className="px-2 py-0.5 rounded-md hover:bg-[#FAF0D9] text-[#1A2E3B] transition-colors cursor-pointer"
            >
              🏢 Noida Hub
            </button>
          </div>
        </div>
      </div>

      {/* Floating Station Status Card: Kashmere Gate Operating normally */}
      <div
        onClick={() => handleFlyToCoord(KASHMERE_COORD)}
        className="absolute top-26 right-3.5 z-[500] hidden md:flex items-center gap-2.5 rounded-xl border border-[#EBE5DC] bg-white/95 px-3 py-2 shadow-md backdrop-blur-md pointer-events-auto cursor-pointer hover:border-[#C49A43] transition-all"
        title="Click to view Kashmere Gate on map"
      >
        <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
        <div className="text-left">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A2E3B]">
            KASHMERE GATE
          </div>
          <div className="text-[11px] text-[#22702E] font-semibold leading-tight">
            Operating normally • Next in 2 min
          </div>
        </div>
      </div>

      {/* Floating Bus Fleet Card: CITY BUS 764 */}
      <div
        onClick={() => handleFlyToCoord(MANDI_COORD)}
        className="absolute bottom-3.5 right-3.5 z-[500] hidden sm:flex items-center gap-2.5 rounded-xl border border-[#EBE5DC] bg-white/95 p-2.5 shadow-md backdrop-blur-md pointer-events-auto max-w-[240px] animate-fade-in cursor-pointer hover:border-[#C49A43] transition-all"
        title="Click to inspect City Bus 764 on map"
      >
        <div className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A2E3B] text-white shadow-2xs">
          <span>🚌</span>
        </div>
        <div className="text-left">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A2E3B]">
            CITY BUS 764
          </div>
          <div className="text-[10px] text-[#7A7269] font-medium leading-tight">
            Every 10 min from Rajiv Chowk
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Official Metro & Bus Legend */}
      <div className="absolute bottom-3.5 left-3.5 z-[500] flex items-center gap-2.5 rounded-xl border border-[#EBE5DC] bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md pointer-events-auto text-xs font-bold text-[#1A2E3B] flex-wrap max-w-sm">
        <div className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-[#0072CE] inline-block" />
          <span>Blue</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-[#E5A800] inline-block" />
          <span>Yellow</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-[#FF6F00] inline-block" />
          <span>Airport</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-[#C2185B] inline-block" />
          <span>Magenta</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-full bg-[#1A2E3B] inline-block" />
          <span>Bus 764</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[#1A2E3B] bg-[#C49A43] inline-block" />
          <span>Transfer</span>
        </div>
      </div>

      {/* Centered Serif Watermark: DELHI */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
        <span className="font-serif text-5xl sm:text-7xl md:text-8xl tracking-[0.35em] text-[#1A2E3B]/8 font-normal select-none uppercase pl-6">
          DELHI
        </span>
      </div>

      {/* Main Leaflet Map Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 min-h-[480px] sm:min-h-[580px] z-10"
        aria-label="Leaflet cartography canvas"
      />
    </figure>
  )
}
