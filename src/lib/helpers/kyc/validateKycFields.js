import { VALID_ID_TYPES, 
    VALID_MARITAL_STATUSES,
 } from "../../../constants/kyc.constants.js";

export const validateKycFields = ({
  fullName,
  email,
  address,
  maritalStatus,
  dob,
  idType,
  idNumber,
  idFront,
  idBack,
}) => {
  if (!fullName) return "Full name is required";

  if (!email) return "Email is required";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Invalid email format";

  if (!address) return "Address is required";

  if (!maritalStatus) return "Marital status is required";
  if (!VALID_MARITAL_STATUSES.includes(maritalStatus)) {
    return `Invalid marital status selected. Allowed values: ${VALID_MARITAL_STATUSES.join(", ")}`;
  }

  if (!dob) return "Date of birth is required";

  if (!idType) return "ID type is required";
  if (!VALID_ID_TYPES.includes(idType)) {
    return `Invalid ID type selected. Allowed values: ${VALID_ID_TYPES.join(", ")}`;
  }

  if (!idNumber) return "Identification number is required";
  if (!/^[A-Za-z0-9-]+$/.test(idNumber)) {
    return "Invalid ID number format";
  }

  // Multer file validation
  if (!idFront) return "Front ID image is required";
  if (!idFront.buffer || !idFront.mimetype) {
    return "Invalid front ID image file";
  }

  if (idType !== "passport") {
    if (!idBack) return "Back ID image is required for this ID type";
    if (!idBack.buffer || !idBack.mimetype) {
      return "Invalid back ID image file";
    }
  }

  return null;
};
