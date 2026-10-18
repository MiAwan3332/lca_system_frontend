import axios from 'axios';
import { config } from './config';

const memory = new Map();
const slotFor = (kind, token) => {
  try {
    const payload = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload));
    const actor = String(claims.user?.id || claims.user?._id || claims.sub || '');
    if (/^[a-zA-Z0-9_-]{1,100}$/.test(actor)) return `lca-creation-${kind}-${actor}`;
  } catch { /* Authentication still happens on the server; this only scopes local recovery state. */ }
  let hash = 2166136261;
  for (const char of String(token)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `lca-creation-${kind}-${hash >>> 0}`;
};
export function pendingCreationKey(kind, token) {
  const slot = slotFor(kind, token);
  try { return sessionStorage.getItem(slot) || memory.get(slot); } catch { return memory.get(slot); }
}
export function clearCreationKey(kind, token, key) {
  const slot = slotFor(kind, token);
  if (pendingCreationKey(kind, token) !== key) return;
  memory.delete(slot);
  try { sessionStorage.removeItem(slot); } catch { /* Session storage may be unavailable. */ }
}
export async function readCreation(kind, token, key, recordId, signal) {
  const group = kind === 'student' ? 'students' : 'users';
  const url = recordId ? `${group}/${recordId}/processing` : `${group}/by-key/${encodeURIComponent(key)}`;
  return (await axios.get(`${config.BASE_URL}/${url}`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 10000, signal,
  })).data;
}
export async function createWithRecovery(kind, token, body) {
  let capabilities;
  try {
    capabilities = await axios.get(`${config.BASE_URL}/operations/creation-capabilities`, {
      headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
    });
  } catch {
    throw new Error('The API is not ready for this portal version. No creation was submitted. Reload or retry after deployment finishes.');
  }
  if (capabilities.data?.protocol !== 2) throw new Error('The API deployment is not ready for this portal version. Reload after deployment finishes.');
  const slot = slotFor(kind, token);
  const key = pendingCreationKey(kind, token) || crypto.randomUUID();
  memory.set(slot, key);
  try { sessionStorage.setItem(slot, key); } catch { /* Keep the in-memory key. */ }
  const group = kind === 'student' ? 'students' : 'users';
  try {
    const response = await axios.post(`${config.BASE_URL}/${group}/add`, body, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': key, 'X-Creation-Protocol': '2' }, timeout: 45000,
    });
    if (response.data.idempotency_key && response.data.idempotency_key !== key) {
      memory.set(slot, response.data.idempotency_key);
      try { sessionStorage.setItem(slot, response.data.idempotency_key); } catch { /* Memory fallback. */ }
    }
    if (response.data.submission_status === 'complete') clearCreationKey(kind, token, response.data.idempotency_key || key);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status && (status < 500 || (status === 507 && error.response?.data?.code === 'CREATION_NOT_COMMITTED'))) {
      // Preserve an existing submission, but don't strand a brand-new key on an identity collision.
      if (status === 409) {
        try { await readCreation(kind, token, key); }
        catch (lookupError) { if (lookupError.response?.status === 404) clearCreationKey(kind, token, key); }
      } else clearCreationKey(kind, token, key);
      throw error;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const found = await readCreation(kind, token, key);
        if (found.submission_status === 'complete') {
          clearCreationKey(kind, token, key);
          return found;
        }
        if (found.submission_status === 'failed') return found;
      } catch { /* Neither a timeout nor an early 404 proves creation failed. */ }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return { idempotency_key: key, submission_status: 'unknown', processing_status: 'pending', jobs: [] };
  }
}
