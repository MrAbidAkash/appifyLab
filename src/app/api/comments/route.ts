/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const { postId, author, content } = await req.json();

    console.log("postId", postId);
    console.log("author", author);
    console.log("content", content);

    if (!postId || !author || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newComment = new Comment({
      post: postId,
      author,
      content,
      likes: [],
      replies: [],
    });

    await newComment.save();

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
