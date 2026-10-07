import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body;

    // Validate required fields
    if (
      !orderId ||
      typeof orderId !== "string" ||
      !razorpayPaymentId ||
      typeof razorpayPaymentId !== "string" ||
      !razorpayOrderId ||
      typeof razorpayOrderId !== "string" ||
      !razorpaySignature ||
      typeof razorpaySignature !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification details are incomplete.",
        },
        { status: 400 }
      );
    }

    // Validate MongoDB Order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid FrameMart order ID.",
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
          message: "FrameMart order not found.",
        },
        { status: 404 }
      );
    }

    // Make sure the Razorpay order belongs to this FrameMart order
    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay order does not match FrameMart order.",
        },
        { status: 400 }
      );
    }

    // Prevent unnecessary re-verification
    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment is already verified.",
        orderId: order._id.toString(),
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      });
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay secret key is not configured.",
        },
        { status: 500 }
      );
    }

    // Create signature
    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    // Compare signatures securely
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpaySignature, "utf8");

    if (
      generatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(generatedBuffer, receivedBuffer)
    ) {
      order.paymentStatus = "failed";

      await order.save();

      return NextResponse.json(
        {
          success: false,
          message: "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    // Payment verified successfully
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      orderId: order._id.toString(),
      paymentId: razorpayPaymentId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Razorpay payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify payment.",
      },
      { status: 500 }
    );
  }
}