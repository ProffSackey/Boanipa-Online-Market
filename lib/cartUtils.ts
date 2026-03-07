/**
 * Guest Cart Utility - Manages cart items in localStorage for non-authenticated users
 */

export interface GuestCartItem {
  productId: string;
  quantity: number;
  name: string;
  price: string;
  image_url?: string;
}

const GUEST_CART_KEY = 'guestCart';
const GUEST_CART_COUNT_KEY = 'guestCartCount';
const GUEST_CART_CHANGE_EVENT = 'guestCartChange';
const USER_CART_CHANGE_EVENT = 'userCartChange';

/**
 * Dispatch custom event when guest cart changes (for UI updates)
 */
const dispatchCartChangeEvent = (): void => {
  if (typeof window === 'undefined') return;
  // read precomputed count if available to avoid parsing the entire cart on the main thread
  const stored = typeof window !== 'undefined' ? localStorage.getItem(GUEST_CART_COUNT_KEY) : null;
  const numericCount = stored ? Number(stored) || 0 : getGuestCartCount();
  console.log('[cartUtils] Dispatching guestCartChange event with count:', numericCount);
  try {
    window.dispatchEvent(new CustomEvent(GUEST_CART_CHANGE_EVENT, {
      detail: { count: numericCount },
    }));
  } catch (e) {
    try {
      window.dispatchEvent(new CustomEvent(GUEST_CART_CHANGE_EVENT));
    } catch (err) {
      console.error('[cartUtils] Failed to dispatch guest cart change event', err);
    }
  }
};

/**
 * Get all guest cart items from localStorage
 */
export const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    const parsed = cart ? JSON.parse(cart) : [];
    // Normalize parsed items to ensure quantity is a number and productId is string
    return (parsed || []).map((it: any) => ({
      productId: String(it.productId),
      quantity: Number(it.quantity) || 0,
      name: it.name,
      price: it.price,
      image_url: it.image_url,
    }));
  } catch {
    return [];
  }
};

/**
 * Add item to guest cart
 */
export const addToGuestCart = (item: GuestCartItem, maxStock: number = 999): void => {
  if (typeof window === 'undefined') return;
  try {
    console.log('[cartUtils] Adding to guest cart:', item, 'maxStock:', maxStock);
    const cart = getGuestCart();
    const existingIndex = cart.findIndex(c => c.productId === item.productId);
    
    if (existingIndex >= 0) {
      let newQuantity = cart[existingIndex].quantity + item.quantity;
      if (newQuantity > maxStock) {
        newQuantity = maxStock;
        console.warn('[cartUtils] Capped quantity to available stock:', { productId: item.productId, requested: cart[existingIndex].quantity + item.quantity, capped: newQuantity });
      }
      cart[existingIndex].quantity = newQuantity;
      console.log('[cartUtils] Updated existing item quantity to:', cart[existingIndex].quantity);
    } else {
      let quantity = item.quantity;
      if (quantity > maxStock) {
        quantity = maxStock;
        console.warn('[cartUtils] Capped new item quantity to available stock:', { productId: item.productId, requested: item.quantity, capped: quantity });
      }
      cart.push({ ...item, quantity });
      console.log('[cartUtils] Added new item to cart');
    }
    
    // persist cart and update lightweight count key (avoid parsing on subscribers)
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    const totalCount = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    localStorage.setItem(GUEST_CART_COUNT_KEY, String(totalCount));
    console.log('[cartUtils] Cart saved to localStorage, total items:', cart.length, 'count:', totalCount);
    dispatchCartChangeEvent();
  } catch (error) {
    console.error('Error adding to guest cart:', error);
  }
};

/**
 * Update item quantity in guest cart
 */
export const updateGuestCartItem = (productId: string, quantity: number, maxStock: number = 999): void => {
  if (typeof window === 'undefined') return;
  try {
    let cart = getGuestCart();
    if (quantity <= 0) {
      cart = cart.filter(c => c.productId !== productId);
    } else {
      const item = cart.find(c => c.productId === productId);
      if (item) {
        // Cap quantity at available stock
        if (quantity > maxStock) {
          console.warn('[cartUtils] Capped update quantity to available stock:', { productId, requested: quantity, capped: maxStock });
          quantity = maxStock;
        }
        item.quantity = quantity;
      }
    }
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    const totalCount = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    localStorage.setItem(GUEST_CART_COUNT_KEY, String(totalCount));
    dispatchCartChangeEvent();
  } catch (error) {
    console.error('Error updating guest cart:', error);
  }
};

/**
 * Remove item from guest cart
 */
export const removeFromGuestCart = (productId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const cart = getGuestCart().filter(c => c.productId !== productId);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    const totalCount = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    localStorage.setItem(GUEST_CART_COUNT_KEY, String(totalCount));
    dispatchCartChangeEvent();
  } catch (error) {
    console.error('Error removing from guest cart:', error);
  }
};

/**
 * Clear guest cart
 */
export const clearGuestCart = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.setItem(GUEST_CART_COUNT_KEY, '0');
    dispatchCartChangeEvent();
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};

/**
 * Get guest cart count
 */
export const getGuestCartCount = (): number => {
  try {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(GUEST_CART_COUNT_KEY);
    if (stored !== null) return Number(stored) || 0;
  } catch {}
  // fallback to parsing full cart
  return getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
};

/**
 * Subscribe to guest cart changes
 */
export const subscribeToGuestCartChanges = (callback: (count: number) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  console.log('[cartUtils] Setting up guest cart change subscription');
  
  const handleCartChange = (e: Event) => {
    const customEvent = e as CustomEvent;
    // Prefer the numeric count sent in event; if missing, read lightweight key from localStorage
    let count = Number(customEvent.detail?.count);
    if (!Number.isFinite(count)) {
      try {
        const stored = localStorage.getItem(GUEST_CART_COUNT_KEY);
        count = stored ? Number(stored) || 0 : getGuestCartCount();
      } catch {
        count = getGuestCartCount();
      }
    }
    console.log('[cartUtils] Received guestCartChange event with count:', count);
    callback(count);
  };
  
  window.addEventListener(GUEST_CART_CHANGE_EVENT, handleCartChange);
  
  // Return unsubscribe function
  return () => {
    console.log('[cartUtils] Unsubscribing from guest cart changes');
    window.removeEventListener(GUEST_CART_CHANGE_EVENT, handleCartChange);
  };
};

/**
 * Subscribe to user cart changes (for UI updates)
 */
export const subscribeToUserCartChanges = (email: string, callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  console.log('[cartUtils] Setting up user cart change subscription for:', email);
  
  const handleCartChange = (e: Event) => {
    const customEvent = e as CustomEvent;
    const eventEmail = customEvent.detail?.email;
    if (eventEmail === email) {
      console.log('[cartUtils] Received userCartChange event for:', email);
      callback();
    }
  };
  
  window.addEventListener(USER_CART_CHANGE_EVENT, handleCartChange);
  
  // Return unsubscribe function
  return () => {
    console.log('[cartUtils] Unsubscribing from user cart changes for:', email);
    window.removeEventListener(USER_CART_CHANGE_EVENT, handleCartChange);
  };
};
