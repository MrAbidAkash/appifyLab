import { deleteImageFromCloudinary } from "./cloudinary";

// Delete image from Cloudinary when post is deleted
export const deletePostImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;

  try {
    // Extract public ID from Cloudinary URL
    // Cloudinary URLs format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.webp
    const urlParts = imageUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // Remove file extension

    // Include folder in public ID
    const folderIndex = urlParts.indexOf("upload") + 1;
    const folderPath = urlParts.slice(folderIndex, -1).join("/");
    const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;

    await deleteImageFromCloudinary(fullPublicId);
    console.log(`Successfully deleted image: ${fullPublicId}`);
  } catch (error) {
    console.error("Error deleting post image:", error);
    // Don't throw error here to prevent blocking post deletion
    // Just log the error for monitoring
  }
};
