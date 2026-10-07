"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  rating?: number;
  reviews?: number;
  stock: number;
}

const categories = [
  { name: "All Frames", symbol: "▦" },
  { name: "Wooden Frames", symbol: "▤" },
  { name: "Modern Frames", symbol: "▣" },
  { name: "Luxury Frames", symbol: "✧" },
];

const categoryMatches: Record<string, string[]> = {
  "All Frames": [],
  "Wooden Frames": ["Wooden", "Wooden Frames"],
  "Modern Frames": ["Modern", "Modern Frames"],
  "Luxury Frames": ["Luxury", "Luxury Frames"],
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Frames");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<
    "cart" | "wishlist" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load Cart and Wishlist from localStorage once on the client.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("framemart-cart");
      const savedWishlist =
        localStorage.getItem("framemart-wishlist");

      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart);

        if (
          parsedCart !== null &&
          typeof parsedCart === "object" &&
          !Array.isArray(parsedCart)
        ) {
          const validCart: Record<string, number> = {};

          for (const [id, quantity] of Object.entries(parsedCart)) {
            if (
              typeof id === "string" &&
              typeof quantity === "number" &&
              Number.isInteger(quantity) &&
              quantity > 0
            ) {
              validCart[id] = quantity;
            }
          }

          setCart(validCart);
        }
      }

      if (savedWishlist) {
        const parsedWishlist: unknown =
          JSON.parse(savedWishlist);

        if (Array.isArray(parsedWishlist)) {
          setWishlist(
            parsedWishlist.filter(
              (id): id is string => typeof id === "string"
            )
          );
        }
      }
    } catch (err) {
      console.error(
        "Failed to load saved Cart/Wishlist:",
        err
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Read search query sent by the global Navbar.
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const query = params.get("search")?.trim() ?? "";

    if (!query) {
      return;
    }

    setSearch(query);

    const timer = window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  // Allow the global Navbar to open homepage cart/wishlist panels.
  useEffect(() => {
    const handleOpenPanel = (event: Event) => {
      const customEvent =
        event as CustomEvent<"cart" | "wishlist">;

      if (
        customEvent.detail === "cart" ||
        customEvent.detail === "wishlist"
      ) {
        setActivePanel(customEvent.detail);
      }
    };

    window.addEventListener(
      "framemart-open-panel",
      handleOpenPanel
    );

    return () => {
      window.removeEventListener(
        "framemart-open-panel",
        handleOpenPanel
      );
    };
  }, []);

  // Save changes only after initial localStorage load.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(
        "framemart-cart",
        JSON.stringify(cart)
      );

      localStorage.setItem(
        "framemart-wishlist",
        JSON.stringify(wishlist)
      );

      window.dispatchEvent(
        new Event("framemart-storage-updated")
      );
    } catch (err) {
      console.error(
        "Failed to save Cart/Wishlist:",
        err
      );
    }
  }, [cart, wishlist, isHydrated]);

  // Fetch products from backend.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            "Products load nahi ho paaye."
          );
        }

        const data = await response.json();

        if (
          !data.success ||
          !Array.isArray(data.products)
        ) {
          throw new Error(
            "API se products ka valid data nahi mila."
          );
        }

        setProducts(data.products);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Kuch galat ho gaya. Dobara try karein."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  // Filter products according to search and category.
  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const matchingCategories =
      categoryMatches[category] ?? [];

    return products.filter((product) => {
      const matchesCategory =
        category === "All Frames" ||
        matchingCategories.some(
          (item) =>
            item.toLowerCase() ===
            product.category.toLowerCase()
        );

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.description
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  // Add product to cart.
  const addToCart = (id: string) => {
    const product = products.find(
      (item) => item._id === id
    );

    if (!product || product.stock <= 0) {
      setCartNotice(
        "This product is out of stock."
      );
      return;
    }

    setCart((current) => {
      const currentQuantity = current[id] ?? 0;

      if (currentQuantity >= product.stock) {
        setCartNotice(
          "You have reached the available stock limit."
        );

        return current;
      }

      setCartNotice("");

      return {
        ...current,
        [id]: currentQuantity + 1,
      };
    });
  };

  // Decrease cart quantity.
  const decreaseCartItem = (id: string) => {
    setCart((current) => {
      const quantity = current[id] ?? 0;

      if (quantity <= 1) {
        const updated = { ...current };
        delete updated[id];
        return updated;
      }

      return {
        ...current,
        [id]: quantity - 1,
      };
    });

    setCartNotice("");
  };

  // Remove cart item.
  const removeFromCart = (id: string) => {
    setCart((current) => {
      const updated = { ...current };
      delete updated[id];
      return updated;
    });

    setCartNotice("");
  };

  // Add/remove wishlist.
  const toggleWishlist = (id: string) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Remove wishlist item.
  const removeFromWishlist = (id: string) => {
    setWishlist((current) =>
      current.filter((item) => item !== id)
    );
  };

  const cartCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const cartProducts = products.filter(
    (product) => (cart[product._id] ?? 0) > 0
  );

  const cartTotal = cartProducts.reduce(
    (total, product) =>
      total +
      product.price * (cart[product._id] ?? 0),
    0
  );

  const wishlistProducts = products.filter(
    (product) =>
      wishlist.includes(product._id)
  );

  const scrollToProducts = () => {
    setActivePanel(null);

    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#172033]">

      {/* ================= CART / WISHLIST PANEL ================= */}
      {activePanel !== null && (
        <div className="fixed inset-0 z-[60] flex justify-end">

          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setActivePanel(null)}
            className="absolute inset-0 bg-black/50"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={
              activePanel === "cart"
                ? "Shopping cart"
                : "Wishlist"
            }
            className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-5 text-[#172033] shadow-2xl sm:p-6"
          >

            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">

              <h2 className="text-xl font-black">
                {activePanel === "cart"
                  ? "Your Shopping Cart"
                  : "Your Wishlist"}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setActivePanel(null)
                }
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl hover:bg-gray-200"
              >
                ×
              </button>

            </div>

            {/* ================= CART ================= */}
            {activePanel === "cart" ? (
              <div className="flex flex-1 flex-col">

                {cartProducts.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">

                    <span className="text-5xl">
                      🛒
                    </span>

                    <h3 className="mt-4 text-lg font-bold">
                      Your cart is empty
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Add some beautiful frames
                      to your cart.
                    </p>

                    <button
                      type="button"
                      onClick={scrollToProducts}
                      className="mt-5 rounded-lg bg-[#f7cf46] px-5 py-3 text-sm font-bold hover:bg-yellow-400"
                    >
                      Explore Products
                    </button>

                  </div>
                ) : (
                  <>
                    <div className="flex-1 divide-y divide-gray-200">

                      {cartProducts.map((product) => {
                        const quantity =
                          cart[product._id] ?? 0;

                        return (
                          <div
                            key={product._id}
                            className="flex gap-3 py-5"
                          >

                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() =>
                                setActivePanel(null)
                              }
                              className="shrink-0"
                            >
                              <img
                                src={
                                  product.image ||
                                  "/placeholder.png"
                                }
                                alt={product.name}
                                className="h-24 w-24 rounded-lg bg-gray-100 object-cover"
                              />
                            </Link>

                            <div className="min-w-0 flex-1">

                              <Link
                                href={`/products/${product.slug}`}
                                onClick={() =>
                                  setActivePanel(null)
                                }
                                className="line-clamp-2 text-sm font-bold hover:text-[#b88b12]"
                              >
                                {product.name}
                              </Link>

                              <p className="mt-1 text-sm font-black">
                                ₹
                                {product.price.toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">

                                <div className="flex items-center overflow-hidden rounded-md border border-gray-300">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      decreaseCartItem(
                                        product._id
                                      )
                                    }
                                    aria-label={`Decrease quantity of ${product.name}`}
                                    className="px-3 py-1 hover:bg-gray-100"
                                  >
                                    −
                                  </button>

                                  <span className="min-w-8 text-center text-sm font-semibold">
                                    {quantity}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={
                                      quantity >=
                                      product.stock
                                    }
                                    onClick={() =>
                                      addToCart(
                                        product._id
                                      )
                                    }
                                    aria-label={`Increase quantity of ${product.name}`}
                                    className="px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    +
                                  </button>

                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(
                                      product._id
                                    )
                                  }
                                  className="text-xs font-semibold text-red-600 hover:underline"
                                >
                                  Remove
                                </button>

                              </div>
                            </div>

                            <div className="whitespace-nowrap text-sm font-bold">
                              ₹
                              {(
                                product.price *
                                quantity
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>

                          </div>
                        );
                      })}

                    </div>

                    {cartNotice && (
                      <p
                        role="status"
                        className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
                      >
                        {cartNotice}
                      </p>
                    )}

                    <div className="border-t border-gray-200 pt-4">

                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total items</span>
                        <span>{cartCount}</span>
                      </div>

                      <div className="mt-2 flex justify-between text-lg font-black">
                        <span>Subtotal</span>
                        <span>
                          ₹
                          {cartTotal.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Shipping and taxes, if applicable,
                        are calculated at checkout.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePanel(null);
                          window.location.href =
                            "/checkout";
                        }}
                        className="mt-5 w-full rounded-lg bg-[#f7cf46] px-5 py-3 text-sm font-bold text-[#172033] hover:bg-yellow-400"
                      >
                        Proceed to Checkout →
                      </button>

                    </div>
                  </>
                )}

              </div>
            ) : (

              /* ================= WISHLIST ================= */
              <div className="flex flex-1 flex-col">

                {wishlistProducts.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">

                    <span className="text-5xl text-red-400">
                      ♡
                    </span>

                    <h3 className="mt-4 text-lg font-bold">
                      Your wishlist is empty
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Save your favourite frames here.
                    </p>

                    <button
                      type="button"
                      onClick={scrollToProducts}
                      className="mt-5 rounded-lg bg-[#f7cf46] px-5 py-3 text-sm font-bold hover:bg-yellow-400"
                    >
                      Explore Products
                    </button>

                  </div>
                ) : (
                  <div className="flex-1 divide-y divide-gray-200">

                    {wishlistProducts.map(
                      (product) => (
                        <div
                          key={product._id}
                          className="flex gap-3 py-5"
                        >

                          <Link
                            href={`/products/${product.slug}`}
                            onClick={() =>
                              setActivePanel(null)
                            }
                            className="shrink-0"
                          >
                            <img
                              src={
                                product.image ||
                                "/placeholder.png"
                              }
                              alt={product.name}
                              className="h-24 w-24 rounded-lg bg-gray-100 object-cover"
                            />
                          </Link>

                          <div className="min-w-0 flex-1">

                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() =>
                                setActivePanel(null)
                              }
                              className="line-clamp-2 text-sm font-bold hover:text-[#b88b12]"
                            >
                              {product.name}
                            </Link>

                            <p className="mt-1 text-sm font-black">
                              ₹
                              {product.price.toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-3">

                              <button
                                type="button"
                                disabled={
                                  product.stock <= 0
                                }
                                onClick={() =>
                                  addToCart(
                                    product._id
                                  )
                                }
                                className="rounded-md bg-[#f7cf46] px-3 py-1.5 text-xs font-bold hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                {product.stock <= 0
                                  ? "Out of Stock"
                                  : "Add to Cart"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromWishlist(
                                    product._id
                                  )
                                }
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>

                            </div>

                          </div>
                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

          </aside>
        </div>
      )}

      {/* ================= HERO ================= */}
      <section className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8">

        <div className="relative flex min-h-[380px] items-center overflow-hidden rounded-2xl bg-[#243246] sm:min-h-[440px]">

          <div
            className="absolute inset-0 bg-cover bg-center opacity-45"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&auto=format&fit=crop&q=85')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#131c2b] via-[#131c2b]/80 to-transparent" />

          <div className="relative z-10 max-w-xl px-6 py-12 sm:px-12 sm:py-16">

            <span className="mb-4 inline-block rounded-full bg-[#f7cf46] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#172033]">
              Make every moment memorable
            </span>

            <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
              Your Memories,
              <br />
              <span className="text-[#f7cf46]">
                Beautifully Framed.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-gray-200 sm:text-base">
              Discover premium photo frames that turn
              your favourite moments into timeless
              memories.
            </p>

            <a
              href="#products"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#f7cf46] px-6 py-3.5 text-sm font-bold text-[#172033] transition hover:bg-yellow-300"
            >
              Shop Collection
              <span>→</span>
            </a>

          </div>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-7 sm:grid-cols-4 sm:px-6 lg:px-8">

        {[
          {
            icon: "✦",
            title: "Premium Quality",
            sub: "Carefully selected frames",
          },
          {
            icon: "♧",
            title: "Secure Packaging",
            sub: "Protected delivery",
          },
          {
            icon: "↗",
            title: "Easy Shopping",
            sub: "Simple ordering experience",
          },
          {
            icon: "♡",
            title: "Made for Memories",
            sub: "Frames for every moment",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="text-2xl text-[#b88b12]">
              {item.icon}
            </div>

            <h3 className="mt-2 text-sm font-bold">
              {item.title}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {item.sub}
            </p>
          </div>
        ))}

      </section>

      {/* ================= CATEGORIES ================= */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"
      >

        <div className="mb-5">

          <p className="text-xs font-bold uppercase tracking-widest text-[#b88b12]">
            Explore our collection
          </p>

          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            Shop by Category
          </h2>

        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          {categories.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => {
                setCategory(item.name);
                scrollToProducts();
              }}
              className={`rounded-xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                category === item.name
                  ? "border-[#d5ae31] bg-[#fff8df]"
                  : "border-gray-200 bg-white"
              }`}
            >

              <span className="text-3xl text-[#b88b12]">
                {item.symbol}
              </span>

              <span className="mt-3 block text-sm font-bold">
                {item.name}
              </span>

              <span className="mt-1 block text-xs text-gray-500">
                Explore collection →
              </span>

            </button>
          ))}

        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">

          <div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#b88b12]">
              Handpicked for you
            </p>

            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              Featured Photo Frames
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Find a frame for every special memory.
            </p>

          </div>

          <button
            type="button"
            onClick={() => {
              setCategory("All Frames");
              setSearch("");
            }}
            className="text-sm font-bold text-[#8c6a0b] underline underline-offset-4"
          >
            View all
          </button>

        </div>

        {/* Category filters */}
        <div className="mb-5 flex flex-wrap gap-2">

          {categories.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() =>
                setCategory(item.name)
              }
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                category === item.name
                  ? "bg-[#172033] text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:border-gray-500"
              }`}
            >
              {item.name}
            </button>
          ))}

        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#b88b12]" />

            <p className="mt-4 text-sm text-gray-600">
              Loading photo frames...
            </p>

          </div>
        ) : error ? (

          /* Error */
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">

            <p className="font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-lg bg-[#172033] px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Try again
            </button>

          </div>
        ) : filteredProducts.length === 0 ? (

          /* Empty */
          <div className="rounded-xl bg-white p-10 text-center text-gray-500">
            {products.length === 0
              ? "No products are available yet."
              : "No frames found. Try a different search or category."}
          </div>
        ) : (

          /* Product Grid */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

            {filteredProducts.map((product) => {

              const isWishlisted =
                wishlist.includes(product._id);

              const isOutOfStock =
                product.stock <= 0 ||
                (cart[product._id] ?? 0) >=
                  product.stock;

              return (
                <article
                  key={product._id}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* ================= PRODUCT IMAGE ================= */}
                  <div className="relative aspect-square overflow-hidden bg-[#eeeae3]">

                    <Link
                      href={`/products/${product.slug}`}
                      aria-label={`View ${product.name}`}
                      className="block h-full w-full"
                    >

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl text-gray-400">
                          ▣
                        </div>
                      )}

                    </Link>

                    {/* Product Badge */}
                    <span className="absolute left-2 top-2 rounded-md bg-[#f7cf46] px-2 py-1 text-[10px] font-bold text-[#172033] sm:text-xs">
                      {product.stock <= 0
                        ? "Out of stock"
                        : "Featured"}
                    </span>

                    {/* Wishlist */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleWishlist(
                          product._id
                        )
                      }
                      aria-label={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      aria-pressed={isWishlisted}
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow transition hover:scale-110"
                    >
                      <span
                        className={
                          isWishlisted
                            ? "text-red-500"
                            : "text-gray-600"
                        }
                      >
                        {isWishlisted
                          ? "♥"
                          : "♡"}
                      </span>
                    </button>

                  </div>

                  {/* ================= PRODUCT INFO ================= */}
                  <div className="p-3 sm:p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                      {product.category}
                    </p>

                    {/* Product Name → Details Page */}
                    <h3 className="mt-1 min-h-10 text-sm font-bold leading-5 text-gray-800 sm:text-base">

                      <Link
                        href={`/products/${product.slug}`}
                        className="transition hover:text-[#b88b12]"
                      >
                        {product.name}
                      </Link>

                    </h3>

                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-1 text-xs">

                      {typeof product.rating ===
                        "number" && (
                        <span className="rounded bg-green-700 px-1.5 py-0.5 font-bold text-white">
                          {product.rating.toFixed(1)} ★
                        </span>
                      )}

                      {typeof product.reviews ===
                        "number" && (
                        <span className="text-gray-500">
                          ({product.reviews})
                        </span>
                      )}

                    </div>

                    {/* Price */}
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">

                      <span className="text-lg font-black text-[#172033]">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      {typeof product.originalPrice ===
                        "number" &&
                        product.originalPrice >
                          product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹
                            {product.originalPrice.toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}

                    </div>

                    {/* Add to Cart */}
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() =>
                        addToCart(product._id)
                      }
                      className="mt-4 w-full rounded-lg bg-[#f7cf46] px-2 py-2.5 text-xs font-bold text-[#172033] transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 sm:text-sm"
                    >
                      {product.stock <= 0
                        ? "Out of Stock"
                        : (cart[product._id] ?? 0) >=
                            product.stock
                          ? "Stock Limit Reached"
                          : "+ Add to Cart"}
                    </button>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>

      {/* ================= WHY US ================= */}
      <section
        id="why-us"
        className="bg-[#172033] px-4 py-12 text-white sm:px-6 lg:px-8"
      >

        <div className="mx-auto max-w-7xl text-center">

          <p className="text-xs font-bold uppercase tracking-widest text-[#f7cf46]">
            The FrameMart difference
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Why Choose FrameMart?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-300">
            Explore a collection designed to complement
            your home and preserve the moments that matter.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

            {[
              [
                "✧",
                "Thoughtful Designs",
                "Styles for different tastes and spaces.",
              ],
              [
                "▣",
                "Multiple Choices",
                "Discover wooden, modern and luxury frames.",
              ],
              [
                "♡",
                "Memories Matter",
                "Give your favourite photographs a home.",
              ],
            ].map(([icon, title, desc]) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >

                <div className="text-3xl text-[#f7cf46]">
                  {icon}
                </div>

                <h3 className="mt-3 font-bold">
                  {title}
                </h3>

                <p className="mt-2 text-sm text-gray-300">
                  {desc}
                </p>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#101827] px-4 py-9 text-gray-300 sm:px-6 lg:px-8">

        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">

          <div>

            <Link
              href="/"
              className="text-2xl font-black text-white"
            >
              Frame
              <span className="text-[#f7cf46]">
                Mart.
              </span>
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-gray-400">
              Beautiful frames for your most precious
              memories.
            </p>

          </div>

          <div>

            <h3 className="font-bold text-white">
              Quick Links
            </h3>

            <div className="mt-3 flex flex-col gap-2 text-sm">

              <Link
                href="/"
                className="hover:text-[#f7cf46]"
              >
                Home
              </Link>

              <a
                href="#categories"
                className="hover:text-[#f7cf46]"
              >
                Categories
              </a>

              <a
                href="#products"
                className="hover:text-[#f7cf46]"
              >
                Shop All
              </a>

            </div>
          </div>

          <div>

            <h3 className="font-bold text-white">
              Customer Support
            </h3>

            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-400">
              <span>Contact Us</span>
              <span>Shipping Information</span>
              <span>Returns & Refunds</span>
            </div>

          </div>

          <div>

            <h3 className="font-bold text-white">
              Stay Connected
            </h3>

            <p className="mt-3 text-sm text-gray-400">
              Follow us for new collections and updates.
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Instagram · Facebook · Pinterest
            </p>

          </div>

        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} FrameMart.
          All rights reserved.
        </div>

      </footer>

    </main>
  );
}