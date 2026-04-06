// src/lib/models/Post.ts
import mongoose, { Schema } from "mongoose";

const PostSchema: Schema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    image: { type: String },
    isPrivate: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
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

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
export default Post;
