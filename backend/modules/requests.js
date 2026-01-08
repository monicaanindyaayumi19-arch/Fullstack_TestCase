const store = require("./store");
const { notify } = require("./notifications");

function registerRequestRoutes(app, authMiddleware, requireRole) {
  // List requests (ADMIN)
  app.get("/requests", authMiddleware, requireRole("ADMIN"), (req, res) => {
    const status = (req.query.status || "").toString().toUpperCase();
    let items = store.requests;
    if (status) items = items.filter(r => r.status === status);
    res.json({ total: items.length, items });
  });

  // Approve request (ADMIN)
  app.post("/requests/:id/approve", authMiddleware, requireRole("ADMIN"), (req, res) => {
    const r = store.requests.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ message: "request not found" });
    if (r.status !== "PENDING") return res.status(409).json({ message: "already decided" });

    const doc = store.documents.find(d => d.id === r.docId);
    if (!doc) return res.status(404).json({ message: "document not found" });

    // Apply "transaction-like" effect
    if (r.type === "DELETE") {
      store.documents = store.documents.filter(d => d.id !== doc.id);
    } else if (r.type === "REPLACE") {
      doc.fileUrl = r.payload?.fileUrl || doc.fileUrl;
      doc.version = (doc.version || 1) + 1;
      doc.status = "ACTIVE";
      doc.locked = false;
    }

    r.status = "APPROVED";
    r.decidedBy = req.user.sub;
    r.decidedAt = new Date().toISOString();

    notify(r.requestedBy, "Request approved", `Your ${r.type} request for docId=${r.docId} was approved.`);
    res.json({ message: "approved", request: r });
  });

  // Reject request (ADMIN)
  app.post("/requests/:id/reject", authMiddleware, requireRole("ADMIN"), (req, res) => {
    const { reason } = req.body || {};
    const r = store.requests.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ message: "request not found" });
    if (r.status !== "PENDING") return res.status(409).json({ message: "already decided" });

    const doc = store.documents.find(d => d.id === r.docId);
    if (doc) {
      doc.status = "ACTIVE";
      doc.locked = false;
    }

    r.status = "REJECTED";
    r.reason = reason ? String(reason) : "";
    r.decidedBy = req.user.sub;
    r.decidedAt = new Date().toISOString();

    notify(r.requestedBy, "Request rejected", `Your ${r.type} request was rejected. ${r.reason}`);
    res.json({ message: "rejected", request: r });
  });
}

module.exports = { registerRequestRoutes };
