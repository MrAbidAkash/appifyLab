// Utility functions for reactions

// Get reaction emoji based on type
export const getReactionEmoji = (type: string): string => {
  switch (type) {
    case "like":
      return "👍";
    case "love":
      return "❤️";
    case "haha":
      return "😂";
    case "wow":
      return "😮";
    case "sad":
      return "😢";
    case "angry":
      return "😠";
    default:
      return "👍";
  }
};

// Get user's reaction from reactions array
export const getUserReaction = (
  reactions: { userId: string; type: string }[],
  userId: string,
): string => {
  if (!reactions || !userId) return "";
  const userReaction = reactions.find((r) => r.userId === userId);
  return userReaction?.type || "";
};

// Get total reaction count
export const getTotalReactions = (
  reactions: { userId: string; type: string }[],
): number => {
  return reactions?.length || 0;
};

// Get all available reaction types with their emojis
export const getAllReactions = () => [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😠", label: "Angry" },
];
