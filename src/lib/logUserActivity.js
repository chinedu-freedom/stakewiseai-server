import { client } from "./sanity.js";

export async function logUserActivity(userId, action, details = '', status = 'info', options = {}) {
  const activityData = {
    _type: 'userActivity',
    action,
    details,
    status,
    timestamp: new Date().toISOString(),
    ipAddress: options.ipAddress || null,
    userAgent: options.userAgent || null,
  };

  // Only add a user reference if userId exists
  if (userId) {
    activityData.user = {
      _type: 'reference',
      _ref: userId,
    };
  }

  await client.create(activityData);
}
