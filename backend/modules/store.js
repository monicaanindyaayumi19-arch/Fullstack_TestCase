// Simple in-memory store (replace later with DB)
const store = {
  users: [],
  documents: [],     // { id,title,description,documentType,fileUrl,version,status,locked,createdBy,createdAt }
  requests: [],      // { id, docId, type, requestedBy, status, createdAt, decidedBy, decidedAt, reason, payload }
  notifications: []  // { id, userId, title, message, isRead, createdAt }
};

module.exports = store;
