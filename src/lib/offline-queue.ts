import { toast } from "sonner";

export interface QueuedMutation {
  id: string;
  mutation: string;
  args: any[];
  timestamp: number;
}

const QUEUE_KEY = "ab_offline_queue";

/**
 * Get the current offline mutation queue from localStorage.
 */
function getQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save the queue to localStorage.
 */
function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Add a mutation to the offline queue.
 */
export function enqueue(mutation: string, args: any[]): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const queue = getQueue();
  queue.push({ id, mutation, args, timestamp: Date.now() });
  saveQueue(queue);
  return id;
}

/**
 * Get the number of pending items in the queue.
 */
export function queueSize(): number {
  return getQueue().length;
}

/**
 * Check if currently offline.
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

// Registry of mutation handlers that can be replayed
const mutationHandlers = new Map<string, (...args: any[]) => Promise<any>>();

/**
 * Register a mutation handler that can be replayed when coming back online.
 */
export function registerMutationHandler(name: string, handler: (...args: any[]) => Promise<any>): void {
  mutationHandlers.set(name, handler);
}

/**
 * Replay all queued mutations in order.
 * Returns the number of successfully replayed mutations.
 */
export async function replayQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let successCount = 0;
  const failedItems: QueuedMutation[] = [];

  for (const item of queue) {
    const handler = mutationHandlers.get(item.mutation);
    if (!handler) {
      console.warn(`No handler registered for mutation: ${item.mutation}`);
      failedItems.push(item);
      continue;
    }

    try {
      await handler(...item.args);
      successCount++;
    } catch (err) {
      console.error(`Failed to replay mutation ${item.mutation}:`, err);
      failedItems.push(item);
    }
  }

  // Keep only failed items in the queue
  saveQueue(failedItems);

  if (successCount > 0) {
    toast.success(`${successCount} acao(oes) sincronizada(s)`);
  }

  if (failedItems.length > 0) {
    toast.error(`${failedItems.length} acao(oes) nao puderam ser sincronizadas`);
  }

  return successCount;
}

/**
 * Execute a mutation, or queue it if offline.
 * Use this wrapper instead of calling Supabase directly for offline-safe operations.
 */
export async function executeOrQueue(
  mutationName: string,
  handler: (...args: any[]) => Promise<any>,
  ...args: any[]
): Promise<{ queued: boolean; result?: any }> {
  // Register the handler if not already registered
  if (!mutationHandlers.has(mutationName)) {
    registerMutationHandler(mutationName, handler);
  }

  if (isOffline()) {
    enqueue(mutationName, args);
    return { queued: true };
  }

  try {
    const result = await handler(...args);
    return { queued: false, result };
  } catch (err) {
    // If the error looks like a network error, queue it
    if (err instanceof TypeError && err.message.includes("fetch")) {
      enqueue(mutationName, args);
      return { queued: true };
    }
    throw err;
  }
}

// ── Auto-sync on reconnect ──

let listenerAttached = false;

/**
 * Initialize the offline queue sync listener.
 * Call this once on app startup.
 */
export function initOfflineSync(): void {
  if (listenerAttached) return;
  listenerAttached = true;

  window.addEventListener("online", () => {
    console.log("Back online, replaying offline queue...");
    // Small delay to ensure connection is stable
    setTimeout(() => {
      replayQueue();
    }, 1500);
  });
}
