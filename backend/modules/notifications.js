const store = require("./store");

function notify(userId, title, message) {
  store.notifications.push({
    id: String(Date.now() + Math.random()),
    userId,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  });
}

function notifyAdmins(title, message) {
  const admins = (store.users || []).filter(u => u.role === "ADMIN");
  admins.forEach(a => notify(a.id, title, message));
}

module.exports = { notify, notifyAdmins };
