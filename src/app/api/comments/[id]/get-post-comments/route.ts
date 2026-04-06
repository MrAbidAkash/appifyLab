/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import mongoose from "mongoose";

dayjs.extend(relativeTime);

// ✅ AUTH
const authenticateUser = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) throw new Error("Unauthorized");

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return decoded.id;
  } catch {
    throw new Error("Invalid token");
  }
};

// ✅ TIME FORMAT
function shortTime(date: Date) {
  const long = dayjs(date).fromNow(true);
  return long
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
    .replace("year", "y")
    .replace(/\s+/g, "");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const userId = await authenticateUser();
    const { id: postId } = await params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;

    const commentsResult = await Comment.aggregate([
      {
        $match: {
          post: new mongoose.Types.ObjectId(postId),
        },
      },

      // ✅ AUTHOR
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [{ $project: { _id: 1, firstName: 1, lastName: 1 } }],
        },
      },
      { $unwind: "$author" },

      // ✅ REPLIES (LIMITED)
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
            { $limit: 3 },
          ],
          as: "replies",
        },
      },

      // ✅ TRUE REPLY COUNT (FIXED)
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
            { $count: "count" },
          ],
          as: "replyCount",
        },
      },

      // ✅ ADD FIELDS
      {
        $addFields: {
          totalReactions: { $size: { $ifNull: ["$reactions", []] } },

          totalReplies: {
            $ifNull: [{ $arrayElemAt: ["$replyCount.count", 0] }, 0],
          },

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

      // ✅ PAGINATION
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
    ]);

    const result = commentsResult[0];
    const comments = result?.data || [];
    const total = result?.metadata?.[0]?.total || 0;

    const formatted = comments.map((c: any) => ({
      ...c,
      createdAt: shortTime(c.createdAt),
    }));

    return NextResponse.json({
      success: true,
      comments: formatted,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error:", error);

    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
