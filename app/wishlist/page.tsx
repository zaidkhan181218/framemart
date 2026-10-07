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

const CART_KEY = "framemart-cart";
const WISHLIST_KEY = "framemart-wishlist";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load wishlist and cart from localStorage
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_KEY);
      const savedCart = localStorage.getItem(CART_KEY);

      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);

        if (Array.isArray(parsedWishlist)) {
          setWishlistIds(parsedWishlist.map(String));
        }
      }

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (err) {
      console.error("Failed to load wishlist/cart:", err);
    }
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products.");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.products)) {
          throw new Error("Invalid product data.");
        }

        setProducts(data.products);
      } catch (err) {
        console.error("Wishlist products error:", err);
        setError("Unable to load wishlist products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Save wishlist
  const saveWishlist = (ids: string[]) => {
    setWishlistIds(ids);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));

    window.dispatchEvent(new Event("framemart-storage-updated"));
  };

  // Save cart
  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));

    window.dispatchEvent(new Event("framemart-storage-updated"));
  };

  // Products that are actually in wishlist
  const wishlistProducts = useMemo(() => {
    return products.filter((product) =>
      wishlistIds.includes(product._id)
    );
  }, [products, wishlistIds]);

  // Remove product from wishlist
  const removeFromWishlist = (productId: string) => {
    const updatedWishlist = wishlistIds.filter(
      (id) => id !== productId
    );

    saveWishlist(updatedWishlist);

    setNotice("Product removed from wishlist.");

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      setNotice("This product is currently out of stock.");

      setTimeout(() => {
        setNotice("");
      }, 2500);

      return;
    }

    const existingItem = cart.find(
      (item) => item.product._id === product._id
    );

    let updatedCart: CartItem[];

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setNotice("Maximum available stock already added to cart.");

        setTimeout(() => {
          setNotice("");
        }, 2500);

        return;
      }

      updatedCart = cart.map((item) =>
        item.product._id === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          product,
          quantity: 1,
        },
      ];
    }

    saveCart(updatedCart);

    setNotice("Product added to cart.");

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  // Clear entire wishlist
  const clearWishlist = () => {
    if (wishlistIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove all products from your wishlist?"
    );

    if (!confirmed) {
      return;
    }

    saveWishlist([]);

    setNotice("Wishlist cleared.");

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/"
                className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ← Continue Shopping
              </Link>

              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                My Wishlist ❤️
              </h1>

              <p className="mt-2 text-gray-600">
                {wishlistIds.length}{" "}
                {wishlistIds.length === 1
                  ? "product"
                  : "products"}{" "}
                saved in your wishlist
              </p>
            </div>

            {wishlistIds.length > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="rounded-lg border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Clear Wishlist
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Notification */}
      {notice && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {notice}
        </div>
      )}

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-500"></div>

            <p className="mt-4 text-gray-600">
              Loading your wishlist...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="text-4xl">⚠️</div>

            <h2 className="mt-3 text-xl font-bold text-red-700">
              Something went wrong
            </h2>

            <p className="mt-2 text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty Wishlist */}
        {!loading &&
          !error &&
          wishlistIds.length === 0 && (
            <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <div className="text-7xl">🤍</div>

              <h2 className="mt-6 text-2xl font-bold">
                Your wishlist is empty
              </h2>

              <p className="mx-auto mt-3 max-w-md text-gray-600">
                Save your favorite photo frames here so you can
                easily find them later.
              </p>

              <Link
                href="/"
                className="mt-7 inline-flex rounded-lg bg-yellow-400 px-7 py-3 font-bold text-gray-900 transition hover:bg-yellow-500"
              >
                Explore Frames
              </Link>
            </div>
          )}

        {/* Wishlist Products */}
        {!loading &&
          !error &&
          wishlistIds.length > 0 &&
          wishlistProducts.length === 0 && (
            <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <div className="text-6xl">🔍</div>

              <h2 className="mt-5 text-2xl font-bold">
                Wishlist products not found
              </h2>

              <p className="mt-3 text-gray-600">
                Some saved products may no longer be available.
              </p>

              <button
                type="button"
                onClick={() => saveWishlist([])}
                className="mt-6 rounded-lg bg-yellow-400 px-6 py-3 font-bold hover:bg-yellow-500"
              >
                Clear Wishlist
              </button>
            </div>
          )}

        {/* Product Grid */}
        {!loading &&
          !error &&
          wishlistProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlistProducts.map((product) => {
                const discount =
                  product.originalPrice &&
                  product.originalPrice > product.price
                    ? Math.round(
                        ((product.originalPrice -
                          product.price) /
                          product.originalPrice) *
                          100
                      )
                    : 0;

                return (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Product Image */}
                    <div className="relative bg-gray-100">
                      <Link href={`/products/${product.slug}`}>
                        <div className="flex h-64 items-center justify-center overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      </Link>

                      {/* Discount */}
                      {discount > 0 && (
                        <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
                          {discount}% OFF
                        </span>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() =>
                          removeFromWishlist(product._id)
                        }
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:bg-red-50"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* Product Information */}
                    <div className="p-5">
                      <Link
                        href={`/products/${product.slug}`}
                        className="block"
                      >
                        <h2 className="line-clamp-2 min-h-[56px] text-lg font-semibold transition hover:text-blue-600">
                          {product.name}
                        </h2>
                      </Link>

                      <p className="mt-2 text-sm text-gray-500">
                        {product.category}
                      </p>

                      {/* Rating */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
                          ⭐ {product.rating ?? 0}
                        </span>

                        <span className="text-sm text-gray-500">
                          ({product.reviews ?? 0} reviews)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>

                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹
                              {product.originalPrice.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}
                      </div>

                      {/* Stock */}
                      <p
                        className={`mt-2 text-sm font-medium ${
                          product.stock > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} items available`
                          : "Out of stock"}
                      </p>

                      {/* Buttons */}
                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className="flex-1 rounded-lg bg-yellow-400 px-3 py-3 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                        >
                          {product.stock > 0
                            ? "Add to Cart"
                            : "Out of Stock"}
                        </button>

                        <Link
                          href={`/products/${product.slug}`}
                          className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          View
                        </Link>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() =>
                          removeFromWishlist(product._id)
                        }
                        className="mt-3 w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Remove from Wishlist
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}