/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Post from "@/lib/models/Post";
import User from "@/lib/models/User";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Authentication middleware
const authenticateUser = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return decoded.id;
  } catch {
    throw new Error("Invalid token");
  }
};

export async function POST(request: Request) {
  await connectToDatabase();

  try {
    // Authentication
    const userId = await authenticateUser();

    // Get body
    const body = await request.json();
    const { title, image, visibility } = body;

    // Validate required fields
    if (!title || !visibility) {
      return NextResponse.json(
        { error: "Title and visibility are required" },
        { status: 400 },
      );
    }

    // Validate visibility values
    if (!["public", "private"].includes(visibility)) {
      return NextResponse.json(
        { error: "Visibility must be 'public' or 'private'" },
        { status: 400 },
      );
    }

    let imageUrl = "";
    if (image) {
      // Upload image to Cloudinary
      try {
        imageUrl = await uploadImageToCloudinary(image, "appify/posts");
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 },
        );
      }
    }

    // Create post with author (data ownership enforced)
    const post = await Post.create({
      title,
      image: imageUrl,
      author: userId, // Data ownership - user can only create posts as themselves
      visibility,
    });

    // Populate author details for response
    await post.populate({
      path: "author",
      model: User,
      select: "firstName lastName email",
    });

    return NextResponse.json(
      {
        success: true,
        post: {
          _id: post._id,
          title: post.title,
          image: post.image,
          visibility: post.visibility,
          createdAt: post.createdAt,
          author: post.author,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating post:", error);

    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 },
    );
  }
}
