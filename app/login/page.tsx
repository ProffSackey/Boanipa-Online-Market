"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error' | 'success'>('info');
  const [loading, setLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [signUpCooldown, setSignUpCooldown] = useState(0);
  const router = useRouter();

  const handleGoogle = async () => {
    setMessage('Redirecting to Google...');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setMessage(error.message);
  };

  // if already authenticated, send to user page immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/user');
      }
    });
  }, [router]);

  // Cooldown timers are kept in component state only (no localStorage persistence)
  useEffect(() => {
    // nothing to restore on mount
  }, []);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Enter an email');
      setMessageType('error');
      return;
    }
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }
    if (signingUp) {
      if (!password) {
        setMessage('Enter a password');
        setMessageType('error');
        return;
      }
      if (signUpCooldown > 0) {
        setMessage(`Please wait ${signUpCooldown} seconds before trying again`);
        setMessageType('error');
        return;
      }
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setLoading(false);
      
      if (!response.ok) {
        setMessage(data.error || 'Sign up failed');
        setMessageType('error');
      } else {
        setMessage('Account created! Check your email to verify.');
        setMessageType('success');
        
        // Set cooldown timer (60 seconds) for sign-up
        setSignUpCooldown(60);
        const cooldownInterval = setInterval(() => {
          setSignUpCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimeout(() => router.push('/user'), 2000);
      }
    } else {
      // For sign-in, suggest creating an account
      setMessage(`No account found for ${email}. Please create an account first.`);
      setMessageType('error');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Enter your email address');
      setMessageType('error');
      return;
    }
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }
    if (resetCooldown > 0) {
      setMessage(`Please wait ${resetCooldown} seconds before trying again`);
      setMessageType('error');
      return;
    }

    setLoading(true);

    // First check if user exists
    try {
      const checkResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const { exists } = await checkResponse.json();

      if (!exists) {
        setLoading(false);
        setMessage("Account doesn't exist. Please create one.");
        setMessageType('error');
        return;
      }
    } catch (err) {
      console.error('Error checking user:', err);
      setLoading(false);
      setMessage('Error checking account. Please try again.');
      setMessageType('error');
      return;
    }

    // If user exists, send reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageType('error');
    } else {
      setMessage('Password reset link sent to your email. Check your inbox.');
      setEmail('');

      // Set cooldown timer (60 seconds)
      setResetCooldown(60);

      const cooldownInterval = setInterval(() => {
        setResetCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-white p-6 sm:p-8 text-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-orange-600">
          {forgotPassword ? 'Reset Password' : signingUp ? 'Create an Account' : 'Sign In or Create Account'}
        </h1>

        {!forgotPassword && (
          <>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 px-4 py-3 sm:py-4 rounded-lg mb-4 hover:bg-gray-50 transition font-semibold text-sm sm:text-base"
            >
              {/* inline Google logo SVG */}
              <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.2-4.2-50.4H272v95.5h146.9c-6.3 34-25 62.8-53.4 82v67h86.3c50.4-46.4 80-114.6 80-194.1z"/>
                <path fill="#34A853" d="M272 544.3c72.6 0 133.6-23.9 178.1-64.9l-86.3-67c-24 16.1-54.6 25.6-91.8 25.6-70.5 0-130.3-47.6-151.6-111.6H32.5v69.8c44.6 88.3 136.7 148.7 239.5 148.7z"/>
                <path fill="#FBBC05" d="M120.4 323.4c-10.6-31.9-10.6-66.1 0-98L32.5 155.6c-38.2 76.4-38.2 166.8 0 243.2l87.9-75.4z"/>
                <path fill="#EA4335" d="M272 107.7c37.3 0 70.8 12.8 97.1 37.9l72.8-72.8C405.6 23.9 344.6 0 272 0 169.2 0 77.1 60.4 32.5 148.7l87.9 69.8c21.3-64 81.1-111.6 151.6-111.6z"/>
              </svg>
              Continue with Google
            </button>
            <div className="text-center my-4 text-gray-400 text-sm">OR</div>
          </>
        )}

        {forgotPassword ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 sm:gap-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 sm:py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              placeholder="Enter your email address"
              disabled={loading || resetCooldown > 0}
              required
            />
            <button 
              type="submit" 
              disabled={loading || resetCooldown > 0}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-4 rounded-lg font-semibold transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg"
            >
              {loading ? 'Sending...' : resetCooldown > 0 ? `Resend in ${resetCooldown}s` : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setForgotPassword(false);
                setMessage('');
                setEmail('');
              }}
              className="text-center text-blue-600 hover:underline font-semibold text-sm sm:text-base py-2 transition"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmail} className="flex flex-col gap-4 sm:gap-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 sm:py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              placeholder="Enter your email address"
              disabled={loading || (signingUp && signUpCooldown > 0)}
              required
            />
            {signingUp && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 sm:py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
                placeholder="Choose a password"
                disabled={loading || signUpCooldown > 0}
              />
            )}
            <button 
              type="submit" 
              disabled={loading || (signingUp && signUpCooldown > 0)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-4 rounded-lg font-semibold transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg"
            >
              {loading ? 'Processing...' : signingUp ? (signUpCooldown > 0 ? `Try again in ${signUpCooldown}s` : 'Create Account') : 'Check Account'}
            </button>
          </form>
        )}

        {message && (
          <p className={`mt-4 text-center text-sm sm:text-base p-3 sm:p-4 rounded-lg font-medium ${
            messageType === 'error' ? 'bg-red-100 text-red-700' :
            messageType === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </p>
        )}

        {!forgotPassword && (
          <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 sm:pt-6">
            {signingUp ? (
              <p className="text-center text-sm sm:text-base text-gray-600">
                Already have an account?{' '}
                <button className="text-orange-500 hover:underline font-semibold transition" onClick={() => {
                  setSigningUp(false);
                  setPassword('');
                  setMessage('');
                }}>
                  Sign in
                </button>
              </p>
            ) : (
              <>
                <p className="text-center text-sm sm:text-base mb-3 sm:mb-4">
                  <button
                    className="text-orange-500 hover:underline font-semibold transition"
                    onClick={() => {
                      setForgotPassword(true);
                      setMessage('');
                    }}
                  >
                    Forgot your password?
                  </button>
                </p>
                <p className="text-center text-sm sm:text-base text-gray-600">
                  Don't have an account?{' '}
                  <button className="text-orange-500 hover:underline font-semibold transition" onClick={() => {
                    setSigningUp(true);
                    setMessage('');
                  }}>
                    Create one now
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
