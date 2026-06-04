import { BrowserRouter, Routes, Route } from "react-router-dom"
import { supabase } from "./utils/db"
import Loginpage from "./views/Loginpage"

export default function App() {

  async function checkAuth() {
    const session = await supabase.auth.getSession()
    if (session.error) {
      console.log(session.error.message)
      return
    }
    
    if (!session.data.session) {
      // You can add additional logic here if needed
    }
  }

  checkAuth()
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loginpage />} />
        <Route path="/home" element={<div>Home - Protected Route Placeholder</div>} />
      </Routes>
    </BrowserRouter>
  )
}


