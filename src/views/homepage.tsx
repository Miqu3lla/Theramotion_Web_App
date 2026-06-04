
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Homepage() {
  const { logoutUser, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant max-w-lg w-full text-center">
        <h1 className="text-display font-display font-bold text-on-surface mb-6">
          Welcome to Theramotion
        </h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant mb-10">
          This is the protected homepage. You are successfully logged in!
        </p>
        
        {user?.email && (
          <p className="text-body-md font-body-md text-secondary mb-6">
            Logged in as: <span className="font-semibold text-primary">{user.email}</span>
          </p>
        )}

        <button 
          onClick={handleLogout}
          className="px-6 py-3 bg-error text-title-lg font-title-lg text-on-error font-semibold rounded hover:bg-error-container hover:text-on-error-container transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
