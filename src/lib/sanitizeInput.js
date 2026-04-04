export const sanitizeInput = (data = {}) => {
  if (typeof data === "string") {
    return data
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[<>]/g, "");
  }

  const sanitized = {};

  for (const key in data) {
    if (data[key] === undefined || data[key] === null) continue;

    let value = String(data[key])
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[<>]/g, "");

    sanitized[key] = value;
  }

  return sanitized;
};
