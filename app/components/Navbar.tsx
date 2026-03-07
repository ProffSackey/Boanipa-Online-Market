"use client";

import Link from "next/link";
import { ShoppingCartIcon, UserCircleIcon, MagnifyingGlassIcon, BellIcon, Bars3Icon, XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { getGuestCartCount, subscribeToGuestCartChanges, subscribeToUserCartChanges } from '../../lib/cartUtils';
import { getUserCartCount } from '../../lib/supabaseService';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [guestCartCount, setGuestCartCount] = useState(0);
  const [userCartCount, setUserCartCount] = useState(0);

  // don't render on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [categories, setCategories] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>('');

  // Show user cart count if logged in, otherwise show guest cart count
  const cartCount = user ? userCartCount : guestCartCount;

  useEffect(() => {
    // Initialize guest cart count
    const initialCount = getGuestCartCount();
    console.log('[Navbar] Initial guest cart count:', initialCount);
    setGuestCartCount(initialCount);

    // Subscribe to guest cart changes (real-time updates)
    const unsubscribe = subscribeToGuestCartChanges((count) => {
      console.log('[Navbar] Guest cart count updated to:', count);
      setGuestCartCount(count);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Fetch user's cart count if logged in
    const fetchUserCartCount = async (email: string) => {
      try {
        const count = await getUserCartCount(email);
        console.log('[Navbar] User cart count:', count);
        setUserCartCount(count);
      } catch (error) {
        console.error('[Navbar] Error fetching user cart count:', error);
      }
    };

    if (user?.email) {
      fetchUserCartCount(user.email);

      // Subscribe to cart_items changes for this user in real-time
      const channel = supabase
        .channel(`cart-items-${user.email}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `customer_email=eq.${user.email}`,
          },
          () => {
            // Refetch cart count on any change
            fetchUserCartCount(user.email);
          }
        )
        .subscribe();

      // Also subscribe to custom user cart change events
      const unsubscribeCustom = subscribeToUserCartChanges(user.email, () => {
        fetchUserCartCount(user.email);
      });

      return () => {
        channel.unsubscribe();
        unsubscribeCustom();
      };
    }
  }, [user]);

  // Listen for an immediate count update dispatched after server add operations
  useEffect(() => {
    const handler = (ev: any) => {
      try {
        const detail = ev?.detail;
        if (detail?.count != null) {
          console.log('[Navbar] userCartCountUpdated event received:', detail.count);
          setUserCartCount(Number(detail.count));
        }
      } catch (e) {
        console.error('userCartCountUpdated handler error', e);
      }
    };
    window.addEventListener('userCartCountUpdated', handler as EventListener);
    return () => window.removeEventListener('userCartCountUpdated', handler as EventListener);
  }, []);

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
        setUserCartCount(0);
      }
    });

    // Realtime subscription to categories so navbar updates immediately
    const channel = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        try {
          const p: any = payload;
          const ev = p.eventType || p.event || p.type || '';
          const newRec = p.new || null;
          const oldRec = p.old || null;
          setCategories((prev) => {
            const list = Array.isArray(prev) ? [...prev] : [];
            if (ev === 'INSERT') {
              if (newRec && newRec.name && !list.includes(newRec.name)) {
                return [...list, newRec.name];
              }
              return list;
            }
            if (ev === 'UPDATE') {
              if (oldRec?.name && newRec?.name) {
                return list.map((c) => (c === oldRec.name ? newRec.name : c));
              }
              return list;
            }
            if (ev === 'DELETE') {
              if (oldRec?.name) return list.filter((c) => c !== oldRec.name);
              return list;
            }
            return list;
          });
        } catch (e) {
          console.error('category realtime handler error', e);
        }
      })
      .subscribe();
    return () => {
      subscription?.unsubscribe();
      try {
        channel.unsubscribe();
      } catch {}
    };
  }, []);

  return (
    <nav className="bg-white shadow sticky top-0 z-50 w-full">
      {/* top row with logo and icons - visible on all screens */}
      <div className="w-full px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <div className="flex items-center gap-2">
            {/* mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden p-1 text-gray-600 hover:text-gray-900 transition"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-lg sm:text-2xl text-gray-800 font-bold whitespace-nowrap">
                BOANIPA
              </Link>
            </div>
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
            {user ? (
              <Link href="/notifications" className="text-gray-600 hover:text-gray-900 transition p-1">
                <BellIcon className="h-7 w-7 sm:h-9 sm:w-9" />
              </Link>
            ) : null}
            {user ? (
              <Link href="/messages" className="text-gray-600 hover:text-gray-900 transition p-1">
                <EnvelopeIcon className="h-7 w-7 sm:h-9 sm:w-9" />
              </Link>
            ) : null}
            <Link href="/cart" className="text-gray-600 hover:text-gray-900 transition p-1 relative">
              <ShoppingCartIcon className="h-7 w-7 sm:h-9 sm:w-9" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-5 w-auto px-1 flex items-center justify-center whitespace-nowrap -translate-y-1 translate-x-1">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href={user ? "/user" : "/login"} className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition p-1">
              <UserCircleIcon className="h-7 w-7 sm:h-9 sm:w-9" />
              {firstName && <span className="hidden sm:inline text-xs sm:text-sm font-semibold">{firstName}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Search bar for mobile - full-width centered row with icon */}
      <div className="sm:hidden text-gray-600 bg-gray-50 border-t border-gray-200 w-full px-3 py-3">
        <div className="max-w-md mx-auto">
          <form className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Search for products, categories..."
                className="w-full pl-11 pr-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* category row (hidden on mobile; categories available via menu) */}
      <div className="hidden sm:block text-gray-700 bg-gray-50 border-t border-gray-200 w-full overflow-x-auto">
        <div className="w-full px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-6 py-2 text-[15px] sm:text-sm whitespace-nowrap overflow-x-auto scrollbar-hide">
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

      {/* Mobile category drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 bg-white p-4 shadow-lg overflow-auto">
            <button className="absolute top-3 right-3 p-1 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Categories</h3>
            <nav>
              <ul className="space-y-2 text-gray-700">
                {categories.length === 0 && <li className="text-sm text-gray-500">No categories</li>}
                {categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/category/${cat
                        .toLowerCase()
                        .replace(/ & /g, "-")
                        .replace(/ /g, "-")}`}
                      className="block px-2 py-2 rounded hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </nav>
  );
}
