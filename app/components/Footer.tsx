export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">BOANIPA</h3>
            <p className="mt-2 text-sm text-gray-600">
              A small online market bringing the best local products to your
              doorstep.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-orange-600">
                  All Products
                </a>
              </li>
              <li>
                <a href="/category" className="hover:text-orange-600">
                  Categories
                </a>
              </li>
              <li>
                <a href="/cart" className="hover:text-orange-600">
                  Cart
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Support</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/login" className="hover:text-orange-600">
                  Account
                </a>
              </li>
              <li>
                <a href="/reset-password" className="hover:text-orange-600">
                  Reset password
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-orange-600">
                  Contact us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Follow</h4>
            <p className="mt-3 text-sm text-gray-600">
              Stay connected — follow us on social media for updates and
              promotions.
            </p>
            <div className="mt-4 flex space-x-3">
              <a aria-label="Twitter" href="#" className="text-gray-500 hover:text-gray-900">Twitter</a>
              <a aria-label="Facebook" href="#" className="text-gray-500 hover:text-gray-900">Facebook</a>
              <a aria-label="Instagram" href="#" className="text-gray-500 hover:text-gray-900">Instagram</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
          © {year} BOANIPA — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
