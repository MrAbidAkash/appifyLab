/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db";
import Reply from "@/lib/models/Reply";
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
    const { id: replyId } = await params;
    console.log("replyId,", replyId);

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // find existing reaction by this user
    const existing = reply.reactions.find(
      (r: any) => r.userId.toString() === userId.toString(),
    );

    if (existing) {
      if (reaction === null) {
        // Null reaction → remove (unreact)
        reply.reactions = reply.reactions.filter(
          (r: any) => r.userId.toString() !== userId.toString(),
        );
      } else if (existing.type !== reaction) {
        // Different reaction → update to new one
        existing.type = reaction;
      }
      // If same reaction, do nothing (don't add duplicate)
    } else {
      // No reaction → add new
      reply.reactions.push({ userId, type: reaction });
    }

    await reply.save();

    return NextResponse.json({
      success: true,
      reactions: reply.reactions,
    });
  } catch (err: any) {
    console.log("error in reply reaction route", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
