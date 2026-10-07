"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
const WISHLIST_KEY = "framemart-wishlist";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const slug =
    typeof params.slug === "string" ? params.slug : "";

  const [product, setProduct] = useState<Product | null>(
    null
  );

  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load cart and wishlist
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      const savedWishlist =
        localStorage.getItem(WISHLIST_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }

      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);

        if (Array.isArray(parsedWishlist)) {
          setWishlistIds(parsedWishlist.map(String));
        }
      }
    } catch (err) {
      console.error(
        "Failed to load cart/wishlist:",
        err
      );
    }
  }, []);

  // Fetch product
  useEffect(() => {
    if (!slug) {
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Product not found.");
          }

          throw new Error(
            "Failed to load product."
          );
        }

        const data = await response.json();

        if (!data.success || !data.product) {
          throw new Error("Product not found.");
        }

        setProduct(data.product);
      } catch (err) {
        console.error(
          "Product details error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Save cart
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

  // Save wishlist
  const saveWishlist = (updatedWishlist: string[]) => {
    setWishlistIds(updatedWishlist);

    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify(updatedWishlist)
    );

    window.dispatchEvent(
      new Event("framemart-storage-updated")
    );
  };

  // Temporary notification
  const showNotice = (message: string) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  // Add product to cart
  const addToCart = () => {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      showNotice("This product is currently out of stock.");
      return;
    }

    if (quantity > product.stock) {
      showNotice(
        `Only ${product.stock} items are available.`
      );
      return;
    }

    const existingItem = cart.find(
      (item) => item.product._id === product._id
    );

    let updatedCart: CartItem[];

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        showNotice(
          `Only ${product.stock} items are available.`
        );
        return;
      }

      updatedCart = cart.map((item) =>
        item.product._id === product._id
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          product,
          quantity,
        },
      ];
    }

    saveCart(updatedCart);

    showNotice("Product added to cart.");
  };

  // Buy now
  const buyNow = () => {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      showNotice("This product is currently out of stock.");
      return;
    }

    if (quantity > product.stock) {
      showNotice(
        `Only ${product.stock} items are available.`
      );
      return;
    }

    const existingItem = cart.find(
      (item) => item.product._id === product._id
    );

    let updatedCart: CartItem[];

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        showNotice(
          `Only ${product.stock} items are available.`
        );
        return;
      }

      updatedCart = cart.map((item) =>
        item.product._id === product._id
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          product,
          quantity,
        },
      ];
    }

    saveCart(updatedCart);

    router.push("/checkout");
  };

  // Toggle wishlist
  const toggleWishlist = () => {
    if (!product) {
      return;
    }

    const isInWishlist = wishlistIds.includes(
      product._id
    );

    if (isInWishlist) {
      const updatedWishlist = wishlistIds.filter(
        (id) => id !== product._id
      );

      saveWishlist(updatedWishlist);
      showNotice("Removed from wishlist.");
    } else {
      const updatedWishlist = [
        ...wishlistIds,
        product._id,
      ];

      saveWishlist(updatedWishlist);
      showNotice("Added to wishlist ❤️");
    }
  };

  // Discount percentage
  const discount = useMemo(() => {
    if (
      !product?.originalPrice ||
      product.originalPrice <= product.price
    ) {
      return 0;
    }

    return Math.round(
      ((product.originalPrice - product.price) /
        product.originalPrice) *
        100
    );
  }, [product]);

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-500"></div>

            <p className="mt-4 text-gray-600">
              Loading product...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Error / Product not found
  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">😕</div>

            <h1 className="mt-5 text-2xl font-bold">
              Product Not Found
            </h1>

            <p className="mt-3 text-gray-600">
              {error ||
                "The product you're looking for does not exist."}
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-lg bg-yellow-400 px-7 py-3 font-bold text-gray-900 transition hover:bg-yellow-500"
            >
              Back to Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isInWishlist = wishlistIds.includes(
    product._id
  );

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      {/* Notification */}
      {notice && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {notice}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link
              href="/"
              className="hover:text-blue-600"
            >
              Home
            </Link>

            <span>›</span>

            <span>{product.category}</span>

            <span>›</span>

            <span className="font-medium text-gray-800">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Product Image */}
            <div className="relative bg-gray-100">
              {discount > 0 && (
                <span className="absolute left-5 top-5 z-10 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white">
                  {discount}% OFF
                </span>
              )}

              <button
                type="button"
                onClick={toggleWishlist}
                className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md transition hover:scale-105"
                aria-label={
                  isInWishlist
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
              >
                {isInWishlist ? "❤️" : "🤍"}
              </button>

              <div className="flex min-h-[400px] items-center justify-center p-6 sm:min-h-[500px] lg:min-h-[600px]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-[560px] w-full object-contain"
                />
              </div>
            </div>

            {/* Product Information */}
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                {product.category}
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold text-white">
                  ⭐ {product.rating ?? 0}
                </span>

                <span className="text-sm text-gray-600">
                  {product.reviews ?? 0} customer reviews
                </span>
              </div>

              <div className="my-7 border-t"></div>

              {/* Price */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-4xl font-bold">
                    ₹
                    {product.price.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                  {product.originalPrice &&
                    product.originalPrice >
                      product.price && (
                      <span className="text-lg text-gray-500 line-through">
                        ₹
                        {product.originalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}

                  {discount > 0 && (
                    <span className="rounded bg-green-100 px-2 py-1 text-sm font-bold text-green-700">
                      {discount}% off
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  Inclusive of all applicable taxes
                </p>
              </div>

              {/* Stock */}
              <div className="mt-6">
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-600"></span>

                    <span className="font-semibold">
                      In Stock
                    </span>

                    <span className="text-sm text-gray-500">
                      ({product.stock} available)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>

                    <span className="font-semibold">
                      Currently Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-7">
                <h2 className="text-lg font-bold">
                  Product Description
                </h2>

                <p className="mt-3 leading-7 text-gray-600">
                  {product.description}
                </p>
              </div>

              {/* Quantity */}
              {product.stock > 0 && (
                <div className="mt-7">
                  <label className="mb-2 block text-sm font-semibold">
                    Quantity
                  </label>

                  <div className="flex w-fit items-center overflow-hidden rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          Math.max(1, quantity - 1)
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center text-xl font-bold transition hover:bg-gray-100"
                    >
                      −
                    </button>

                    <span className="flex h-11 min-w-14 items-center justify-center border-x border-gray-300 px-4 font-semibold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            product.stock,
                            quantity + 1
                          )
                        )
                      }
                      disabled={
                        quantity >= product.stock
                      }
                      className="flex h-11 w-11 items-center justify-center text-xl font-bold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 rounded-lg bg-yellow-400 px-6 py-4 font-bold text-gray-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  🛒 Add to Cart
                </button>

                <button
                  type="button"
                  onClick={buyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 rounded-lg bg-orange-500 px-6 py-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Buy Now
                </button>
              </div>

              <button
                type="button"
                onClick={toggleWishlist}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition ${
                  isInWishlist
                    ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isInWishlist
                  ? "❤️ Remove from Wishlist"
                  : "♡ Add to Wishlist"}
              </button>

              {/* Benefits */}
              <div className="mt-8 grid grid-cols-1 gap-4 border-t pt-7 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl">🚚</div>
                  <p className="mt-2 text-sm font-semibold">
                    Fast Delivery
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Quick doorstep delivery
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl">🔒</div>
                  <p className="mt-2 text-sm font-semibold">
                    Secure Payment
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Safe online payment
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl">✨</div>
                  <p className="mt-2 text-sm font-semibold">
                    Quality Frames
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Made for your memories
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Continue Shopping
          </Link>

          <Link
            href="/cart"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View Cart 🛒
          </Link>

          <Link
            href="/wishlist"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View Wishlist ❤️
          </Link>
        </div>
      </section>
    </main>
  );
}