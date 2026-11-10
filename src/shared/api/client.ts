// Thin wrapper around fetch for /api/*. Errors carry the server's code (e.g. "signed_out") and
// HTTP status so callers can react to specific cases.

export class ApiError extends Error {
  code: string | undefined;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Options = { method?: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal };

// Called with every signed-out error, so the session can drop back to the login page.
let onSignedOut: (() => void) | null = null;
export function setSignedOutHandler(handler: (() => void) | null) {
  onSignedOut = handler;
}

export async function api<T = unknown>(path: string, { method = 'GET', body, signal }: Options = {}): Promise<T> {
  const init: RequestInit = { method, credentials: 'same-origin', headers: {}, signal };
  if (method !== 'GET') {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body ?? {});
  }
  const res = await fetch(`/api/${path}`, init);
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // Empty or non-JSON body: handled by the status check below.
  }
  if (!res.ok) {
    const err = new ApiError(String(data.message || 'Something went wrong. Try again.'), res.status, data.error as string | undefined);
    if (err.code === 'signed_out') onSignedOut?.();
    throw err;
  }
  return data as T;
}

export const post = <T = unknown>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
