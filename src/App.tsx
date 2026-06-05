import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "./utils/db"
import Loginpage from "./views/Loginpage"
import Homepage from './views/homepage'
import Notespage from './views/Notespage'
import useAuthStore from "./store/authStore"
import Navbar from './components/Homepage/Navbar'

export default function App() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const showNavbar = location.pathname !== '/login'

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.setState({ user: session?.user || null })
      setIsAuthLoading(false)
    })
  
    return () => subscription.unsubscribe()
  }, [])

  if (isAuthLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Homepage /> : <Navigate to="/login" />} />
        <Route path="/home" element={user ? <Homepage /> : <Navigate to="/login" />} />
        <Route path="/notes" element={user ? <Notespage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Loginpage /> : <Navigate to="/home" />} />
      </Routes>
    </div>
  )
}
