"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function UserPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace('/login');
        } else {
          setUser(data.session.user);
        }
      })
      .catch((err) => {
        console.error(err);
        router.replace('/login');
      });
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
