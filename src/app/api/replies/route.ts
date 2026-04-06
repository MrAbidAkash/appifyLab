/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db";
import Reply from "@/lib/models/Reply";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const { commentId, author, content } = await req.json();

    console.log("commentId", commentId);
    console.log("author", author);
    console.log("content", content);

    if (!commentId || !author || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newReply = new Reply({
      comment: commentId,
      author,
      content,
      reactions: [],
    });

    await newReply.save();

    return NextResponse.json({ success: true, reply: newReply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
