/**
 * Shared in-flight request counter for the global LCA loading overlay.
 * Axios calls opt out with `{ skipLoading: true }`.
 */

let pending = 0;
let showTimer = null;
let hideTimer = null;
let visible = false;
const listeners = new Set();

const SHOW_DELAY_MS = 180;
const MIN_VISIBLE_MS = 280;

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener(visible);
    } catch {
      // ignore subscriber errors
    }
  });
};

const setVisible = (next) => {
  if (visible === next) return;
  visible = next;
  notify();
};

export const subscribeGlobalLoading = (listener) => {
  listeners.add(listener);
  listener(visible);
  return () => listeners.delete(listener);
};

export const getGlobalLoadingVisible = () => visible;

export const beginGlobalLoading = () => {
  pending += 1;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (pending === 1 && !visible) {
    showTimer = setTimeout(() => {
      showTimer = null;
      if (pending > 0) setVisible(true);
    }, SHOW_DELAY_MS);
  }
};

export const endGlobalLoading = () => {
  pending = Math.max(0, pending - 1);
  if (pending > 0) return;

  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }

  if (!visible) return;

  hideTimer = setTimeout(() => {
    hideTimer = null;
    if (pending === 0) setVisible(false);
  }, MIN_VISIBLE_MS);
};

export const shouldTrackAxiosLoading = (config = {}) => {
  if (config.skipLoading === true) return false;
  const headers = config.headers || {};
  const skipHeader =
    headers["X-Skip-Loading"] ||
    headers["x-skip-loading"] ||
    headers.common?.["X-Skip-Loading"];
  if (String(skipHeader || "").toLowerCase() === "1") return false;
  if (String(skipHeader || "").toLowerCase() === "true") return false;
  return true;
};
