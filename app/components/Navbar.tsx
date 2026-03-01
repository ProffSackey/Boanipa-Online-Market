"use client";

import Link from "next/link";
import { ShoppingCartIcon, UserCircleIcon, MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Navbar() {
  const pathname = usePathname();

  // don't render on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [categories, setCategories] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    fetch('/api/categories')
      .then(async (r) => {
        if (!r.ok) {
          console.error('failed to fetch categories', r.status);
          return [] as string[];
        }
        try {
          return await r.json();
        } catch (e) {
          console.error('could not parse categories response', e);
          return [] as string[];
        }
      })
      .then(setCategories)
      .catch(console.error);

    // Fetch user session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session?.user) {
          setUser(data.session.user);
          const fullName = data.session.user.user_metadata?.full_name || data.session.user.email || '';
          const firstName = fullName.split(' ')[0];
          setFirstName(firstName);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch session:', err);
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        const fullName = session.user.user_metadata?.full_name || session.user.email || '';
        const firstName = fullName.split(' ')[0];
        setFirstName(firstName);
      } else {
        setUser(null);
        setFirstName('');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <nav className="bg-white shadow">
      {/* top row with logo, search, icons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl text-gray-800 font-bold">
              BOANIPA
            </Link>
          </div>

          {/* search box */}
          <div className="flex-1 flex justify-center text-gray-600 mx-4">
            <form className="flex items-center max-w-2xl w-full">
              <input
                type="text"
                name="q"
                placeholder="Search..."
                className="flex-grow border rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Search
              </button>
            </form>
          </div>

          {/* icons */}
          <div className="flex items-center gap-6">
            <Link href="/notifications" className="text-gray-600 hover:text-gray-900">
              <BellIcon className="h-8 w-8" />
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-gray-900">
              <ShoppingCartIcon className="h-8 w-8" />
            </Link>
            <Link href={user ? "/user" : "/login"} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <UserCircleIcon className="h-8 w-8" />
              {firstName && <span className="text-sm">{firstName}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* category row */}
      <div className="bg-gray-50 text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto py-2">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat
                  .toLowerCase()
                  .replace(/ & /g, "-")
                  .replace(/ /g, "-")}`}
                className="text-sm whitespace-nowrap hover:underline"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
