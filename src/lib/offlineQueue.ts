import { AssessmentEvaluation, EvaluateSaveRequest } from '@/lib/api';
// import { syncAssessments } from '@/lib/api';

const DB_NAME = 'fawcheck_offline_db';
const DB_VERSION = 2;
const QUEUE_STORE_NAME = 'assessment_queue_v1';
const PENDING_STORE_NAME = 'pending_result_v1';

export interface QueueItem {
  id?: number;
  request: EvaluateSaveRequest;
  provisional: AssessmentEvaluation;
  retryCount: number;
  lastError?: string;
  queuedAt: string;
}

export interface PendingAssessment {
  id: string;
  request: EvaluateSaveRequest;
  evaluation: AssessmentEvaluation;
  createdAt: string;
}

export interface SyncSummary {
  synced: number;
  failed: number;
  remaining: number;
  errors: string[];
}

function ensureBrowser(): void {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment.');
  }
}

function openDatabase(): Promise<IDBDatabase> {
  ensureBrowser();

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(PENDING_STORE_NAME)) {
        db.createObjectStore(PENDING_STORE_NAME, {
          keyPath: 'id',
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => db.close();

      operation(store, resolve, reject);
    } catch (error) {
      reject(error);
    }
  });
}

export async function enqueueAssessment(request: EvaluateSaveRequest, provisional: AssessmentEvaluation): Promise<number> {
  const queueItem: QueueItem = {
    request,
    provisional,
    retryCount: 0,
    queuedAt: new Date().toISOString(),
  };

  return withStore<number>(QUEUE_STORE_NAME, 'readwrite', (store, resolve, reject) => {
    const addRequest = store.add(queueItem);
    addRequest.onsuccess = () => resolve(Number(addRequest.result));
    addRequest.onerror = () => reject(addRequest.error);
  });
}

export async function getQueuedAssessments(): Promise<QueueItem[]> {
  return withStore<QueueItem[]>(QUEUE_STORE_NAME, 'readonly', (store, resolve, reject) => {
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = () => resolve((getAllRequest.result as QueueItem[]) ?? []);
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
}

export async function getQueuedAssessmentById(id: number): Promise<QueueItem | null> {
  return withStore<QueueItem | null>(QUEUE_STORE_NAME, 'readonly', (store, resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => resolve((getRequest.result as QueueItem | undefined) ?? null);
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function removeQueuedAssessment(id: number): Promise<void> {
  return withStore<void>(QUEUE_STORE_NAME, 'readwrite', (store, resolve, reject) => {
    const deleteRequest = store.delete(id);
    deleteRequest.onsuccess = () => resolve(undefined);
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
}

export async function countQueuedAssessments(): Promise<number> {
  return withStore<number>(QUEUE_STORE_NAME, 'readonly', (store, resolve, reject) => {
    const countRequest = store.count();
    countRequest.onsuccess = () => resolve(countRequest.result);
    countRequest.onerror = () => reject(countRequest.error);
  });
}

export async function savePendingAssessment(
  request: EvaluateSaveRequest,
  evaluation: AssessmentEvaluation,
): Promise<string> {
  const pending: PendingAssessment = {
    id: request.clientGeneratedId,
    request,
    evaluation,
    createdAt: new Date().toISOString(),
  };

  return withStore<string>(PENDING_STORE_NAME, 'readwrite', (store, resolve, reject) => {
    const putRequest = store.put(pending);
    putRequest.onsuccess = () => resolve(pending.id);
    putRequest.onerror = () => reject(putRequest.error);
  });
}

export async function getPendingAssessmentById(id: string): Promise<PendingAssessment | null> {
  return withStore<PendingAssessment | null>(PENDING_STORE_NAME, 'readonly', (store, resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => resolve((getRequest.result as PendingAssessment | undefined) ?? null);
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function removePendingAssessment(id: string): Promise<void> {
  return withStore<void>(PENDING_STORE_NAME, 'readwrite', (store, resolve, reject) => {
    const deleteRequest = store.delete(id);
    deleteRequest.onsuccess = () => resolve(undefined);
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
}

// Failed-queue retry bookkeeping is disabled with queued sync.
// async function updateFailedQueueItem(item: QueueItem, errorMessage: string): Promise<void> {
//   if (item.id === undefined) {
//     return;
//   }
//
//   const updated: QueueItem = {
//     ...item,
//     retryCount: item.retryCount + 1,
//     lastError: errorMessage,
//   };
//
//   await withStore<void>(QUEUE_STORE_NAME, 'readwrite', (store, resolve, reject) => {
//     const putRequest = store.put(updated);
//     putRequest.onsuccess = () => resolve(undefined);
//     putRequest.onerror = () => reject(putRequest.error);
//   });
// }

export async function syncQueuedAssessments(): Promise<SyncSummary> {
  // Offline queued syncing is disabled until the queue flow is fixed.
  // Previous implementation read queued records from IndexedDB, called
  // syncAssessments(), removed successful items, and marked failed retries.
  const remaining = typeof window === 'undefined' ? 0 : await countQueuedAssessments().catch(() => 0);
  return {
    synced: 0,
    failed: 0,
    remaining,
    errors: ['Offline sync is temporarily disabled.'],
  };
}
