export const checkExistingKyc = (kyc) => {
  if (!kyc) return null;

  switch (kyc.status) {
    case "pending":
      return "KYC already submitted and is pending review. Please wait for approval.";
    case "approved":
      return "KYC already approved. No further submissions allowed.";
    case "rejected":
      if (kyc.rejectionReasons?.length) {
        return `Previous KYC was rejected. Reasons: ${kyc.rejectionReasons.join(", ")}. Please resubmit.`;
      }
      return "Previous KYC was rejected. Please resubmit.";
    default:
      return null;
  }
};
