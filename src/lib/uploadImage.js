import { client } from "./sanity.js";

export async function uploadImage(file, options = {}) {
  if (!file) {
    throw new Error("No file provided");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only images (jpeg, png or webp) are allowed.");
  }

  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File too large. Max 5MB allowed.");
  }

  const uploadedAsset = await client.assets.upload(
  "image",
  file.buffer,
  {
    filename: file.originalname || "proof-of-payment",
    contentType: file.mimetype,
  }
);

return {
  _type: "image",
  asset: {
    _type: "reference",
    _ref: uploadedAsset._id,
  },
};

}
