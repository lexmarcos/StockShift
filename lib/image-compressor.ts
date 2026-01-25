/**
 * Compresses an image file using Canvas API
 * Maintains original dimensions, only reduces quality
 */
export async function compressImage(
  file: File,
  quality: number = 0.7
): Promise<File> {
  // Skip compression for non-image files or already small files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip WebP files smaller than 100KB (already well compressed)
  if (file.type === "image/webp" && file.size < 100 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // Maintain original dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Convert to WebP for best compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".webp"),
            { type: "image/webp" }
          );

          // Only use compressed version if it's actually smaller
          if (compressedFile.size < file.size) {
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
    reader.readAsDataURL(file);
  });
}
