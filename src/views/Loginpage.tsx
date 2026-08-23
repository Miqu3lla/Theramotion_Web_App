import LoginTitle from '../components/Login/LoginTitle';
import LoginForm from '../components/Login/LoginForm';

export default function Loginpage() {
  return (
    <div className="tm-login-shell">
      {/* Left side hero */}
      <div className="tm-login-hero">
        <LoginTitle />
      </div>

      {/* Right side login form */}
      <div className="tm-login-form-side">
        <LoginForm />
      </div>
    </div>
  );
}
