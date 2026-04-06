/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // params is now a Promise
  try {
    await connectToDatabase();

    const { reaction } = await req.json();
    // reaction = "like" | "love" | "haha" | "wow" | "sad" | "angry"

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    let userId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET || "secret",
        );
        userId = decoded.id;
        console.log("Authenticated userId:", userId);
      } catch (err) {
        console.warn("Invalid token", err);
      }
    }

    console.log("userId,", userId);
    console.log("reaction,", reaction);

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params Promise to get the actual params object
    const { id: commentId } = await params;
    console.log("commentId,", commentId);

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // find existing reaction by this user
    const existing = comment.reactions.find(
      (r: any) => r.userId.toString() === userId.toString(),
    );

    if (existing) {
      if (reaction === null) {
        // Null reaction → remove (unreact)
        comment.reactions = comment.reactions.filter(
          (r: any) => r.userId.toString() !== userId.toString(),
        );
      } else if (existing.type !== reaction) {
        // Different reaction → update to new one
        existing.type = reaction;
      }
      // If same reaction, do nothing (don't add duplicate)
    } else {
      // No reaction → add new
      comment.reactions.push({ userId, type: reaction });
    }

    await comment.save();

    return NextResponse.json({
      success: true,
      reactions: comment.reactions,
    });
  } catch (err: any) {
    console.log("error in comment reaction route", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
