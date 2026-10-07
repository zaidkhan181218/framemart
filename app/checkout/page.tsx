
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput, {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

interface Address {
  name: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    contact: string;
  };
  notes: {
    framemartOrderId: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

const cities = [
  "Kanpur",
  "Lucknow",
  "Delhi",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Jaipur",
  "Agra",
  "Noida",
  "Ghaziabad",
  "Prayagraj",
  "Varanasi",
];

const states = [
  "Uttar Pradesh",
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Telangana",
  "Tamil Nadu",
  "West Bengal",
  "Rajasthan",
  "Bihar",
  "Madhya Pradesh",
  "Gujarat",
  "Haryana",
  "Punjab",
  "Uttarakhand",
  "Kerala",
  "Andhra Pradesh",
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "Assam",
  "Himachal Pradesh",
  "Jammu and Kashmir",
];

export default function CheckoutPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [phone, setPhone] = useState<string | undefined>("+91");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [address, setAddress] = useState<Address>({
    name: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
  });

  /*
   * Load Razorpay Checkout script
   */
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      console.log("Razorpay Checkout loaded successfully.");
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout.");
    };

    document.body.appendChild(script);
  }, []);

  /*
   * Load cart and products
   */
  useEffect(() => {
    async function loadCheckout() {
      try {
        const savedCart = localStorage.getItem("framemart-cart");
        const parsedCart = savedCart ? JSON.parse(savedCart) : {};

        if (
          !parsedCart ||
          typeof parsedCart !== "object" ||
          Array.isArray(parsedCart)
        ) {
          throw new Error("Invalid cart data.");
        }

        const validCart: Record<string, number> = {};

        for (const [id, quantity] of Object.entries(parsedCart)) {
          if (
            typeof id === "string" &&
            Number.isInteger(quantity) &&
            Number(quantity) > 0
          ) {
            validCart[id] = Number(quantity);
          }
        }

        setCart(validCart);

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Products load nahi ho paaye.");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.products)) {
          throw new Error("Invalid product data.");
        }

        setProducts(data.products);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Checkout load nahi ho paya."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, []);

  const cartProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          Number.isInteger(cart[product._id]) &&
          cart[product._id] > 0
      ),
    [products, cart]
  );

  const subtotal = cartProducts.reduce(
    (sum, product) =>
      sum + product.price * cart[product._id],
    0
  );

  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 49;

  const total = subtotal + shipping;

  const updateAddress = (
    field: keyof Address,
    value: string
  ) => {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  /*
   * Save order information for order-success page
   */
  const saveOrderDetails = (
    orderId: string,
    paymentStatus: string,
    orderStatus: string
  ) => {
    const orderDetails = {
      orderId,
      paymentStatus,
      orderStatus,
      subtotal,
      shipping,
      total,
      items: cartProducts.map((product) => ({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: cart[product._id],
      })),
    };

    sessionStorage.setItem(
      "framemart-last-order",
      JSON.stringify(orderDetails)
    );
  };

  /*
   * Open Razorpay Checkout
   */
  const openRazorpayCheckout = async (
    framemartOrderId: string
  ) => {
    try {
      setPaymentLoading(true);
      setError("");

      /*
       * Make sure Razorpay script is loaded
       */
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout load nahi hua. Please refresh the page and try again."
        );
      }

      /*
       * Create Razorpay order
       */
      const razorpayOrderResponse = await fetch(
        "/api/payments/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: framemartOrderId,
          }),
        }
      );

      const razorpayOrderData =
        await razorpayOrderResponse.json();

      if (
        !razorpayOrderResponse.ok ||
        !razorpayOrderData.success ||
        !razorpayOrderData.razorpayOrderId
      ) {
        throw new Error(
          razorpayOrderData.message ||
            "Razorpay order create nahi ho paya."
        );
      }

      /*
       * Open Razorpay Checkout
       */
      const options: RazorpayOptions = {
        key: razorpayOrderData.keyId,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency || "INR",
        name: "FrameMart",
        description: "Photo Frame Purchase",
        order_id: razorpayOrderData.razorpayOrderId,

        prefill: {
          name: address.name.trim(),
          contact: phone || "",
        },

        notes: {
          framemartOrderId,
        },

        theme: {
          color: "#f7cf46",
        },

        /*
         * Razorpay sends these values after successful payment
         */
        handler: async (
          response: RazorpayResponse
        ) => {
          try {
            setPaymentLoading(true);
            setError("");

            /*
             * Verify payment on our server
             */
            const verifyResponse = await fetch(
              "/api/payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: framemartOrderId,
                  razorpayPaymentId:
                    response.razorpay_payment_id,
                  razorpayOrderId:
                    response.razorpay_order_id,
                  razorpaySignature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            /*
             * Payment successfully verified
             */
            saveOrderDetails(
              framemartOrderId,
              verifyData.paymentStatus || "paid",
              verifyData.orderStatus || "confirmed"
            );

            /*
             * Clear cart only after successful payment
             */
            localStorage.removeItem("framemart-cart");

            setCart({});

            /*
             * Go to order success page
             */
            router.push("/order-success");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed."
            );

            setPaymentLoading(false);
            setSubmitting(false);
          }
        },

        /*
         * User closes Razorpay popup
         */
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setSubmitting(false);

            setError(
              "Payment was cancelled. Your cart is still available. You can try again."
            );
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open Razorpay Checkout."
      );

      setPaymentLoading(false);
      setSubmitting(false);
    }
  };

  /*
   * Create FrameMart order first
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting || paymentLoading) {
      return;
    }

    setError("");

    if (cartProducts.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const hasInvalidStock = cartProducts.some(
      (product) =>
        cart[product._id] > product.stock ||
        product.stock <= 0
    );

    if (hasInvalidStock) {
      setError(
        "Kuch products ka stock available nahi hai."
      );
      return;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      setError(
        "Please enter a valid phone number for the selected country."
      );
      return;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (
      !address.name.trim() ||
      !address.address.trim() ||
      !address.city.trim() ||
      !address.state.trim()
    ) {
      setError(
        "Please complete all required delivery details."
      );
      return;
    }

    const parsedPhone = parsePhoneNumber(phone);

    if (!parsedPhone) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);

    try {
      /*
       * STEP 1:
       * Create FrameMart order in MongoDB
       */
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartProducts.map((product) => ({
            productId: product._id,
            quantity: cart[product._id],
          })),

          shippingAddress: {
            name: address.name.trim(),
            countryCode: `+${parsedPhone.countryCallingCode}`,
            phone: parsedPhone.nationalNumber,
            pincode: address.pincode,
            address: address.address.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
          },

          paymentMethod: "online",
        }),
      });

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.order?.id
      ) {
        throw new Error(
          data.message ||
            "Order create nahi ho paya. Please try again."
        );
      }

      /*
       * STEP 2:
       * Create Razorpay order and open payment popup
       */
      await openRazorpayCheckout(data.order.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order."
      );

      setSubmitting(false);
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <p className="font-semibold text-[#172033]">
          Loading checkout...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-4 py-8 text-[#172033] sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black">
            Frame<span className="text-[#b88b12]">Mart.</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Continue shopping
          </Link>
        </header>

        <h1 className="mb-6 text-3xl font-black">
          Checkout
        </h1>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {cartProducts.length === 0 ? (
          <section className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-bold">
              Your cart is empty
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Add some photo frames before checkout.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-[#f7cf46] px-6 py-3 font-bold"
            >
              Explore products
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* Checkout form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-xl bg-white p-5 shadow-sm sm:p-7"
            >

              {/* Delivery address */}
              <section>
                <h2 className="text-xl font-black">
                  1. Delivery address
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the address where you want your frames
                  delivered.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  {/* Name */}
                  <label className="text-sm font-semibold">
                    Full name *

                    <input
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={address.name}
                      onChange={(e) =>
                        updateAddress(
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Enter your full name"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#b88b12]"
                    />
                  </label>

                  {/* Phone */}
                  <div className="text-sm font-semibold">
                    Mobile number *

                    <div className="mt-1">
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        countryCallingCodeEditable={false}
                        value={phone}
                        onChange={(value) => {
                          setPhone(value);
                          setError("");
                        }}
                        countrySelectProps={{
                          "aria-label":
                            "Select country",
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <label className="text-sm font-semibold sm:col-span-2">
                    House number, street and area *

                    <textarea
                      required
                      maxLength={300}
                      autoComplete="street-address"
                      value={address.address}
                      onChange={(e) =>
                        updateAddress(
                          "address",
                          e.target.value
                        )
                      }
                      placeholder="Enter complete delivery address"
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#b88b12]"
                    />
                  </label>

                  {/* PIN */}
                  <label className="text-sm font-semibold">
                    PIN code *

                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      title="Enter a valid 6-digit PIN code"
                      autoComplete="postal-code"
                      value={address.pincode}
                      onChange={(e) =>
                        updateAddress(
                          "pincode",
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      placeholder="6-digit PIN code"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#b88b12]"
                    />
                  </label>

                  {/* City */}
                  <label className="text-sm font-semibold">
                    City *

                    <input
                      required
                      maxLength={100}
                      list="framemart-cities"
                      autoComplete="address-level2"
                      value={address.city}
                      onChange={(e) =>
                        updateAddress(
                          "city",
                          e.target.value
                        )
                      }
                      placeholder="Enter or select city"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#b88b12]"
                    />

                    <datalist id="framemart-cities">
                      {cities.map((city) => (
                        <option
                          key={city}
                          value={city}
                        />
                      ))}
                    </datalist>
                  </label>

                  {/* State */}
                  <label className="text-sm font-semibold sm:col-span-2">
                    State *

                    <input
                      required
                      maxLength={100}
                      list="framemart-states"
                      autoComplete="address-level1"
                      value={address.state}
                      onChange={(e) =>
                        updateAddress(
                          "state",
                          e.target.value
                        )
                      }
                      placeholder="Enter or select state"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#b88b12]"
                    />

                    <datalist id="framemart-states">
                      {states.map((state) => (
                        <option
                          key={state}
                          value={state}
                        />
                      ))}
                    </datalist>
                  </label>
                </div>
              </section>

              {/* Payment */}
              <section className="border-t border-gray-200 pt-5">
                <h2 className="text-xl font-black">
                  2. Payment method
                </h2>

                <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="font-semibold">
                    Razorpay Online Payment
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    You will be redirected to Razorpay&apos;s
                    secure Test Checkout after clicking the
                    button below.
                  </p>
                </div>
              </section>

              {/* Pay button */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  paymentLoading ||
                  cartProducts.length === 0
                }
                className="w-full rounded-lg bg-[#f7cf46] px-5 py-3.5 font-bold text-[#172033] transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentLoading
                  ? "Opening payment..."
                  : submitting
                    ? "Creating order..."
                    : `Pay ₹${total.toLocaleString(
                        "en-IN"
                      )}`}
              </button>
            </form>

            {/* Order summary */}
            <aside className="h-fit rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black">
                Order summary
              </h2>

              <div className="mt-4 space-y-4">
                {cartProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex gap-3"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg bg-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                        ▣
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Quantity: {cart[product._id]}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-bold">
                      ₹
                      {(
                        product.price *
                        cart[product._id]
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-gray-200 pt-4 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Shipping
                  </span>

                  <span>
                    {shipping === 0
                      ? "Free"
                      : `₹${shipping.toLocaleString(
                          "en-IN"
                        )}`}
                  </span>
                </div>

                <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-black">
                  <span>Total</span>

                  <span>
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Free shipping on orders of ₹999 or more.
                Final stock and prices are verified by the
                server when placing the order.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}