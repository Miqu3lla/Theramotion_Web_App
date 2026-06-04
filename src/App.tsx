import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { supabase } from "./utils/db"
import Loginpage from "./views/Loginpage"
import Homepage from "./views/homepage"
import useAuthStore from "./store/authStore"

export default function App() {

  const { user } = useAuthStore()

  useEffect(() => {
    // It checks the current session AND listens for any future login/logout events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Manually update the Zustand store with the user data from Supabase
      useAuthStore.setState({ user: session?.user || null })
    })
  
    return () => subscription.unsubscribe()
  }, [])



  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={user ? <Homepage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Loginpage /> : <Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  )
}
