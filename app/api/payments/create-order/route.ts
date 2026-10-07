import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";

    import {connectDB} from "@/lib/mongodb";
import Order from "@/models/Order";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { orderId } = body;

    // Validate order ID
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID.",
        },
        { status: 400 }
      );
    }

    // Find FrameMart order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // Prevent creating another Razorpay order
    if (order.razorpayOrderId) {
      return NextResponse.json({
        success: true,
        message: "Razorpay order already exists.",
        razorpayOrderId: order.razorpayOrderId,
        amount: order.total * 100,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // Make sure total is valid
    if (typeof order.total !== "number" || order.total <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order amount.",
        },
        { status: 400 }
      );
    }

    // Razorpay uses smallest currency unit
    // ₹999 = 99900 paise
    const amountInPaise = Math.round(order.total * 100);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        framemartOrderId: order._id.toString(),
      },
    });

    // Save Razorpay order ID in MongoDB
    order.razorpayOrderId = razorpayOrder.id;

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Razorpay order created successfully.",
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}