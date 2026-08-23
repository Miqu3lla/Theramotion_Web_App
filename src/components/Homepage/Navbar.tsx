import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { logoutUser, user } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  // Close the avatar menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

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
    <header className="tm-page" style={{ minHeight: 'auto' }}>
      <div className="tm-wrap" style={{ padding: '24px 32px 0' }}>
        <div className="tm-header" style={{ marginBottom: 0 }}>
          <div className="tm-brand">
            <div className="tm-brand-mark">
              <svg viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 10H6L8.5 3L13 17L15.5 10H25" stroke="#F1EDE4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="tm-brand-name">Theramotion</span>
          </div>

          <div className="tm-avatar-wrap" ref={menuRef}>
            <button
              className="tm-avatar"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="Account menu"
            >
              {avatarInitials}
            </button>
            {menuOpen && (
              <div className="tm-avatar-menu">
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
