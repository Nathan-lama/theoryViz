import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WorldPage from './pages/WorldPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/world" element={<WorldPage />} />
        <Route path="/world/:theoryId" element={<WorldPage />} />
      </Routes>
    </BrowserRouter>
  )
}
