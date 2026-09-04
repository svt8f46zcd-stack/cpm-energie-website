import type { BillAnalysisResult } from "@/lib/bill-analysis-v3";

const DB_NAME = "cpm-bill-session";
const STORE_NAME = "files";
const DB_VERSION = 1;
const META_KEY = "cpm-bill-session-meta";

export type BillSessionMeta = {
  analysis: BillAnalysisResult | null;
  fileNames: string[];
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("INDEXED_DB_OPEN_FAILED"));
  });
}

export async function saveBillSession(files: File[], analysis: BillAnalysisResult | null) {
  if (typeof window === "undefined" || !window.indexedDB) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    files.forEach((file, index) => store.put(file, String(index)));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("INDEXED_DB_WRITE_FAILED"));
  });
  const meta: BillSessionMeta = { analysis, fileNames: files.map(file => file.name), updatedAt: Date.now() };
  localStorage.setItem(META_KEY, JSON.stringify(meta));
  db.close();
}

export async function getBillSession(): Promise<{ files: File[]; meta: BillSessionMeta | null }> {
  if (typeof window === "undefined" || !window.indexedDB) return { files: [], meta: null };
  const raw = localStorage.getItem(META_KEY);
  const meta = raw ? JSON.parse(raw) as BillSessionMeta : null;
  const db = await openDb();
  const files = await new Promise<File[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as File[]).filter(Boolean));
    request.onerror = () => reject(request.error || new Error("INDEXED_DB_READ_FAILED"));
  });
  db.close();
  return { files, meta };
}

export async function clearBillSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(META_KEY);
  if (!window.indexedDB) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("INDEXED_DB_CLEAR_FAILED"));
  });
  db.close();
}

export const BILL_SESSION_META_KEY = META_KEY;
