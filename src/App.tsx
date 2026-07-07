import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Classrooms from './pages/Classrooms'
import Upload from './pages/Upload'
import Analysis from './pages/Analysis'

function App() {
  const user = useAppStore((state) => state.user)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/classrooms" element={user ? <Classrooms /> : <Navigate to="/login" />} />
        <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} />
        <Route path="/analysis/:id" element={user ? <Analysis /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
