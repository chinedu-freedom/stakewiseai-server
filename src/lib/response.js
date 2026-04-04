export const sendResponse = (res, success, message, status = 200, data = null) => {
  return res.status(status).json({
    success,
    message,
    ...(data && { data }),
  });
};
