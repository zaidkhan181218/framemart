"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const updateCounts = () => {
      try {
        const savedCart = localStorage.getItem("framemart-cart");
        const savedWishlist = localStorage.getItem("framemart-wishlist");

        const cart: unknown = savedCart ? JSON.parse(savedCart) : {};
        const wishlist: unknown = savedWishlist
          ? JSON.parse(savedWishlist)
          : [];

        let totalCartItems = 0;

        if (
          cart &&
          typeof cart === "object" &&
          !Array.isArray(cart)
        ) {
          for (const value of Object.values(cart)) {
            if (
              typeof value === "number" &&
              Number.isInteger(value) &&
              value > 0
            ) {
              totalCartItems += value;
            }
          }
        }

        setCartCount(totalCartItems);

        setWishlistCount(
          Array.isArray(wishlist) ? wishlist.length : 0
        );
      } catch (error) {
        console.error("Navbar localStorage error:", error);

        setCartCount(0);
        setWishlistCount(0);
      }
    };

    updateCounts();

    window.addEventListener("storage", updateCounts);
    window.addEventListener(
      "framemart-storage-updated",
      updateCounts
    );

    return () => {
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener(
        "framemart-storage-updated",
        updateCounts
      );
    };
  }, []);

  const openPanel = (panel: "cart" | "wishlist") => {
    // On other pages open the actual Cart/Wishlist page.
    if (pathname !== "/") {
      window.location.href =
        panel === "cart" ? "/cart" : "/wishlist";

      return;
    }

    // On homepage open the existing side panel.
    window.dispatchEvent(
      new CustomEvent<"cart" | "wishlist">(
        "framemart-open-panel",
        {
          detail: panel,
        }
      )
    );
  };

  const handleSearch = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      window.location.href = "/";
      return;
    }

    window.location.href =
      `/?search=${encodeURIComponent(trimmedSearch)}`;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">

      {/* =====================================================
          MAIN AMAZON STYLE NAVBAR
      ====================================================== */}
      <div className="bg-[#131921] text-white">
        <div className="mx-auto flex min-h-[70px] max-w-[1600px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 lg:px-7">

          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="shrink-0 rounded-sm border border-transparent px-1 py-2 transition hover:border-white sm:px-2"
          >
            <span className="text-2xl font-extrabold tracking-tight text-[#ffcc00] sm:text-3xl">
              FrameMart
            </span>
          </Link>

          {/* DESKTOP SEARCH */}
          <form
            onSubmit={handleSearch}
            className="hidden min-w-0 flex-1 md:flex"
          >
            <div className="flex h-11 w-full overflow-hidden rounded-md bg-white">

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search for photo frames..."
                aria-label="Search for photo frames"
                className="min-w-0 flex-1 px-4 text-[15px] text-gray-900 outline-none placeholder:text-gray-500"
              />

              <button
                type="submit"
                aria-label="Search"
                className="flex w-14 shrink-0 items-center justify-center bg-[#febd69] text-xl text-gray-900 transition hover:bg-[#f3a847]"
              >
                🔍
              </button>
            </div>
          </form>

          {/* ACCOUNT / ORDERS */}
          <Link
            href="/orders"
            className="hidden rounded-sm border border-transparent px-2 py-2 leading-tight transition hover:border-white lg:block"
          >
            <span className="block text-xs text-gray-300">
              Hello, Guest
            </span>

            <span className="block text-sm font-bold">
              Account &amp; Orders
            </span>
          </Link>

          {/* WISHLIST */}
          <button
            type="button"
            onClick={() => openPanel("wishlist")}
            className="hidden items-center rounded-sm border border-transparent px-2 py-2 font-bold transition hover:border-white sm:flex"
            aria-label="Open wishlist"
          >
            <span className="mr-1 text-xl text-pink-400">
              ♥
            </span>

            <span className="hidden lg:inline">
              Wishlist
            </span>

            <span className="ml-1 min-w-[22px] rounded-full bg-[#ffcc00] px-1.5 py-0.5 text-center text-xs font-bold text-black">
              {wishlistCount}
            </span>
          </button>

          {/* CART */}
          <button
            type="button"
            onClick={() => openPanel("cart")}
            className="flex items-center rounded-sm border border-transparent px-2 py-2 font-bold transition hover:border-white"
            aria-label="Open shopping cart"
          >
            <span className="mr-1 text-2xl">
              🛒
            </span>

            <span className="hidden sm:inline">
              Cart
            </span>

            <span className="ml-1 min-w-[22px] rounded-full bg-[#ffcc00] px-1.5 py-0.5 text-center text-xs font-bold text-black">
              {cartCount}
            </span>
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/30 text-xl transition hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* =====================================================
            MOBILE SEARCH
        ====================================================== */}
        <div className="border-t border-white/10 px-3 pb-3 pt-2 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="flex h-11 overflow-hidden rounded-md bg-white">

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search for photo frames..."
                aria-label="Search for photo frames"
                className="min-w-0 flex-1 px-3 text-sm text-gray-900 outline-none"
              />

              <button
                type="submit"
                aria-label="Search"
                className="w-14 shrink-0 bg-[#febd69] text-lg text-gray-900"
              >
                🔍
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =====================================================
          OFFER BAR
      ====================================================== */}
      <div className="bg-[#ffd54f] px-3 py-2 text-center text-xs font-bold text-[#111827] sm:text-sm md:text-base">
        ✦ SPECIAL OFFER: Get 20% OFF on selected photo frames ✦
      </div>

      {/* =====================================================
          DESKTOP NAVIGATION
      ====================================================== */}
      <nav className="hidden bg-[#1b2736] text-white md:block">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 overflow-x-auto px-5 lg:px-7">

          <Link
            href="/"
            className="border-b-2 border-[#ffcc00] px-1 py-3 text-sm font-bold text-[#ffcc00]"
          >
            Home
          </Link>

          <Link
            href="/#categories"
            className="px-1 py-3 text-sm font-medium transition hover:text-[#ffcc00]"
          >
            Categories
          </Link>

          <Link
            href="/#products"
            className="px-1 py-3 text-sm font-medium transition hover:text-[#ffcc00]"
          >
            Shop All
          </Link>

          <Link
            href="/#why-us"
            className="px-1 py-3 text-sm font-medium transition hover:text-[#ffcc00]"
          >
            Why FrameMart?
          </Link>

          <Link
            href="/orders"
            className="px-1 py-3 text-sm font-medium transition hover:text-[#ffcc00]"
          >
            My Orders
          </Link>
        </div>
      </nav>

      {/* =====================================================
          MOBILE MENU
      ====================================================== */}
      {mobileMenuOpen && (
        <nav className="border-t border-white/10 bg-[#131921] text-white md:hidden">

          <div className="flex flex-col px-4 py-2">

            <Link
              href="/"
              onClick={closeMobileMenu}
              className="border-b border-white/10 py-3 font-semibold hover:text-[#ffcc00]"
            >
              🏠 Home
            </Link>

            <Link
              href="/#categories"
              onClick={closeMobileMenu}
              className="border-b border-white/10 py-3 font-semibold hover:text-[#ffcc00]"
            >
              📦 Categories
            </Link>

            <Link
              href="/#products"
              onClick={closeMobileMenu}
              className="border-b border-white/10 py-3 font-semibold hover:text-[#ffcc00]"
            >
              🛍️ Shop All
            </Link>

            <Link
              href="/#why-us"
              onClick={closeMobileMenu}
              className="border-b border-white/10 py-3 font-semibold hover:text-[#ffcc00]"
            >
              ⭐ Why FrameMart?
            </Link>

            <Link
              href="/orders"
              onClick={closeMobileMenu}
              className="border-b border-white/10 py-3 font-semibold hover:text-[#ffcc00]"
            >
              📦 My Orders
            </Link>

            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                openPanel("wishlist");
              }}
              className="flex items-center justify-between border-b border-white/10 py-3 text-left font-semibold hover:text-[#ffcc00]"
            >
              <span>
                ♥ Wishlist
              </span>

              <span className="rounded-full bg-[#ffcc00] px-2 py-0.5 text-xs font-bold text-black">
                {wishlistCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                openPanel("cart");
              }}
              className="flex items-center justify-between py-3 text-left font-semibold hover:text-[#ffcc00]"
            >
              <span>
                🛒 Cart
              </span>

              <span className="rounded-full bg-[#ffcc00] px-2 py-0.5 text-xs font-bold text-black">
                {cartCount}
              </span>
            </button>

          </div>
        </nav>
      )}
    </header>
  );
}