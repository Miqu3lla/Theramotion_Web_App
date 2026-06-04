import ImagesSection from '../components/Login/ImagesSection';
import LoginForm from '../components/Login/LoginForm';
import LoginTitle from '../components/Login/LoginTitle';

export default function Loginpage() {
  return (
    <div className="bg-surface min-h-screen flex flex-col md:flex-row">
      {/* Left Side Hero */}
      <div className="w-full md:w-1/2 relative flex flex-col items-center justify-center p-16 min-h-[30vh] md:min-h-screen text-center overflow-hidden bg-black">
        <ImagesSection />
        {/* Subtle Vignette / Shadow Overlay */}
        <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none"></div>
        {/* Content */}
        <LoginTitle />
      </div>

      {/* Right Side Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-surface">
        <LoginForm />
      </div>
    </div>
  );
}
