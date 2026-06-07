
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { logoutUser, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  // Derive initials from the user's full name (user_metadata) or email so we
  // never need to load a third-party avatar URL, which would leak the user's
  // IP to Google on every authenticated page load.
  const avatarInitials = (() => {
    const fullName: string =
      user?.user_metadata?.full_name || user?.user_metadata?.name || '';
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    // Fall back to the first character of the email local part
    const email = user?.email ?? '';
    return email ? email[0].toUpperCase() : '?';
  })();

  return (
    <header className="w-full z-40 border-b border-outline-variant shadow-sm bg-surface-container-lowest flex justify-between items-center px-8 h-16 transition-all duration-200">
      <div className="flex items-center h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mr-8">
          <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor" className="text-primary"><path d="M116-410q-21 0-35.5-14.5T66-460q0-21 14.5-35.5T116-510h128l108-306q8-23 29-35.5t45-8.5q24 4 41 21t22 40l105 450 63-146q9-20 28.5-32.5T730-540h114q21 0 35.5 14.5T894-490q0 21-14.5 35.5T844-440H753l-83 194q-9 20-28 32t-43 7q-23-4-40.5-20.5T536-267L434-703l-87 248q-8 23-28.5 34T274-410H116Z"/></svg>
          <h1 className="font-headline-md text-headline-md font-bold text-primary" style={{ fontSize: '20px' }}>Theramotion</h1>
        </div>
        {/* Navigation Links */}
        {/* layoutId="navbar-indicator" is intentionally shared between the two
            motion divs so framer-motion slides the indicator between links. */}
        <nav className="flex gap-6 h-full relative">
          <Link
            className={`relative flex items-center h-full pb-1 font-label-md text-label-md transition-colors duration-200 ${location.pathname === '/home' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            to="/home"
          >
            Dashboard
            {location.pathname === '/home' && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
          <Link
            className={`relative flex items-center h-full pb-1 font-label-md text-label-md transition-colors duration-200 ${location.pathname === '/notes' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            to="/notes"
          >
            Notes
            {location.pathname === '/notes' && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={handleLogout}
          className="text-label-md font-bold text-on-surface-variant hover:text-error transition-colors"
        >
          Sign Out
        </button>
        {/* Avatar derived from the authenticated user's name/email — no external
            CDN requests that would leak IP to third parties. */}
        <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary border border-outline-variant flex items-center justify-center shadow-sm text-label-md font-bold select-none">
          {avatarInitials}
        </div>
      </div>
    </header>
  );
}