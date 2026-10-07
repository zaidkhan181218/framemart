

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

const products = [
  {
    name: "Classic Wooden Frame",
    slug: "classic-wooden-frame",
    description: "Premium classic wooden photo frame for your memories.",
    price: 799,
    originalPrice: 999,
    category: "Wooden",
    image: "https://placehold.co/600x600?text=Wooden+Frame",
    rating: 4.8,
    reviews: 120,
    stock: 15,
  },
  {
    name: "Modern Black Frame",
    slug: "modern-black-frame",
    description: "Elegant black frame with a modern minimalist design.",
    price: 999,
    originalPrice: 1299,
    category: "Modern",
    image: "https://placehold.co/600x600?text=Black+Frame",
    rating: 4.7,
    reviews: 98,
    stock: 20,
  },
  {
    name: "Golden Luxury Frame",
    slug: "golden-luxury-frame",
    description: "Luxury golden photo frame for special occasions.",
    price: 1499,
    originalPrice: 1799,
    category: "Luxury",
    image: "https://placehold.co/600x600?text=Golden+Frame",
    rating: 4.9,
    reviews: 75,
    stock: 10,
  },
];

export async function POST() {
  try {
    await connectDB();

    const results = await Promise.all(
      products.map(async (item) => {
        const existing = await Product.findOne({
          slug: item.slug,
        });

        if (existing) {
          return { slug: item.slug, status: "already_exists" };
        }

        await Product.create(item);
        return { slug: item.slug, status: "created" };
      })
    );

    return NextResponse.json({
      success: true,
      message: "Seeding completed",
      created: results.filter(
        (item) => item.status === "created"
      ).length,
      skipped: results.filter(
        (item) => item.status === "already_exists"
      ).length,
      results,
    });
  } catch (error) {
    console.error("Seed API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Seeding failed",
      },
      { status: 500 }
    );
  }
}