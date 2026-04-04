import { uploadImage } from "./uploadImage";

export const handleKycImageUploads = async (idFront, idBack) => {
  const uploadedFront = await uploadImage(idFront);
  let uploadedBack = null;
  if (idBack && idBack.size > 0) {
    uploadedBack = await uploadImage(idBack);
  }
  return { uploadedFront, uploadedBack };
};
