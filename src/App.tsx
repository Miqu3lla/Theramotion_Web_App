import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./utils/db"
export default function App() {

  async function checkAuth() {
    const session = await supabase.auth.getSession()
    if (session.error) {
      console.log(session.error.message)
      return
    }
    
    if (!session.data.session) {
      return <Navigate to="/" replace />
    }
  }

  checkAuth()
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
      </BrowserRouter>
  )
}


