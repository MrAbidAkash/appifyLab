// src/lib/models/Reply.ts
import mongoose, { Schema } from "mongoose";
import Comment from "./Comment";

const ReplySchema: Schema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
        },
      },
    ],
  },
  { timestamps: true },
);

// ✅ Prevent duplicate reply IDs
ReplySchema.post("save", async function (doc) {
  try {
    await Comment.findByIdAndUpdate(doc.comment, {
      $addToSet: { replies: doc._id }, // ✅ FIXED
    });
  } catch (err) {
    console.error("Error adding reply ref to comment:", err);
  }
});

const Reply = mongoose.models.Reply || mongoose.model("Reply", ReplySchema);

export default Reply;
