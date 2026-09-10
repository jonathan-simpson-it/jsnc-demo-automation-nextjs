const STORAGE_KEY = "jsco.deepseekApiKey";

// BYOK exists only as an explicit development mechanism for the pre-SaaS demo.
// In normal (SaaS) mode provider keys are server-side and this is disabled.
export const byokDevEnabled = process.env.NEXT_PUBLIC_BYOK_DEV === "1";

type Listener = (key: string) => void;
const listeners = new Set<Listener>();

function readStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getApiKey(): string {
  return readStorage();
}

function emit(key: string): void {
  listeners.forEach((cb) => cb(key));
}

export function saveApiKey(key: string): void {
  const trimmed = key.trim();
  try {
    if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: keep in-memory state only */
  }
  emit(trimmed);
}

export function clearApiKey(): void {
  saveApiKey("");
}

export function subscribeApiKey(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Header map sent with every backend request that may call the LLM. */
export function apiHeaders(): Record<string, string> {
  if (!byokDevEnabled) return {};
  const key = getApiKey();
  return key ? { "X-API-Key": key } : {};
}
