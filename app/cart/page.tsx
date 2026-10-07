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

interface CartItem {
  product: Product;
  quantity: number;
}

const CART_KEY = "framemart-cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [notice, setNotice] = useState("");

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(
      new Event("framemart-storage-updated")
    );
  };

  // Show temporary notification
  const showNotice = (message: string) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  // Increase quantity
  const increaseQuantity = (productId: string) => {
    const updatedCart = cart.map((item) => {
      if (item.product._id !== productId) {
        return item;
      }

      if (item.quantity >= item.product.stock) {
        showNotice("Maximum available stock reached.");
        return item;
      }

      return {
        ...item,
        quantity: item.quantity + 1,
      };
    });

    saveCart(updatedCart);
  };

  // Decrease quantity
  const decreaseQuantity = (productId: string) => {
    const existingItem = cart.find(
      (item) => item.product._id === productId
    );

    if (!existingItem) {
      return;
    }

    if (existingItem.quantity === 1) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.product._id === productId
        ? {
            ...item,
            quantity: item.quantity - 1,
          }
        : item
    );

    saveCart(updatedCart);
  };

  // Remove product
  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(
      (item) => item.product._id !== productId
    );

    saveCart(updatedCart);

    showNotice("Product removed from cart.");
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove all products from your cart?"
    );

    if (!confirmed) {
      return;
    }

    saveCart([]);

    showNotice("Cart cleared.");
  };

  // Total number of products
  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  // Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );
  }, [cart]);

  // Shipping
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 49;

  // Final total
  const total = subtotal + shipping;

  // Format price
  const formatPrice = (amount: number) => {
    return amount.toLocaleString("en-IN");
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-500"></div>

            <p className="mt-4 text-gray-600">
              Loading your cart...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      {/* Notification */}
      {notice && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {notice}
        </div>
      )}

      {/* Page Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ← Continue Shopping
              </Link>

              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Shopping Cart 🛒
              </h1>

              <p className="mt-2 text-gray-600">
                {totalItems}{" "}
                {totalItems === 1 ? "item" : "items"} in your
                cart
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-lg border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Empty Cart */}
      {cart.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-7xl">🛒</div>

            <h2 className="mt-6 text-2xl font-bold">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-600">
              Looks like you haven't added any photo frames to
              your cart yet. Explore our collection and find
              something beautiful for your memories.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-lg bg-yellow-400 px-7 py-3 font-bold text-gray-900 transition hover:bg-yellow-500"
            >
              Start Shopping
            </Link>
          </div>
        </section>
      ) : (
        /* Cart Content */
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="border-b px-5 py-5 sm:px-6">
                  <h2 className="text-xl font-bold">
                    Your Items
                  </h2>
                </div>

                <div className="divide-y">
                  {cart.map((item) => {
                    const product = item.product;

                    return (
                      <div
                        key={product._id}
                        className="p-5 sm:p-6"
                      >
                        <div className="flex flex-col gap-5 sm:flex-row">
                          {/* Product Image */}
                          <Link
                            href={`/products/${product.slug}`}
                            className="shrink-0"
                          >
                            <div className="h-40 w-full overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                              />
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                              <div>
                                <Link
                                  href={`/products/${product.slug}`}
                                  className="text-lg font-semibold hover:text-blue-600"
                                >
                                  {product.name}
                                </Link>

                                <p className="mt-1 text-sm text-gray-500">
                                  {product.category}
                                </p>

                                {product.rating !==
                                  undefined && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
                                      ⭐ {product.rating}
                                    </span>

                                    <span className="text-sm text-gray-500">
                                      (
                                      {product.reviews ??
                                        0}{" "}
                                      reviews)
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-left sm:text-right">
                                <p className="text-xl font-bold">
                                  ₹
                                  {formatPrice(
                                    product.price *
                                      item.quantity
                                  )}
                                </p>

                                {product.originalPrice &&
                                  product.originalPrice >
                                    product.price && (
                                    <p className="text-sm text-gray-500 line-through">
                                      ₹
                                      {formatPrice(
                                        product.originalPrice *
                                          item.quantity
                                      )}
                                    </p>
                                  )}
                              </div>
                            </div>

                            {/* Quantity + Remove */}
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      product._id
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center text-lg font-bold transition hover:bg-gray-100"
                                  aria-label={`Decrease quantity of ${product.name}`}
                                >
                                  −
                                </button>

                                <span className="flex h-10 min-w-12 items-center justify-center border-x border-gray-300 px-3 text-sm font-semibold">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      product._id
                                    )
                                  }
                                  disabled={
                                    item.quantity >=
                                    product.stock
                                  }
                                  className="flex h-10 w-10 items-center justify-center text-lg font-bold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                  aria-label={`Increase quantity of ${product.name}`}
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">
                                  {product.stock > 0
                                    ? `${product.stock} available`
                                    : "Out of stock"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(
                                      product._id
                                    )
                                  }
                                  className="text-sm font-semibold text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="border-b px-6 py-5">
                  <h2 className="text-xl font-bold">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>
                      Subtotal ({totalItems}{" "}
                      {totalItems === 1 ? "item" : "items"})
                    </span>

                    <span className="font-medium text-gray-900">
                      ₹{formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Shipping</span>

                    <span
                      className={`font-medium ${
                        shipping === 0
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {shipping === 0
                        ? "FREE"
                        : `₹${formatPrice(shipping)}`}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        Total
                      </span>

                      <span className="text-2xl font-bold">
                        ₹{formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  {/* Free Shipping Message */}
                  {subtotal > 0 && subtotal < 999 && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                      Add ₹
                      {formatPrice(999 - subtotal)} more
                      to get{" "}
                      <strong>FREE shipping</strong>.
                    </div>
                  )}

                  {subtotal >= 999 && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
                      🎉 You have unlocked FREE shipping!
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Link
                    href="/checkout"
                    className="flex w-full items-center justify-center rounded-lg bg-yellow-400 px-5 py-4 text-base font-bold text-gray-900 transition hover:bg-yellow-500"
                  >
                    Proceed to Checkout
                  </Link>

                  {/* Continue Shopping */}
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Continue Shopping
                  </Link>

                  {/* Security */}
                  <div className="border-t pt-5 text-center text-xs text-gray-500">
                    🔒 Secure checkout
                    <br />
                    Your payment information is protected.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}