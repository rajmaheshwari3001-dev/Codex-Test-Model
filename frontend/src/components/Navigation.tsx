import { NavLink } from 'react-router-dom'

export default function Navigation() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
    }`

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-700">Aaroh-Saarthi</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Public Transit Assistant</span>
        </div>
        <nav className="flex gap-2">
          <NavLink to="/" className={linkClass} end>
            Passenger
          </NavLink>
          <NavLink to="/fleet" className={linkClass}>
            Fleet Intelligence
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
