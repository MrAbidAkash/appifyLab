/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await connectToDatabase();

  try {
    const body = await request.json();
    const { email, password: userPassword } = body;

    // find user
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found", status: 400 },
        { status: 400 },
      );
    }

    // check password
    const isPasswordValid = await bcrypt.compare(userPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid password", status: 400 },
        { status: 400 },
      );
    }

    // remove sensitive fields
    const { password, createdAt, updatedAt, ...userData } = user;

    // create JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "23h" },
    );

    // create response
    const response = NextResponse.json({
      message: "User logged in successfully",
      data: userData,
      status: 200,
    });

    // set HTTP-only cookie
    response.cookies.set({
      name: "token", // cookie name
      value: token, // JWT
      httpOnly: true, // not accessible via JS
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/", // cookie available to all paths
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
