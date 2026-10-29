import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PassengerPage from './pages/PassengerPage'
import FleetPage from './pages/FleetPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PassengerPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
