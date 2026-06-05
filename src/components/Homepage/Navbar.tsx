
export default function Navbar() {
  return (
    <header className="w-full z-40 border-b border-outline-variant shadow-sm bg-surface-container-lowest flex justify-between items-center px-8 h-16 transition-all duration-200">
      <div className="flex items-center h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mr-8">
          <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor" className="text-primary"><path d="M116-410q-21 0-35.5-14.5T66-460q0-21 14.5-35.5T116-510h128l108-306q8-23 29-35.5t45-8.5q24 4 41 21t22 40l105 450 63-146q9-20 28.5-32.5T730-540h114q21 0 35.5 14.5T894-490q0 21-14.5 35.5T844-440H753l-83 194q-9 20-28 32t-43 7q-23-4-40.5-20.5T536-267L434-703l-87 248q-8 23-28.5 34T274-410H116Z"/></svg>
          <h1 className="font-headline-md text-headline-md font-bold text-primary" style={{ fontSize: '20px' }}>Theramotion</h1>
        </div>
        {/* Navigation Links */}
        <nav className="flex gap-6 h-full">
          <a className="flex items-center h-full text-primary border-b-2 border-primary pb-1 font-label-md text-label-md transition-all duration-200" href="#">Dashboard</a>
          <a className="flex items-center h-full text-on-surface-variant hover:text-primary font-label-md text-label-md transition-all duration-200" href="#">Notes</a>
        </nav>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Profile Avatar */}
        <button className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary overflow-hidden border border-outline-variant flex items-center justify-center shadow-sm">
          <img alt="Clinician Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDckpXTtlWnkeBm1Dtu5AfBfUmpIcKIcu3Dt_1FcDqBPpxcS6fwIE_82Nt0PqeIDRBU5LaJ4oqcZa5qTYnARZPbxiAi-W7iHRmyIrtzat6MJLUBJjyT8kzyc9vlfcXBqMaA3evuc0jpcj8IU6Z1U03mcKo-JCRVdxuehReu6BolQ2CtR3yTDCykUXVFtKmNVwwQFKhN_jWi59D2FjUCCH6yVeBLNBmy8_YIky8YOcwQTy_IBaG1hMamtc6GdXXAow_oczSs6kP9JjdW"/>
        </button>
      </div>
    </header>
  );
}
