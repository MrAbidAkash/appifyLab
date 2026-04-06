/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Reply from "@/lib/models/Reply";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import User from "@/lib/models/User";
import mongoose from "mongoose";

void User;

// Authentication middleware
const authenticateUser = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return decoded.id;
  } catch {
    throw new Error("Invalid token");
  }
};

function shortTime(date: Date) {
  const long = dayjs(date).fromNow(true);
  const short = long
    .replace(/a few seconds?/, "5s")
    .replace(/\ban? /, "1")
    .replace("seconds", "s")
    .replace("second", "s")
    .replace("minutes", "m")
    .replace("minute", "m")
    .replace("hours", "h")
    .replace("hour", "h")
    .replace("days", "d")
    .replace("day", "d")
    .replace("months", "mo")
    .replace("month", "mo")
    .replace("years", "y")
    .replace("year", "y");

  return short.replace(/\s+/g, "");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();

    // Authentication
    const userId = await authenticateUser();

    const { id: commentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 },
      );
    }

    // Pagination for replies
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "1"); // Show 1 reply initially for lazy loading
    const skip = (page - 1) * limit;

    // Optimized aggregation for replies with pagination
    const repliesResult = await Reply.aggregate([
      // Match replies for this comment
      {
        $match: {
          comment: new mongoose.Types.ObjectId(commentId),
        },
      },

      // Lookup author details
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$author" },

      // Add user reaction and counts
      {
        $addFields: {
          totalReactions: { $size: { $ifNull: ["$reactions", []] } },
          userReaction: {
            $let: {
              vars: {
                reaction: {
                  $filter: {
                    input: "$reactions",
                    cond: {
                      $eq: [
                        "$$this.userId",
                        new mongoose.Types.ObjectId(userId),
                      ],
                    },
                  },
                },
              },
              in: {
                $cond: [
                  { $gt: [{ $size: "$$reaction" }, 0] },
                  { $arrayElemAt: ["$$reaction.type", 0] },
                  "",
                ],
              },
            },
          },
        },
      },

      // Get total count for pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                author: 1,
                reactions: 1,
                totalReactions: 1,
                userReaction: 1,
              },
            },
          ],
        },
      },
    ]);

    const result = repliesResult[0];
    const replies = result?.data || [];
    const total = result?.metadata?.[0]?.total || 0;

    // Add relative time formatting like comments API
    const repliesWithTime = replies.map((reply: any) => ({
      ...reply,
      createdAt: shortTime(reply.createdAt),
    }));

    return NextResponse.json({
      success: true,
      replies: repliesWithTime,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error in GET replies:", error);

    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
