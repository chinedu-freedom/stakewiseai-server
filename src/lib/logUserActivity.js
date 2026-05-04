import { client } from "./sanity.js";

export async function logUserActivity(userId, action, details = '', status = 'info') {
  const activityData = {
    _type: 'userActivity',
    action,
    details,
    status,
    timestamp: new Date().toISOString(),
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
