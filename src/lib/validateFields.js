export const validateFields = (fields, body) => {
  for (const field of fields) {
    switch (field) {
      case "email":
        if (!body.email) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
          return "Invalid email format";
        break;

      case "password":
        if (!body.password) return "Password is required";
        const trimmed = body.password.trim();
        if (!trimmed) return "Password cannot be empty";
        if (trimmed.length < 8)
          return "Password must be at least 8 characters long";

        // Strength check — at least 1 uppercase, 1 lowercase, 1 number, and 1 special char
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()[\]{}<>])[A-Za-z\d@$!%*?&#^()[\]{}<>]{8,}$/;
        if (!passwordRegex.test(trimmed))
          return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
        break;

   case "username":
  if (!body.username) return "Username is required";

  const username = body.username.trim();

  if (username.length < 3 || username.length > 20) {
    return "Username must be between 3 and 20 characters";
  }
if (/[._]{2,}/.test(username)) {
  return "Username cannot contain consecutive special characters";
}
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9._]{1,18}[a-zA-Z0-9])?$/.test(username)) {
    return "Username can only contain letters, numbers, dots, and underscores, and cannot start or end with special characters";
  }

  break;

      case "phoneNumber":
        if (!body.phoneNumber) return "Phone number is required";
        break;

      default:
        break;
    }
  }
  return null;
};
