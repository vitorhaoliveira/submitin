/**
 * Documento montado por visitante (sem conta): o .docx fica no IndexedDB do
 * navegador até a pessoa criar a conta; aí é criado de verdade. Nada vai para o
 * servidor antes do cadastro (além da análise, que não salva o arquivo).
 */
const DB = "submitin";
const STORE = "guest-document";
const KEY = "current";
const MAX_AGE_MS = 24 * 60 * 60_000;

export type GuestDocument = { file: File; name: string; savedAt: number; modelo?: string | null };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGuestDocument(file: File, name: string, modelo?: string | null): Promise<void> {
  await run("readwrite", (s) => s.put({ file, name, modelo, savedAt: Date.now() } satisfies GuestDocument, KEY));
}

export async function loadGuestDocument(): Promise<GuestDocument | null> {
  try {
    const doc = await run<GuestDocument | undefined>("readonly", (s) => s.get(KEY));
    if (!doc || Date.now() - doc.savedAt > MAX_AGE_MS) return null;
    return doc;
  } catch {
    return null;
  }
}

export async function clearGuestDocument(): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(KEY));
  } catch {
    // sem IndexedDB (aba privada etc.): nada a limpar
  }
}
