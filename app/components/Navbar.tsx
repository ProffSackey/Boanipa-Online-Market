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
    <nav className="bg-white shadow sticky top-0 z-50 w-full">
      {/* top row with logo and icons - visible on all screens */}
      <div className="w-full px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-lg sm:text-2xl text-gray-800 font-bold whitespace-nowrap">
              BOANIPA
            </Link>
          </div>

          {/* search box - hidden on mobile, visible on sm and up */}
          <div className="hidden sm:flex flex-1 justify-center text-gray-600 mx-2 md:mx-4">
            <form className="flex items-center max-w-2xl w-full">
              <input
                type="text"
                name="q"
                placeholder="Search..."
                className="flex-grow border rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* icons */}
          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
            <Link href="/notifications" className="text-gray-600 hover:text-gray-900 transition p-0.5">
              <BellIcon className="h-5 w-5 sm:h-8 sm:w-8" />
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-gray-900 transition p-0.5">
              <ShoppingCartIcon className="h-5 w-5 sm:h-8 sm:w-8" />
            </Link>
            <Link href={user ? "/user" : "/login"} className="flex items-center gap-0.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition p-0.5">
              <UserCircleIcon className="h-5 w-5 sm:h-8 sm:w-8" />
              {firstName && <span className="hidden sm:inline text-xs sm:text-sm font-semibold">{firstName}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Search bar for mobile - full-width centered row with icon */}
      <div className="sm:hidden bg-gray-50 border-t border-gray-200 w-full px-3 py-3">
        <div className="max-w-md mx-auto">
          <form className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Search for products, categories..."
                className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-full font-semibold text-base flex-shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* category row */}
      <div className="bg-gray-50 text-gray-600 border-t border-gray-200 w-full overflow-x-auto">
        <div className="w-full px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-6 py-2 text-xs sm:text-sm whitespace-nowrap overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat
                  .toLowerCase()
                  .replace(/ & /g, "-")
                  .replace(/ /g, "-")}`}
                className="hover:text-orange-600 transition py-1 px-0.5 flex-shrink-0"
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
