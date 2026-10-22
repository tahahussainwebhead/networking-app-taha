const repo = require("./reports.repository");

async function activity(limit) {
  return repo.activity(limit);
}

async function topActiveUsers(limit) {
  return repo.topActiveUsers(limit);
}

async function signupsLast7Days() {
  return repo.signupsLast7Days();
}

async function engagementByDay(limit) {
  return repo.engagementByDay(limit);
}

async function fullReport() {
  const [activityRows, topUsers, signups, engagement] = await Promise.all([
    repo.activity(100),
    repo.topActiveUsers(10),
    repo.signupsLast7Days(),
    repo.engagementByDay(),
  ]);
  return {
    activity: activityRows,
    topActiveUsers: topUsers,
    signupsLast7Days: signups,
    engagementByDay: engagement,
  };
}

module.exports = { activity, topActiveUsers, signupsLast7Days, engagementByDay, fullReport };