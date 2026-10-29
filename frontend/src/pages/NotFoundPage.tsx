import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="text-center py-24 max-w-md mx-auto">
      <div className="text-6xl font-black text-slate-300 mb-3">404</div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Transit Page Not Found</h1>
      <p className="text-sm text-slate-500 mb-6">
        The route or resource you requested is not part of the active Aaroh-Saarthi application.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-900 transition-colors shadow-2xs"
      >
        <span>← Return to Passenger Assistant</span>
      </Link>
    </div>
  )
}
