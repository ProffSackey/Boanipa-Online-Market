export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1C1C1C] border-t border-[#2A2A2A] text-[#F2F2F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-[#F2F2F2]">BOANIPA</h3>
            <p className="mt-2 text-sm text-[#D9D9D9]">
              An online market bringing you the best products to your
              doorstep. We offer a secure payment options and efficient delivery services
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F2F2F2]">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/" className="text-[#F2F2F2] hover:text-orange-300">
                  All Products
                </a>
              </li>
              <li>
                <a href="/category" className="text-[#F2F2F2] hover:text-orange-300">
                  Categories
                </a>
              </li>
              <li>
                <a href="/cart" className="text-[#F2F2F2] hover:text-orange-300">
                  Cart
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F2F2F2]">Support</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/login" className="text-[#F2F2F2] hover:text-orange-300">
                  Account
                </a>
              </li>
              <li>
                <a href="/terms" className="text-[#F2F2F2] hover:text-orange-300">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="/shipping-policy" className="text-[#F2F2F2] hover:text-orange-300">
                  Shipping Policy
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="text-[#F2F2F2] hover:text-orange-300">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="/about" className="text-[#F2F2F2] hover:text-orange-300">
                  About us
                </a>
              </li>
              <li>
                <a href="/contact" className="text-[#F2F2F2] hover:text-orange-300">
                  Contact us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F2F2F2]">Subscribe</h4>
            <p className="mt-3 text-sm text-[#D9D9D9]">
              Get the latest deals and updates — subscribe to our newsletter.
            </p>
            <form className="mt-4 flex items-center max-w-xs">
              <input
                type="email"
                name="email"
                placeholder="yourmail@example.com"
                className="w-full px-3 py-2 rounded-l-md border border-[#F97316] text-[#F2F2F2] placeholder:text-[#A8A8A8] text-sm focus:outline-none bg-[#262626]"
              />
              <button className="bg-[#F97316] hover:bg-[#ea7a2a] text-white px-2 py-2 rounded-r-md text-sm w-20">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-100">
          © {year} BOANIPA — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
