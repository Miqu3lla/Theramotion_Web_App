import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { LoginUser, isloading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await LoginUser(email, password);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      navigate('/home');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-6">
        <img 
          alt="Theramotion Brand Logo" 
          className="h-16 w-auto object-contain" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLt2WG-meETgpXMNJFCgP1SU0TAYamhONCcwrh7FwxBBj_8V01EBXb2MnQGgcM5h1S_jYT04IWSIltJc6oC-PM4V9yT_aMtyNTUGbE14cZYHVAtgSCI2mD3LBBzWOT9kNLTC4Aukx1UrbMMWKEvJCMaOU6eBzPBYshpwdpfpfKPpsfQi0bxSPDeGIei2hNl5MoBPyvYNtqgNIse6_JQSVAYLFZql1Z_VTRg6w9gzm3CZkzZmltzQoDqQm6M"
        />
      </div>
      <div className="text-center mb-10">
        <h2 className="text-headline-md font-headline-md font-semibold text-on-surface mb-1">Welcome back</h2>
        <p className="text-body-md font-body-md text-secondary">Enter your credentials to access the clinical portal.</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container rounded text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-label-md font-label-md font-semibold text-on-surface-variant mb-1" htmlFor="email">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="text-secondary w-5 h-5" />
            </div>
            <input 
              className="block w-full pl-16 pr-3 py-3 border border-outline-variant rounded text-body-md font-body-md text-on-surface bg-surface-container-lowest focus:ring-primary focus:border-primary transition-colors" 
              id="email" 
              name="email" 
              placeholder="doctor@theramotion.com" 
              required 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-label-md font-label-md font-semibold text-on-surface-variant mb-1" htmlFor="password">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-secondary w-5 h-5" />
            </div>
            <input 
              className="block w-full pl-16 pr-16 py-3 border border-outline-variant rounded text-body-md font-body-md text-on-surface bg-surface-container-lowest focus:ring-primary focus:border-primary transition-colors" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button 
                aria-label="Toggle password visibility" 
                className="text-label-md font-label-md font-semibold text-primary hover:text-primary-fixed-variant transition-colors focus:outline-none flex items-center gap-1" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input 
              className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-lowest" 
              id="remember-me" 
              name="remember-me" 
              type="checkbox"
            />
            <label className="ml-2 block text-body-sm font-body-sm text-on-surface-variant" htmlFor="remember-me">
              Remember me
            </label>
          </div>
          <div className="text-body-sm font-body-sm">
            <a className="font-medium text-primary hover:text-primary-fixed-variant transition-colors" href="#">
              Forgot password?
            </a>
          </div>
        </div>
        <div>
          <button 
            className="w-full flex justify-center py-3 px-3 border border-transparent rounded text-title-lg font-title-lg font-semibold text-on-primary bg-primary-container hover:bg-primary-fixed-variant transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm disabled:opacity-50" 
            type="submit"
            disabled={isloading}
          >
            {isloading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
      <div className="mt-16 text-center">
        <p className="text-body-sm font-body-sm text-secondary">
          Need help? <a className="text-primary font-medium hover:underline" href="#">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
