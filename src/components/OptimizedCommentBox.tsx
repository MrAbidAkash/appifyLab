/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactionButton from "./ReactionButton";
import {
  getReactionEmoji,
  getUserReaction,
  getTotalReactions,
} from "@/lib/reactions";

interface OptimizedCommentBoxProps {
  postId: string;
  userId: string;
  initialCommentCount: number;
}

const OptimizedCommentBox = ({
  postId,
  userId,
  initialCommentCount,
}: OptimizedCommentBoxProps) => {
  const [comments, setComments] = useState<any[]>([]);
  console.log("comments", comments);
  const [loading, setLoading] = useState(false);
  const [replyContentByComment, setReplyContentByComment] = useState<{
    [key: string]: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reply pagination states
  const [repliesByComment, setRepliesByComment] = useState<{
    [key: string]: any[];
  }>({});

  console.log("repliesByComment", repliesByComment);
  const [replyPagesByComment, setReplyPagesByComment] = useState<{
    [key: string]: number;
  }>({});
  const [loadingRepliesByComment, setLoadingRepliesByComment] = useState<{
    [key: string]: boolean;
  }>({});

  // Load comments only when component is expanded or visible
  const loadComments = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/comments/${postId}/get-post-comments?page=${page}&limit=5`,
        );
        const data = await response.json();

        if (data.success) {
          const newComments = data.comments || [];
          setComments((prev) =>
            append ? [...prev, ...newComments] : newComments,
          );
          setHasMore(data.pagination?.page < data.pagination?.pages);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    },
    [postId, loading],
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loadMoreRef.current && hasMore && !loading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadComments(currentPage + 1, true);
          }
        },
        { threshold: 0.1 },
      );

      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentPage, hasMore, loading, postId, loadComments]);

  // Load initial comments when expanded
  const handleExpand = () => {
    if (!isExpanded && comments.length === 0) {
      loadComments();
    }
    setIsExpanded(!isExpanded);
  };

  // Load replies for a specific comment with pagination (only 1 initially)
  const loadReplies = useCallback(
    async (commentId: string, page: number = 1, append: boolean = false) => {
      if (loadingRepliesByComment[commentId]) return;

      setLoadingRepliesByComment((prev) => ({ ...prev, [commentId]: true }));
      try {
        const response = await fetch(
          `/api/replies/${commentId}/get-comment-replies?page=${page}&limit=1`,
        );
        const data = await response.json();

        if (data.success) {
          const newReplies = data.replies || [];
          console.log("Replies API response:", data);
          console.log("New replies loaded:", newReplies);
          console.log("Append mode:", append);
          console.log(
            "Current replies for comment:",
            repliesByComment[commentId],
          );

          setRepliesByComment((prev) => {
            const updated = {
              ...prev,
              [commentId]: append
                ? [...(prev[commentId] || []), ...newReplies]
                : newReplies,
            };
            console.log("Updated replies state:", updated[commentId]);
            return updated;
          });
          setReplyPagesByComment((prev) => ({
            ...prev,
            [commentId]: page,
          }));
        }
      } catch (error) {
        console.error("Error fetching replies:", error);
      } finally {
        setLoadingRepliesByComment((prev) => ({ ...prev, [commentId]: false }));
      }
    },
    [loadingRepliesByComment, repliesByComment],
  );

  // Load first reply for a comment when it's first viewed
  const loadFirstReply = useCallback(
    async (commentId: string) => {
      if (!repliesByComment[commentId]) {
        await loadReplies(commentId, 1, false);
      }
    },
    [repliesByComment, loadReplies],
  );

  // Handle reply reaction updates
  const handleReplyReaction = useCallback(
    (replyId: string, newReaction: string | null) => {
      // Update the reply in state (ReactionButton already handled API call)
      setRepliesByComment((prevReplies) => {
        const updatedReplies = { ...prevReplies };

        // Find the comment that contains this reply
        Object.keys(updatedReplies).forEach((commentId) => {
          const replies = updatedReplies[commentId] || [];
          const replyIndex = replies.findIndex((r: any) => r._id === replyId);

          if (replyIndex !== -1) {
            updatedReplies[commentId] = replies.map((r: any) => {
              if (r._id === replyId) {
                // Clear all reactions for this user and set the new one
                const filteredReactions =
                  r.reactions?.filter(
                    (reaction: any) => reaction.userId !== userId,
                  ) || [];
                const updatedReactions = newReaction
                  ? [...filteredReactions, { userId, type: newReaction }]
                  : filteredReactions;

                return {
                  ...r,
                  reactions: updatedReactions,
                  userReaction: newReaction || "",
                };
              }
              return r;
            });
          }
        });

        return updatedReplies;
      });
    },
    [userId],
  );

  // Handle comment reaction updates (called by ReactionButton after API call)
  const handleCommentReaction = useCallback(
    (commentId: string, newReaction: string | null) => {
      // Update the comment in state (ReactionButton already handled API call)
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment._id === commentId) {
            // Clear all reactions for this user and set the new one
            const filteredReactions =
              comment.reactions?.filter(
                (reaction: any) => reaction.userId !== userId,
              ) || [];
            const updatedReactions = newReaction
              ? [...filteredReactions, { userId, type: newReaction }]
              : filteredReactions;

            return {
              ...comment,
              reactions: updatedReactions,
              userReaction: newReaction || "",
            };
          }
          return comment;
        }),
      );
    },
    [userId],
  );

  // Handle reply textarea change for each comment by comment._id
  const handleReplyChange = (commentId: string, value: string) => {
    setReplyContentByComment((prev) => ({ ...prev, [commentId]: value }));
  };

  // Submit reply for a specific comment
  const submitReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();

    const content = replyContentByComment[commentId]?.trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, author: userId, content }),
      });

      if (res.ok) {
        setReplyContentByComment((prev) => ({ ...prev, [commentId]: "" }));

        // Optimistically update the comments state
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  totalReplies: (comment.totalReplies || 0) + 1,
                  replies: [
                    ...(repliesByComment[commentId] || comment.replies || []),
                    {
                      _id: Date.now().toString(),
                      content,
                      author: { firstName: "You", lastName: "" },
                      createdAt: "now",
                      reactions: [],
                    },
                  ],
                }
              : comment,
          ),
        );

        // Also update replies state
        setRepliesByComment((prev) => ({
          ...prev,
          [commentId]: [
            ...(prev[commentId] || []),
            {
              _id: Date.now().toString(),
              content,
              author: { firstName: "You", lastName: "" },
              createdAt: "now",
              reactions: [],
            },
          ],
        }));
      } else {
        console.error("Failed to post reply");
      }
    } catch (err) {
      console.error("Error posting reply", err);
    }
  };

  // Render a single comment block including replies and reply form
  const renderComment = (comment: any) => (
    <div key={comment._id} className="mb-5">
      <div className="_comment_main">
        <div className="_comment_image">
          <a className="_comment_image_link">
            <img
              src="assets/images/txt_img.png"
              alt=""
              className="_comment_img1"
            />
          </a>
        </div>

        <div className="_comment_area">
          <div className="_comment_details">
            <div className="_comment_details_top">
              <div className="_comment_name">
                <a>
                  <h4 className="_comment_name_title">
                    {comment.author.firstName} {comment.author.lastName}
                  </h4>
                </a>
              </div>
            </div>

            <div className="_comment_status">
              <p className="_comment_status_text">
                <span>{comment.content}</span>
              </p>
            </div>

            <div className="_total_reactions">
              <div className="_total_react">
                <span className="_reaction_like">
                  {comment.userReaction &&
                    getReactionEmoji(comment.userReaction)}
                </span>
                {/* <span className="_reaction_heart">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-heart"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span> */}
              </div>
              <span className="_total">{comment.totalReactions || 0}</span>
            </div>

            <div className="_comment_reply">
              <div className="_comment_reply_num">
                <ul className="_comment_reply_list">
                  <li>
                    <ReactionButton
                      postId={comment._id}
                      userId={userId}
                      userReaction={comment.userReaction}
                      type="comment"
                      handleClick={(newReaction) =>
                        handleCommentReaction(comment._id, newReaction)
                      }
                    />
                  </li>
                  <li>
                    <span>Reply.</span>
                  </li>
                  <li>
                    <span>Share</span>
                  </li>
                  <li>
                    <span className="_time_link">.{comment.createdAt}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Replies */}
          {comment.totalReplies > 0 && (
            <div className="_comment_replies">
              {/* Load first reply when comment is clicked */}
              {!repliesByComment[comment._id] && comment.totalReplies > 0 && (
                <div style={{ marginLeft: "20px", marginTop: "10px" }}>
                  <button
                    onClick={() => {
                      console.log(
                        "View 1 reply clicked for comment:",
                        comment._id,
                      );
                      loadFirstReply(comment._id);
                    }}
                    className="_previous_comment_txt"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1890FF",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    View {comment.totalReplies} repl
                    {comment.totalReplies === 1 ? "y" : "ies"}
                  </button>
                </div>
              )}

              {/* Show loaded replies */}
              {(repliesByComment[comment._id] || []).map((reply: any) => (
                <div
                  key={reply._id}
                  className=" items-center"
                  style={{
                    marginLeft: "20px",
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "start",
                  }}
                >
                  <div className="_comment_image">
                    <a className="_comment_image_link">
                      <img
                        src="assets/images/txt_img.png"
                        alt=""
                        className="_comment_img1"
                      />
                    </a>
                  </div>

                  <div className="_comment_area">
                    <div className="_comment_details">
                      <div className="_comment_details_top">
                        <div className="_comment_name">
                          <a>
                            <h4 className="_comment_name_title">
                              {reply.author.firstName} {reply.author.lastName}
                            </h4>
                          </a>
                        </div>
                      </div>

                      <div className="_comment_status">
                        <p className="_comment_status_text">
                          <span>{reply.content}</span>
                        </p>
                      </div>

                      {/* Reply actions: Love Reply Share */}
                      <div className="_comment_reply relative">
                        <div className="_comment_reply_num">
                          <ul className="_comment_reply_list">
                            <li
                              className=""
                              style={{
                                // width: "5rem",
                                maxWidth: "5.5rem",
                                minHeight: "1.2rem",
                              }}
                            >
                              <span
                              // style={{
                              //   marginTop: "-5rem",
                              // }}
                              >
                                <ReactionButton
                                  postId={reply._id}
                                  userId={userId}
                                  userReaction={getUserReaction(
                                    reply.reactions,
                                    userId,
                                  )}
                                  type="reply"
                                  handleClick={(newReaction) =>
                                    handleReplyReaction(reply._id, newReaction)
                                  }
                                />
                              </span>
                            </li>
                            <li>
                              <span>Reply</span>
                            </li>
                            <li>
                              <span>Share</span>
                            </li>
                            <li>
                              <span className="_time_link">
                                . {reply?.createdAt || ""}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Reply total reactions on the right */}
                      <div
                        className="_total_reactions"
                        style={{ marginTop: "5px" }}
                      >
                        <div className="_total_react">
                          <span className="_reaction_like">
                            {getUserReaction(reply.reactions, userId) &&
                              getReactionEmoji(
                                getUserReaction(reply.reactions, userId),
                              )}
                          </span>
                          {/* <span className="_reaction_heart">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="feather feather-heart"
                              >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </span> */}
                        </div>
                        <span className="_total">
                          {getTotalReactions(reply.reactions)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more replies button */}
              {repliesByComment[comment._id] &&
                comment.totalReplies >
                  (repliesByComment[comment._id]?.length || 0) && (
                  <div style={{ marginLeft: "20px", marginTop: "10px" }}>
                    <button
                      onClick={() => {
                        const nextPage =
                          (replyPagesByComment[comment._id] || 1) + 1;
                        console.log(
                          "Load more replies clicked for comment:",
                          comment._id,
                          "page:",
                          nextPage,
                        );
                        loadReplies(comment._id, nextPage, true);
                      }}
                      disabled={loadingRepliesByComment[comment._id]}
                      className="_previous_comment_txt"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#1890FF",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {loadingRepliesByComment[comment._id]
                        ? "Loading replies..."
                        : `Load 1 more reply (${comment.totalReplies - (repliesByComment[comment._id]?.length || 0)} remaining)`}
                    </button>
                  </div>
                )}
            </div>
          )}

          <div className="_feed_inner_comment_box">
            <form
              className="_feed_inner_comment_box_form"
              onSubmit={(e) => submitReply(e, comment._id)}
            >
              <div className="_feed_inner_comment_box_content">
                <div className="_feed_inner_comment_box_content_image">
                  <img
                    src="assets/images/comment_img.png"
                    alt=""
                    className="_comment_img"
                  />
                </div>
                <div className="_feed_inner_comment_box_content_txt">
                  <textarea
                    className="form-control _comment_textarea"
                    placeholder="Write a reply"
                    id="floatingTextarea2"
                    value={replyContentByComment[comment._id] || ""}
                    onChange={(e) =>
                      handleReplyChange(comment._id, e.target.value)
                    }
                  ></textarea>
                </div>
              </div>
              <div className="_feed_inner_comment_box_icon">
                <button
                  type="submit"
                  className="_feed_inner_comment_box_icon_btn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill="#000"
                      fillOpacity=".46"
                      fillRule="evenodd"
                      d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button className="_feed_inner_comment_box_icon_btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill="#000"
                      fillOpacity=".46"
                      fillRule="evenodd"
                      d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  className="_feed_inner_comment_box_icon_btn"
                  type="submit"
                >
                  ➤
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="_comment_section">
      {/* Comment input at the top */}
      {/* <div className="_feed_comment_box">
        <form
          className="_feed_comment_box_form"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="_feed_comment_box_content">
            <div className="_feed_comment_box_content_image">
              <img
                src="assets/images/comment_img.png"
                alt=""
                className="_comment_img"
              />
            </div>
            <div className="_feed_comment_box_content_txt">
              <textarea
                className="form-control _comment_textarea"
                placeholder="Write a comment"
                id="floatingTextarea"
              ></textarea>
            </div>
          </div>
          <div className="_feed_comment_box_icon">
            <button className="_feed_comment_box_icon_btn" type="button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 16 16"
              >
                <path
                  fill="#000"
                  fillOpacity=".46"
                  fillRule="evenodd"
                  d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="_feed_comment_box_icon_btn" type="button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 16 16"
              >
                <path
                  fill="#000"
                  fillOpacity=".46"
                  fillRule="evenodd"
                  d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="_feed_comment_box_icon_btn" type="submit">
              ➤
            </button>
          </div>
        </form>
      </div> */}

      {/* View previous comments button */}
      {initialCommentCount > 0 && (
        <div className="_previous_comment">
          <button
            type="button"
            className="_previous_comment_txt"
            onClick={handleExpand}
          >
            {isExpanded
              ? "Hide"
              : `View ${initialCommentCount} previous comments`}
          </button>
        </div>
      )}

      {/* Comments section - only rendered when expanded */}
      {isExpanded && (
        <div className="_comments_container">
          {loading && comments.length === 0 ? (
            <div>Loading comments...</div>
          ) : (
            <>
              {comments.map((comment) => renderComment(comment))}

              {/* Load more trigger for infinite scroll */}
              {hasMore && (
                <div ref={loadMoreRef} className="_load_more_trigger">
                  {loading ? "Loading more comments..." : ""}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedCommentBox;
