"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LastOrder {
  orderId?: string;
  paymentId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  total?: number;
}

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedOrder = sessionStorage.getItem(
        "framemart-last-order"
      );

      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);

        if (parsedOrder && typeof parsedOrder === "object") {
          setOrder(parsedOrder);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load order information:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-500" />

            <p className="mt-4 text-gray-600">
              Loading order details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <section className="px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Success Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* Success Header */}
            <div className="bg-green-50 px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
                ✓
              </div>

              <h1 className="mt-6 text-3xl font-bold text-green-700 sm:text-4xl">
                Payment Successful!
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                Thank you for shopping with FrameMart. Your
                payment has been successfully verified and your
                order has been confirmed.
              </p>
            </div>

            {/* Order Details */}
            <div className="px-6 py-8 sm:px-10">
              {order ? (
                <div>
                  <h2 className="text-xl font-bold">
                    Order Details
                  </h2>

                  <div className="mt-6 divide-y rounded-xl border">
                    {/* Order ID */}
                    {order.orderId && (
                      <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-500">
                          FrameMart Order ID
                        </span>

                        <span className="break-all text-sm font-semibold">
                          {order.orderId}
                        </span>
                      </div>
                    )}

                    {/* Payment ID */}
                    {order.paymentId && (
                      <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-500">
                          Razorpay Payment ID
                        </span>

                        <span className="break-all text-sm font-semibold">
                          {order.paymentId}
                        </span>
                      </div>
                    )}

                    {/* Payment Status */}
                    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-gray-500">
                        Payment Status
                      </span>

                      <span className="font-semibold capitalize text-green-600">
                        {order.paymentStatus || "Paid"}
                      </span>
                    </div>

                    {/* Order Status */}
                    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-gray-500">
                        Order Status
                      </span>

                      <span className="font-semibold capitalize text-blue-600">
                        {order.orderStatus || "Confirmed"}
                      </span>
                    </div>

                    {/* Total */}
                    {typeof order.total === "number" && (
                      <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-500">
                          Order Total
                        </span>

                        <span className="text-xl font-bold">
                          ₹
                          {order.total.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Message */}
                  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                    <div className="flex gap-3">
                      <span className="text-xl">📦</span>

                      <div>
                        <h3 className="font-bold text-green-800">
                          Your order has been confirmed
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-green-700">
                          We have received your payment and
                          your order is now being processed.
                          You can check your order status from
                          the My Orders section.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback */
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                  <div className="flex gap-3">
                    <span className="text-xl">ℹ️</span>

                    <div>
                      <h2 className="font-bold text-yellow-800">
                        Order information unavailable
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-yellow-700">
                        Your payment may have been successful,
                        but the order details are not available
                        in this browser session. Please check
                        My Orders for your latest order.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/orders"
                  className="flex items-center justify-center rounded-lg bg-yellow-400 px-5 py-4 font-bold text-gray-900 transition hover:bg-yellow-500"
                >
                  📋 View My Orders
                </Link>

                <Link
                  href="/"
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-4 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  🛍️ Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-5 text-center shadow-sm">
              <div className="text-2xl">🔒</div>

              <h3 className="mt-2 font-semibold">
                Secure Payment
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Your payment was securely processed.
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 text-center shadow-sm">
              <div className="text-2xl">📦</div>

              <h3 className="mt-2 font-semibold">
                Order Processing
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                We will prepare your frames for delivery.
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 text-center shadow-sm">
              <div className="text-2xl">❤️</div>

              <h3 className="mt-2 font-semibold">
                Thank You
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Thank you for choosing FrameMart.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}