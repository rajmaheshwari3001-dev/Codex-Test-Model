import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
      <p className="text-gray-500 mb-4">Page not found.</p>
      <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
        Back to Passenger Assistant
      </Link>
    </div>
  )
}
