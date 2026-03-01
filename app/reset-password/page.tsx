"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error' | 'success'>('info');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is in a password recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        setMessage('Invalid or expired reset link');
        setMessageType('error');
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageType('error');
    } else {
      setMessage('Password updated successfully. Redirecting to login...');
      setMessageType('success');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 text-gray-800 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
          Reset Your Password
        </h1>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-3 py-2 rounded"
            placeholder="Enter new password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border px-3 py-2 rounded"
            placeholder="Confirm new password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm p-3 rounded ${
            messageType === 'error' ? 'bg-red-100 text-red-700' :
            messageType === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
