"use client";

import { useState } from "react";

const REACTIONS = [
  { type: "like", label: "Like", emoji: "👍" },
  { type: "love", label: "Love", emoji: "❤️" },
  { type: "haha", label: "Haha", emoji: "😂" },
  { type: "wow", label: "Wow", emoji: "😮" },
  { type: "sad", label: "Sad", emoji: "😢" },
  { type: "angry", label: "Angry", emoji: "😡" },
];

interface ReactionButtonProps {
  postId: string;
  userId: string;
  userReaction: string; // Can be empty string if no reaction
  handleClick?: (reaction: string | null) => void;
  type?: string;
}

export default function ReactionButton({
  postId,
  userId,
  userReaction,
  handleClick,
  type = "post",
}: ReactionButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [current, setCurrent] = useState(userReaction);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  const sendReaction = async (reaction: string | null) => {
    // reaction === null means remove reaction
    const res = await fetch(
      `/api/${type === "post" ? "posts" : type === "comment" ? "comments" : "replies"}/${postId}/reaction`,
      {
        method: "POST",
        body: JSON.stringify({ userId, reaction }),
      },
    );

    const data = await res.json();
    if (data.success) {
      setCurrent(reaction ?? "");
    }
    if (!handleClick) return;

    handleClick(reaction);
    // Close menu after selecting a reaction
    setShowMenu(false);
  };

  const currentReaction = REACTIONS.find((r) => r.type === current);

  // Handle main button click
  const handleMainButtonClick = () => {
    if (current) {
      // User clicked the button with existing reaction, remove it
      sendReaction(null);
    } else {
      // No reaction yet, just show the menu to choose
      setShowMenu(true);
    }
  };

  // Handle mouse enter with delay (Facebook behavior)
  const handleMouseEnter = () => {
    setIsHovering(true);
    // Clear any existing timer
    if (hoverTimer) clearTimeout(hoverTimer);
    // Show menu after 500ms delay (Facebook-like behavior)
    const timer = setTimeout(() => {
      setShowMenu(true);
    }, 100);
    setHoverTimer(timer);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Clear the hover timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    // Hide menu immediately when leaving
    setShowMenu(false);
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* === POPUP MENU === */}
      {showMenu && (
        <div
          style={{
            minWidth: "160px",
          }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                     bg-white rounded-full shadow-lg border border-gray-200 px-3 py-2 z-9999
                     animate-in fade-in slide-in-from-bottom-1 duration-150"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <div className="flex items-center gap-1 ">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => sendReaction(r.type)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  transition-all duration-150 ease-in-out
                  hover:bg-gray-100 hover:scale-125 active:scale-95
                  ${current === r.type ? "bg-blue-50" : ""}
                `}
                type="button"
                title={r.label}
              >
                <span className="text-lg">{r.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* === MAIN BUTTON === */}
      <span
        className={`
          inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 ease-in-out
          ${
            current
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 bordr border-blue-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 borde border-gray-300"
          }
          ${isHovering && !current ? "ring-2 ring-gray-300" : ""}
        `}
        onClick={handleMainButtonClick}
        // type="button"
      >
        {/* Emoji */}
        <span className="text-base">
          {currentReaction ? currentReaction.emoji : ""}
        </span>
        {/* Label */}
        <span>{currentReaction ? currentReaction.label : "React"}</span>
      </span>
    </div>
  );
}
