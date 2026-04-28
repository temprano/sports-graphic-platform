// tests/helpers/mock-appwrite.js
// Mock Appwrite SDK for unit tests — no real network calls

export function createMockAppwrite() {
  const store = new Map();

  return {
    databases: {
      getDocument: async (databaseId, collectionId, documentId) => {
        const key = `${collectionId}:${documentId}`;
        const doc = store.get(key);
        if (!doc) throw new Error(`Document not found: ${key}`);
        return doc;
      },
      createDocument: async (databaseId, collectionId, documentId, data) => {
        const key = `${collectionId}:${documentId}`;
        const doc = { $id: documentId, ...data };
        store.set(key, doc);
        return doc;
      },
      updateDocument: async (databaseId, collectionId, documentId, data) => {
        const key = `${collectionId}:${documentId}`;
        const existing = store.get(key) || {};
        const updated = { ...existing, ...data };
        store.set(key, updated);
        return updated;
      }
    },
    storage: {
      getFileView: async (bucketId, fileId) => {
        return `https://mock-appwrite.test/storage/${bucketId}/${fileId}?token=mock`;
      }
    },
    _store: store,
    _reset: () => store.clear()
  };
}
