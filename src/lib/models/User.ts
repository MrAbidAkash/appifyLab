// src/lib/models/User.ts
import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    password: String,
  },
  {
    timestamps: true,
  },
);

const User = models.User || model("User", UserSchema);
export default User;
