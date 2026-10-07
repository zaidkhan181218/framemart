
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    await connectDB();

    const { slug } = await params;

    const product = await Product.findOne({
      slug: slug.toLowerCase(),
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Single product API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    await connectDB();

    const { slug } = await params;
    const body = await request.json();

    const allowedFields = [
      "name",
      "slug",
      "description",
      "price",
      "originalPrice",
      "category",
      "image",
      "rating",
      "reviews",
      "stock",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields provided",
        },
        { status: 400 }
      );
    }

    if (
      "name" in updates &&
      (typeof updates.name !== "string" ||
        !updates.name.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid name" },
        { status: 400 }
      );
    }

    if (
      "slug" in updates &&
      (typeof updates.slug !== "string" ||
        !updates.slug.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid slug" },
        { status: 400 }
      );
    }

    if (
      "description" in updates &&
      (typeof updates.description !== "string" ||
        !updates.description.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid description" },
        { status: 400 }
      );
    }

    if (
      "category" in updates &&
      (typeof updates.category !== "string" ||
        !updates.category.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid category" },
        { status: 400 }
      );
    }

    if (
      "image" in updates &&
      (typeof updates.image !== "string" ||
        !updates.image.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid image URL" },
        { status: 400 }
      );
    }

    for (const field of [
      "price",
      "originalPrice",
      "rating",
      "reviews",
      "stock",
    ]) {
      if (field in updates) {
        const value = updates[field];

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return NextResponse.json(
            { success: false, message: `Invalid ${field}` },
            { status: 400 }
          );
        }

        if (value < 0) {
          return NextResponse.json(
            { success: false, message: `${field} cannot be negative` },
            { status: 400 }
          );
        }

        if (
          (field === "stock" || field === "reviews") &&
          !Number.isInteger(value)
        ) {
          return NextResponse.json(
            { success: false, message: `${field} must be an integer` },
            { status: 400 }
          );
        }

        if (field === "rating" && value > 5) {
          return NextResponse.json(
            { success: false, message: "Rating cannot exceed 5" },
            { status: 400 }
          );
        }
      }
    }

    for (const field of [
      "name",
      "description",
      "category",
      "image",
    ]) {
      if (field in updates && typeof updates[field] === "string") {
        updates[field] = (updates[field] as string).trim();
      }
    }

    if ("slug" in updates) {
      updates.slug = (updates.slug as string).trim().toLowerCase();
    }

    const product = await Product.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Products PUT error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "Product slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    await connectDB();

    const { slug } = await params;

    const product = await Product.findOneAndDelete({
      slug: slug.toLowerCase(),
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    console.error("Products DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}