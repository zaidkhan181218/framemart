

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find().sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Products GET error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      originalPrice,
      category,
      image,
      rating,
      reviews,
      stock,
    } = body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof slug !== "string" || !slug.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof category !== "string" || !category.trim() ||
      typeof image !== "string" || !image.trim() ||
      !Number.isFinite(price) || price < 0 ||
      !Number.isFinite(originalPrice) || originalPrice < 0 ||
      !Number.isFinite(stock) || !Number.isInteger(stock) || stock < 0 ||
      (rating !== undefined &&
        (!Number.isFinite(rating) || rating < 0 || rating > 5)) ||
      (reviews !== undefined &&
        (!Number.isInteger(reviews) || reviews < 0))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid product data" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      price,
      originalPrice,
      category: category.trim(),
      image: image.trim(),
      rating: rating ?? 0,
      reviews: reviews ?? 0,
      stock,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product added successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Products POST error:", error);

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
      { success: false, message: "Failed to add product" },
      { status: 500 }
    );
  }
}