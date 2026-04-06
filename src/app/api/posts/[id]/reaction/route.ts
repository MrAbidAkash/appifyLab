/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db";
import Post from "@/lib/models/Post";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Change this line
  try {
    await connectToDatabase();

    const { userId, reaction } = await req.json();
    // reaction = "like" | "love" | "haha" | "wow" | "sad" | "angry"
    console.log("userId,", userId);
    console.log("reaction,", reaction);

    const { id: postId } = await params; // Already fixed here, but params signature was wrong
    console.log("postId,", postId);
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // find existing reaction by this user
    const existing = post.reactions.find(
      (r: any) => r.userId.toString() === userId,
    );

    //existing.type === reaction ||
    if (existing) {
      if (reaction === null) {
        // Null reaction → remove (unreact)
        post.reactions = post.reactions.filter(
          (r: any) => r.userId.toString() !== userId,
        );
      } else {
        // Different reaction → update to new one
        existing.type = reaction;
      }
    } else {
      // No reaction → add new
      post.reactions.push({ userId, type: reaction });
    }

    await post.save();

    return NextResponse.json({
      success: true,
      reactions: post.reactions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
