// Removed Lucky Spin functionality
export default (req, res) => {
  res.status(410).json({ message: "Lucky Spin has been removed." });
};
