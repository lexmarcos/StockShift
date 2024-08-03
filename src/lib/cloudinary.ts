import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.BUCKET_IMG_NAME,
  api_key: process.env.BUCKET_IMG_API_KEY,
  api_secret: process.env.BUCKET_IMG_API_SECRET,
});

export const uploadToBucket = async (file: string, publicId: string) => {
  const result = await cloudinary.uploader.upload(file, {
    public_id: publicId,
  });

  return result.secure_url;
};
