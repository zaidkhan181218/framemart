"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  countryCode: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders/my-orders");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch orders.");
        }

        setOrders(data.orders || []);
      } catch (error) {
        console.error("Orders fetch error:", error);
        setError("Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "shipped":
        return "bg-purple-100 text-purple-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-600">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-3">
            Something went wrong
          </h1>

          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Orders
            </h1>

            <p className="text-gray-600 mt-1">
              View and track your FrameMart orders
            </p>
          </div>

          <Link
            href="/"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-5 py-3 rounded-lg text-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Empty Orders */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-5">
              📦
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No orders yet
            </h2>

            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet.
            </p>

            <Link
              href="/"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >

                {/* Order Header */}
                <div className="border-b bg-gray-50 px-5 py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    <div>
                      <p className="text-sm text-gray-500">
                        Order ID
                      </p>

                      <p className="font-semibold text-gray-900 break-all">
                        {order._id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Order Date
                      </p>

                      <p className="font-medium text-gray-900">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Products */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Items
                  </h3>

                  <div className="space-y-4">

                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>

                          <p className="text-sm text-gray-500 mt-1">
                            ₹{item.price.toLocaleString("en-IN")} ×{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="font-semibold text-gray-900">
                          ₹
                          {(item.price * item.quantity).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    ))}

                  </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Delivery */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Delivery Address
                    </h3>

                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.name}
                    </p>

                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.address}
                    </p>

                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} -{" "}
                      {order.shippingAddress.pincode}
                    </p>

                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.countryCode}{" "}
                      {order.shippingAddress.phone}
                    </p>
                  </div>

                  {/* Payment Summary */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Payment Summary
                    </h3>

                    <div className="space-y-2 text-sm">

                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Subtotal
                        </span>

                        <span>
                          ₹{order.subtotal.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Shipping
                        </span>

                        <span>
                          {order.shipping === 0
                            ? "FREE"
                            : `₹${order.shipping.toLocaleString(
                                "en-IN"
                              )}`}
                        </span>
                      </div>

                      <div className="border-t pt-2 flex justify-between text-base font-bold">
                        <span>
                          Total
                        </span>

                        <span>
                          ₹{order.total.toLocaleString("en-IN")}
                        </span>
                      </div>

                    </div>

                    <div className="mt-4">
                      <span className="text-sm text-gray-600">
                        Payment:{" "}
                      </span>

                      <span
                        className={`text-sm font-semibold capitalize ${
                          order.paymentStatus === "paid"
                            ? "text-green-600"
                            : order.paymentStatus === "failed"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}