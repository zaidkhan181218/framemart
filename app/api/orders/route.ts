

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";

export const runtime = "nodejs";

const MAX_ITEMS = 20;

type OrderRequest = {
  items?: {
    productId?: string;
    quantity?: number;
  }[];
  shippingAddress?: {
    name?: string;
    countryCode?: string;
    phone?: string;
    pincode?: string;
    address?: string;
    city?: string;
    state?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as OrderRequest;
    const { items, shippingAddress } = body;

    // Validate cart items.
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > MAX_ITEMS
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid order items." },
        { status: 400 }
      );
    }

    // Validate delivery address.
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return NextResponse.json(
        { success: false, message: "Delivery address is required." },
        { status: 400 }
      );
    }

    const {
      name,
      countryCode,
      phone,
      pincode,
      address,
      city,
      state,
    } = shippingAddress;

    // Validate name and other required address fields.
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      typeof pincode !== "string" ||
      !/^\d{6}$/.test(pincode) ||
      typeof address !== "string" ||
      address.trim().length < 5 ||
      address.trim().length > 300 ||
      typeof city !== "string" ||
      !city.trim() ||
      city.trim().length > 100 ||
      typeof state !== "string" ||
      !state.trim() ||
      state.trim().length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter valid delivery details.",
        },
        { status: 400 }
      );
    }

    // Validate international phone number.
    if (
      typeof countryCode !== "string" ||
      !/^\+[1-9]\d{0,2}$/.test(countryCode) ||
      typeof phone !== "string" ||
      !/^\d{4,14}$/.test(phone)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number.",
        },
        { status: 400 }
      );
    }

    const fullPhone = `${countryCode}${phone}`.replace(/\D/g, "");

    if (fullPhone.length < 8 || fullPhone.length > 15) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number.",
        },
        { status: 400 }
      );
    }

    // Validate cart product IDs and quantities.
    const seenIds = new Set<string>();

    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !mongoose.Types.ObjectId.isValid(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity! < 1 ||
        item.quantity! > 20 ||
        seenIds.has(item.productId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid or duplicate cart item.",
          },
          { status: 400 }
        );
      }

      seenIds.add(item.productId);
    }

    // Fetch products from the database.
    const productIds = items.map((item) => item.productId!);

    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more products were not found.",
        },
        { status: 404 }
      );
    }

    // Verify stock and calculate order items using database prices.
    const orderItems = items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId
      );

      if (!product) {
        throw new Error("Product not found.");
      }

      if (product.stock < item.quantity!) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`
        );
      }

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity!,
      };
    });

    // Calculate totals on the server.
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const shipping = subtotal >= 999 ? 0 : 49;
    const total = subtotal + shipping;

    // Create order in MongoDB.
    const order = await Order.create({
      items: orderItems,
      shippingAddress: {
        name: name.trim(),
        countryCode,
        phone,
        pincode,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
      },
      subtotal,
      shipping,
      total,
      paymentMethod: "online",
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully.",
        order: {
          id: order._id.toString(),
          subtotal: order.subtotal,
          shipping: order.shipping,
          total: order.total,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create order.";

    if (message.startsWith("Insufficient stock")) {
      return NextResponse.json(
        { success: false, message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create order.",
      },
      { status: 500 }
    );
  }
}