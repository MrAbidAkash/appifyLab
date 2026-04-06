/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Post from "@/lib/models/Post";
import { deletePostImage } from "@/lib/imageCleanup";
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();

  try {
    // Authentication
    const userId = await authenticateUser();
    const { id: postId } = await params; // Await the params Promise

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Find the post and ensure user owns it
    const post = await Post.findOne({ _id: postId, author: userId });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or you don't have permission to delete it" },
        { status: 404 },
      );
    }

    // Delete image from Cloudinary if it exists
    if (post.image) {
      await deletePostImage(post.image);
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting post:", error);

    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete post", details: error.message },
      { status: 500 },
    );
  }
}
