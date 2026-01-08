const store = require("./store");
const { notifyAdmins } = require("./notifications");

function registerDocumentRoutes(app, authMiddleware) {
  // Upload/create (metadata)
  app.post("/documents", authMiddleware, (req, res) => {
    const { title, description, documentType, fileUrl } = req.body || {};
    if (!title) return res.status(400).json({ message: "title is required" });

    const doc = {
      id: String(Date.now()),
      title: String(title),
      description: description ? String(description) : "",
      documentType: documentType ? String(documentType) : "GENERAL",
      fileUrl: fileUrl ? String(fileUrl) : "placeholder",
      version: 1,
      status: "ACTIVE",
      locked: false,
      createdBy: req.user.sub,
      createdAt: new Date().toISOString()
    };

    store.documents.push(doc);
    res.json(doc);
  });

  // List + pagination + search
  app.get("/documents", authMiddleware, (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const q = (req.query.q || "").toString().toLowerCase();

    let result = store.documents;
    if (q) {
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q)
      );
    }

    const total = result.length;
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);

    res.json({ page, limit, total, items });
  });

  // Detail
  app.get("/documents/:id", authMiddleware, (req, res) => {
    const doc = store.documents.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  });

  // Request delete (pending approval)
  app.delete("/documents/:id", authMiddleware, (req, res) => {
    const doc = store.documents.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "not found" });
    if (doc.locked) return res.status(409).json({ message: "document locked (pending approval)" });

    doc.status = "PENDING_DELETE";
    doc.locked = true;

    const request = {
      id: String(Date.now() + Math.random()),
      docId: doc.id,
      type: "DELETE",
      requestedBy: req.user.sub,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    store.requests.push(request);
    notifyAdmins("Permission request", `DELETE request for "${doc.title}" (docId=${doc.id})`);

    res.json({ message: "delete request submitted", request, doc });
  });

  // Request replace (pending approval)
  app.put("/documents/:id/replace", authMiddleware, (req, res) => {
    const doc = store.documents.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "not found" });
    if (doc.locked) return res.status(409).json({ message: "document locked (pending approval)" });

    const { fileUrl } = req.body || {};
    if (!fileUrl) return res.status(400).json({ message: "fileUrl is required" });

    doc.status = "PENDING_REPLACE";
    doc.locked = true;

    const request = {
      id: String(Date.now() + Math.random()),
      docId: doc.id,
      type: "REPLACE",
      requestedBy: req.user.sub,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      payload: { fileUrl: String(fileUrl) }
    };

    store.requests.push(request);
    notifyAdmins("Permission request", `REPLACE request for "${doc.title}" (docId=${doc.id})`);

    res.json({ message: "replace request submitted", request, doc });
  });
}

module.exports = { registerDocumentRoutes };
