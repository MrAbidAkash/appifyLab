/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { getReactionEmoji } from "@/lib/reactions";

const ReactionPopupExample = ({ post }: { post: any }) => {
  const [showPopup, setShowPopup] = useState(false);

  console.log("post111", post);
  console.log("reactedUsers:", post?.reactedUsers);
  console.log("totalReactions:", post?.totalReactions);

  // Handler to toggle popup visibility
  const togglePopup = () => setShowPopup((prev) => !prev);

  return (
    <div className="post-reactions-container" style={{ position: "relative" }}>
      {/* Reaction icon + count, clickable */}
      <div
        onClick={togglePopup}
        style={{ background: "none", border: "none", cursor: "pointer" }}
        aria-label="Show users who reacted"
        className="min-w-20 "
      >
        <div
          className="flex items-center"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "-5px",
          }}
        >
          {post?.totalReactions > 0 && (
            <img
              src="assets/images/react_img1.png"
              alt="Reactions"
              className="_react_img1"
            />
          )}
          {post?.totalReactions - 1 > 0 && (
            <span
              className="_feed_inner_timeline_total_reacts_para"
              style={{ marginLeft: "-10px" }}
            >
              {post.totalReactions - 1}+
            </span>
          )}
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div
          className="reaction-popup"
          style={{
            position: "absolute",
            top: "30px",
            left: 0,
            zIndex: 100,
            backgroundColor: "white",
            border: "1px solid #ccc",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            padding: "10px",
            borderRadius: "6px",
            minWidth: "220px",
            maxHeight: "250px",
            overflowY: "auto",
          }}
        >
          <h4 style={{ marginBottom: "8px" }}>Users who reacted</h4>
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {console.log("Rendering reactedUsers:", post?.reactedUsers)}
            {post?.reactedUsers &&
            Array.isArray(post.reactedUsers) &&
            post.reactedUsers.length > 0 ? (
              post.reactedUsers.map(({ user, type }: any, index: number) =>
                user ? (
                  <li key={user._id || index} style={{ marginBottom: "6px" }}>
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>{" "}
                    —{" "}
                    <span style={{ fontSize: "18px" }}>
                      {getReactionEmoji(type)}
                    </span>
                  </li>
                ) : (
                  <li
                    key={`no-user-${index}`}
                    style={{ marginBottom: "6px", color: "#666" }}
                  >
                    <em>Anonymous user</em> —{" "}
                    <span style={{ fontSize: "18px" }}>
                      {getReactionEmoji(type)}
                    </span>
                  </li>
                ),
              )
            ) : (
              <li>No reactions yet.</li>
            )}
          </ul>
          <button
            onClick={togglePopup}
            style={{
              marginTop: "8px",
              backgroundColor: "#eee",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ReactionPopupExample;
