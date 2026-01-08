const store = require("./store");

function registerNotificationRoutes(app, authMiddleware) {
  // List my notifications
  app.get("/notifications", authMiddleware, (req, res) => {
    const items = store.notifications
      .filter(n => n.userId === req.user.sub)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    res.json({ total: items.length, items });
  });

  // Mark as read
  app.post("/notifications/:id/read", authMiddleware, (req, res) => {
    const n = store.notifications.find(x => x.id === req.params.id && x.userId === req.user.sub);
    if (!n) return res.status(404).json({ message: "not found" });
    n.isRead = true;
    res.json({ ok: true });
  });
}

module.exports = { registerNotificationRoutes };
