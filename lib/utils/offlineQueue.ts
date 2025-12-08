// Offline queue management for mutations
// This stores operations that need to be synced when connection is restored

export interface QueuedOperation {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private maxRetries = 3;

  private getStorageKey() {
    return 'transitland_offline_queue';
  }

  private loadQueue(): QueuedOperation[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.getStorageKey());
    return stored ? JSON.parse(stored) : [];
  }

  private saveQueue() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.queue));
  }

  constructor() {
    this.queue = this.loadQueue();
  }

  enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedOp);
    this.saveQueue();
    return queuedOp.id;
  }

  dequeue(): QueuedOperation | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() || null;
  }

  remove(id: string) {
    this.queue = this.queue.filter((op) => op.id !== id);
    this.saveQueue();
  }

  incrementRetry(id: string) {
    const op = this.queue.find((o) => o.id === id);
    if (op) {
      op.retries += 1;
      if (op.retries >= this.maxRetries) {
        this.remove(id);
        return false; // Max retries reached
      }
      this.saveQueue();
      return true; // Can retry
    }
    return false;
  }

  getAll(): QueuedOperation[] {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

