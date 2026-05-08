// Removed Lucky Spin functionality
export const handleSpin = (req, res) => {
  res.status(410).json({ message: "Lucky Spin has been removed." });
};
