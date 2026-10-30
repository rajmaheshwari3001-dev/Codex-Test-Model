export type MapStyle =
  | 'voyager'
  | 'dark'
  | 'positron'
  | 'satellite'
  | 'streets'
  | 'topo'
  | 'hot'
  | 'natgeo'
  | 'gray'
  | 'dark_gray'
  | 'sandstone'

export interface MapStyleConfig {
  id: MapStyle
  name: string
  engine: string
  category: 'apple' | 'satellite' | 'transit'
  tagline: string
  badge: string
  swatchBg: string
  url: string
  attribution: string
  maxZoom: number
  subdomains: string
}

export const MAP_STYLES_CATALOG: MapStyleConfig[] = [
  {
    id: 'voyager',
    name: 'Apple Maps (Voyager)',
    engine: 'CARTO Fastly CDN',
    category: 'apple',
    tagline: 'Signature Apple Maps look with smooth roads, clean pastel greenery & zero clutter.',
    badge: 'Apple Style',
    swatchBg: 'from-[#E0F2FE] via-[#BAE6FD] to-[#38BDF8]',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  {
    id: 'dark',
    name: 'Apple Midnight (Dark)',
    engine: 'CARTO Dark Matter',
    category: 'apple',
    tagline: 'Apple Dark Mode with deep obsidian contrast for glowing metro lines.',
    badge: 'Night Mode',
    swatchBg: 'from-[#0F172A] via-[#1E293B] to-[#334155]',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  {
    id: 'positron',
    name: 'Minimal Light (Positron)',
    engine: 'CARTO Positron',
    category: 'apple',
    tagline: 'Ultra-clean Apple monochrome style for high readability and focus.',
    badge: 'Clean Vector',
    swatchBg: 'from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1]',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  {
    id: 'satellite',
    name: 'Photoreal Satellite',
    engine: 'Esri World Imagery',
    category: 'satellite',
    tagline: 'High-resolution aerial satellite photography across Delhi NCR & Yamuna.',
    badge: 'Photoreal',
    swatchBg: 'from-[#064E3B] via-[#047857] to-[#10B981]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    subdomains: 'abc',
  },
  {
    id: 'streets',
    name: 'World Street Navigation',
    engine: 'Esri World Streets',
    category: 'satellite',
    tagline: 'High-detail turn-by-turn arterial clarity, flyovers, and highways.',
    badge: 'Navigation',
    swatchBg: 'from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'topo',
    name: 'Delhi Topographic',
    engine: 'Esri World Topo',
    category: 'satellite',
    tagline: 'Contour elevations, Delhi Ridge green belt, and terrain relief.',
    badge: 'Topographic',
    swatchBg: 'from-[#DCFCE7] via-[#BBF7D0] to-[#22C55E]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, USGS, FAO',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'hot',
    name: 'Urban Transit (HOT)',
    engine: 'OSM Humanitarian',
    category: 'transit',
    tagline: 'Pedestrian corridors, bus priority lanes, and city landmarks.',
    badge: 'Transit Focus',
    swatchBg: 'from-[#FFE4E6] via-[#FECDD3] to-[#FB7185]',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OSM',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'natgeo',
    name: 'National Geographic',
    engine: 'Esri NatGeo',
    category: 'transit',
    tagline: 'Classic warm parchment cartography with landmark typography.',
    badge: 'Vintage',
    swatchBg: 'from-[#FEF3C7] via-[#FDE68A] to-[#D97706]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; National Geographic, Esri',
    maxZoom: 16,
    subdomains: 'abc',
  },
  {
    id: 'gray',
    name: 'Light Gray Canvas',
    engine: 'Esri Canvas Light',
    category: 'transit',
    tagline: 'Soft studio gray base engineered for bus GPS & route clarity.',
    badge: 'Data Canvas',
    swatchBg: 'from-[#F1F5F9] via-[#E2E8F0] to-[#94A3B8]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin',
    maxZoom: 16,
    subdomains: 'abc',
  },
  {
    id: 'dark_gray',
    name: 'Dark Slate Canvas',
    engine: 'Esri Canvas Dark',
    category: 'transit',
    tagline: 'Modern midnight charcoal canvas for night travel and telemetry.',
    badge: 'Dark Slate',
    swatchBg: 'from-[#0F172A] via-[#1E293B] to-[#475569]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
    subdomains: 'abc',
  },
]
