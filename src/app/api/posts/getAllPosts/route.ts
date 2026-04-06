/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import Post from "@/lib/models/Post";
import mongoose from "mongoose";

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

export const GET = async (req: Request) => {
  await connectToDatabase();

  try {
    // Authentication
    const userId = await authenticateUser();

    // Pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Optimized aggregation - single query to get posts with counts
    const postsWithCounts = await Post.aggregate([
      // Match posts based on visibility and ownership
      {
        $match: {
          $or: [
            { visibility: "public" },
            {
              visibility: "private",
              author: new mongoose.Types.ObjectId(userId),
            },
          ],
        },
      },

      // Single lookup for author details
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
                email: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$author" },

      // Lookup reaction users
      {
        $lookup: {
          from: "users",
          localField: "reactions.userId",
          foreignField: "_id",
          as: "reactedUsers",
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

      // Lookup reaction users and format reactedUsers
      {
        $addFields: {
          reactedUsers: {
            $map: {
              input: { $ifNull: ["$reactions", []] },
              as: "reaction",
              in: {
                user: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$reactedUsers",
                        cond: { $eq: ["$$this._id", "$$reaction.userId"] },
                      },
                    },
                    0,
                  ],
                },
                type: "$$reaction.type",
              },
            },
          },
        },
      },

      // Add counts using $facet for better performance
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            // Add reaction counts and user reaction
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

            // Count comments and replies using single lookup with debugging
            {
              $lookup: {
                from: "comments",
                let: { postId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$post", "$$postId"] },
                    },
                  },
                  {
                    $lookup: {
                      from: "replies",
                      localField: "replies",
                      foreignField: "_id",
                      as: "validReplies",
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      totalComments: { $sum: 1 },
                      totalReplies: {
                        $sum: { $size: { $ifNull: ["$validReplies", []] } },
                      },
                      debugComments: {
                        $push: {
                          commentId: "$_id",
                          replyCount: {
                            $size: { $ifNull: ["$validReplies", []] },
                          },
                          allReplyIds: "$replies",
                          validReplyIds: "$validReplies._id",
                        },
                      },
                    },
                  },
                ],
                as: "commentReplyCounts",
              },
            },
            {
              $addFields: {
                totalComments: {
                  $let: {
                    vars: {
                      counts: { $ifNull: ["$commentReplyCounts", []] },
                    },
                    in: {
                      $cond: [
                        { $gt: [{ $size: "$$counts" }, 0] },
                        {
                          $add: [
                            { $arrayElemAt: ["$$counts.totalComments", 0] },
                            { $arrayElemAt: ["$$counts.totalReplies", 0] },
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
                totalReplies: {
                  $let: {
                    vars: {
                      counts: { $ifNull: ["$commentReplyCounts", []] },
                    },
                    in: {
                      $cond: [
                        { $gt: [{ $size: "$$counts" }, 0] },
                        { $arrayElemAt: ["$$counts.totalReplies", 0] },
                        0,
                      ],
                    },
                  },
                },
              },
            },

            // Project final structure
            {
              $project: {
                _id: 1,
                title: 1,
                content: 1,
                image: 1,
                visibility: 1,
                createdAt: 1,
                updatedAt: 1,
                author: 1,
                totalReactions: 1,
                totalComments: 1,
                totalReplies: 1, // Add separate replies count
                userReaction: 1,
                reactedUsers: 1,
                commentReplyCounts: 1, // Debug: include raw counts
              },
            },

            // Sort and paginate
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },

      // Restructure the output
      {
        $project: {
          posts: "$data",
          pagination: {
            total: { $arrayElemAt: ["$metadata.total", 0] },
            page,
            limit,
            pages: {
              $ceil: {
                $divide: [{ $arrayElemAt: ["$metadata.total", 0] }, limit],
              },
            },
          },
        },
      },
    ]);

    const result = postsWithCounts[0];

    return NextResponse.json(
      {
        success: true,
        posts: result?.posts || [],
        pagination: result?.pagination || {
          total: 0,
          page,
          limit,
          pages: 0,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching posts:", error);

    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
