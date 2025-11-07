export interface BackoffOptions {
  retries?: number; // max retries
  baseDelayMs?: number; // initial delay
  maxDelayMs?: number; // cap delay
  jitter?: boolean; // add random jitter
  signal?: AbortSignal | null;
}

function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const id = setTimeout(() => resolve(), ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(id);
        signal.removeEventListener('abort', onAbort);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort);
    }
  });
}

export async function exponentialBackoffRetry<T>(fn: () => Promise<T>, opts: BackoffOptions = {}): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 500,
    maxDelayMs = 4000,
    jitter = true,
    signal = null,
  } = opts;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await fn();
    } catch (e) {
      if (attempt >= retries) throw e;
      const factor = 2 ** attempt;
      let delay = Math.min(baseDelayMs * factor, maxDelayMs);
      if (jitter) delay = delay * (0.5 + Math.random() * 0.5);
      await sleep(delay, signal);
      attempt++;
    }
  }
}
