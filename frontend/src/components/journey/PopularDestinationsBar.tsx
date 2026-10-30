import { useState } from 'react'

interface DestinationItem {
  id: string
  stopId: string
  name: string
  durationText: string
  imageUrl: string
  fallbackEmoji: string
}

const POPULAR_DESTINATIONS: DestinationItem[] = [
  {
    id: 'india-gate',
    stopId: 'S06',
    name: 'India Gate',
    durationText: '~ 28 min',
    imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=160&q=80',
    fallbackEmoji: '🏛️',
  },
  {
    id: 'connaught-place',
    stopId: 'S05',
    name: 'Connaught Place',
    durationText: '~ 35 min',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=160&q=80',
    fallbackEmoji: '🏛️',
  },
  {
    id: 'akshardham',
    stopId: 'S18',
    name: 'Akshardham',
    durationText: '~ 42 min',
    imageUrl: 'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=160&q=80',
    fallbackEmoji: '🛕',
  },
  {
    id: 'igi-airport',
    stopId: 'S13',
    name: 'IGI Airport',
    durationText: '~ 55 min',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=160&q=80',
    fallbackEmoji: '✈️',
  },
  {
    id: 'hauz-khas',
    stopId: 'S09',
    name: 'Hauz Khas',
    durationText: '~ 38 min',
    imageUrl: 'https://images.unsplash.com/photo-1599818816788-518ca8d33a1e?auto=format&fit=crop&w=160&q=80',
    fallbackEmoji: '🏰',
  },
]

interface Props {
  onSelectDestination: (stopId: string, name: string) => void
  currentDestinationStopId?: string
}

export default function PopularDestinationsBar({
  onSelectDestination,
  currentDestinationStopId,
}: Props) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  return (
    <section aria-label="Popular Delhi Destinations" className="space-y-2 mt-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#C49A43] tracking-wide">
        <span className="text-amber-500 text-sm">★</span>
        <span>Popular Destinations</span>
      </div>

      {/* Horizontal Strip of 5 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {POPULAR_DESTINATIONS.map(dest => {
          const isSelected = currentDestinationStopId === dest.stopId
          const hasError = imageErrors[dest.id]

          return (
            <button
              key={dest.id}
              type="button"
              onClick={() => onSelectDestination(dest.stopId, dest.name)}
              className={`flex items-center gap-2.5 p-2 rounded-2xl bg-white border text-left transition-all duration-200 cursor-pointer shadow-2xs group hover:shadow-sm ${
                isSelected
                  ? 'border-[#C49A43] ring-2 ring-[#C49A43]/30 bg-[#FAF7F2]'
                  : 'border-[#EDE8E1] hover:border-[#C49A43]/50 hover:bg-[#FAF9F6]'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#FAF0D9] shrink-0 border border-[#EDE8E1] flex items-center justify-center">
                {!hasError ? (
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() =>
                      setImageErrors(prev => ({ ...prev, [dest.id]: true }))
                    }
                    loading="lazy"
                  />
                ) : (
                  <span className="text-lg">{dest.fallbackEmoji}</span>
                )}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13px] font-bold text-[#1A2E3B] truncate group-hover:text-[#C49A43] transition-colors">
                  {dest.name}
                </div>
                <div className="text-[11px] font-medium text-[#7A7269] mt-0.5">
                  {dest.durationText}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
