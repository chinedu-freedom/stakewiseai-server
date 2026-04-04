export function generateReferralCode(name) {
  const random = Math.floor(1000 + Math.random() * 9000);
  const cleanedName = name.replace(/\s+/g, "").toUpperCase().slice(0, 5); 
  return `${cleanedName}${random}`;
}
