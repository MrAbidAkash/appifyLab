/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import User from "@/lib/models/User";
import Reply from "@/lib/models/Reply";
import mongoose from "mongoose";

void User;
void Reply;

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

    const { id: postId } = await params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Pagination for comments
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5"); // Show fewer comments initially
    const skip = (page - 1) * limit;

    // Optimized aggregation for comments with pagination
    const commentsResult = await Comment.aggregate([
      // Match comments for this post
      {
        $match: {
          post: new mongoose.Types.ObjectId(postId),
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

      // Lookup replies with pagination
      {
        $lookup: {
          from: "replies",
          let: { commentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$comment", "$$commentId"] },
              },
            },
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
            { $sort: { createdAt: -1 } },
            // Limit replies per comment for performance
            { $limit: 3 },
          ],
          as: "replies",
        },
      },

      // Add user reaction and counts
      {
        $addFields: {
          totalReactions: { $size: { $ifNull: ["$reactions", []] } },
          totalReplies: { $size: { $ifNull: ["$replies", []] } },
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
                replies: 1,
                totalReactions: 1,
                totalReplies: 1,
                userReaction: 1,
              },
            },
          ],
        },
      },
    ]);

    const result = commentsResult[0];
    const comments = result?.data || [];
    const total = result?.metadata?.[0]?.total || 0;

    // Add relative time formatting
    const commentsWithTime = comments.map((comment: any) => ({
      ...comment,
      createdAt: shortTime(comment.createdAt),
    }));

    return NextResponse.json({
      success: true,
      comments: commentsWithTime,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error in GET comments:", error);

    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
