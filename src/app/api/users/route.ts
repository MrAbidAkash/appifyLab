/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcrypt";

export async function GET() {
  await connectToDatabase();
  const users = await User.find({});
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  await connectToDatabase();
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    const user = await User.findOne({ email });
    if (user) {
      return NextResponse.json(
        {
          message: "User already exists",
          status: 400,
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });
    await newUser.save();

    return NextResponse.json(
      { message: "User created successfully", status: 200 },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
