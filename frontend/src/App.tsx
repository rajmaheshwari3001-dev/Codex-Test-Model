import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PassengerPage from './pages/PassengerPage'
import FleetPage from './pages/FleetPage'
import ReportsPage from './pages/ReportsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PassengerPage />} />
        <Route path="/map" element={<PassengerPage defaultTab="map" />} />
        <Route path="/saved" element={<PassengerPage defaultTab="saved" />} />
        <Route path="/chat" element={<PassengerPage defaultTab="chat" />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
