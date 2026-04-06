// src/lib/models/Comment.ts
import mongoose, { Schema } from "mongoose";

const CommentSchema: Schema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    // likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
        },
      },
    ],
    replies: [{ type: Schema.Types.ObjectId, ref: "Reply" }],
  },
  { timestamps: true },
);

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
export default Comment;
