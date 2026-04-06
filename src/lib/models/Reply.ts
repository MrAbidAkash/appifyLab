// src/lib/models/Reply.ts
import mongoose, { Schema } from "mongoose";
import Comment from "./Comment";

const ReplySchema: Schema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
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
  },
  { timestamps: true },
);

ReplySchema.post("save", async function (doc) {
  try {
    await Comment.findByIdAndUpdate(doc.comment, {
      $push: { replies: doc._id },
    });
  } catch (err) {
    console.error("Error adding reply ref to comment:", err);
  }
});

const Reply = mongoose.models.Reply || mongoose.model("Reply", ReplySchema);
export default Reply;
