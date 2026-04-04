import { client } from "./sanity.js";

export const findUserByEmail = async (email) => {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await client.fetch(
    `*[_type == "user" && lower(email) == $email && isDeleted != true][0]`,
    { email: normalizedEmail }
  );

  return user || null;
};
