/** Legacy fixed special-fee keys used by older batches. */
export const LEGACY_SPECIAL_FEE_LABELS = {
  test_session: "Test Session",
  optional_revision: "Optional Revision",
  compulsory_revision: "Compulsory Revision",
};

const humanizeKey = (key) =>
  String(key || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Option";

export const createEmptySpecialFeeRow = (index = 0) => ({
  id: `row_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
  key: "",
  label: "",
  fee: "",
});

/**
 * Normalize batch.special_fee_options into [{ key, label, fee }, ...]
 */
export const normalizeBatchSpecialFeeOptions = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const label = String(item.label || "").trim() || humanizeKey(item.key);
        const key = String(item.key || "").trim() || `option_${index + 1}`;
        const fee = Number(item.fee) || 0;
        return { key, label, fee };
      })
      .filter(Boolean);
  }

  if (typeof raw !== "object") return [];

  return Object.entries(raw)
    .map(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return {
          key,
          label:
            String(value.label || "").trim() ||
            LEGACY_SPECIAL_FEE_LABELS[key] ||
            humanizeKey(key),
          fee: Number(value.fee) || 0,
        };
      }
      return {
        key,
        label: LEGACY_SPECIAL_FEE_LABELS[key] || humanizeKey(key),
        fee: Number(value) || 0,
      };
    })
    .filter((item) => item.key);
};

/** Form rows for Add/Update Batch (includes empty fee strings). */
export const batchSpecialFeesToFormRows = (raw) => {
  const options = normalizeBatchSpecialFeeOptions(raw);
  if (!options.length) {
    return [createEmptySpecialFeeRow(0)];
  }
  return options.map((item, index) => ({
    id: `existing_${item.key}_${index}`,
    key: item.key,
    label: item.label,
    fee: item.fee > 0 ? String(item.fee) : "",
  }));
};

export const formRowsToSpecialFeePayload = (rows = []) => {
  const usedKeys = new Set();
  return (rows || [])
    .map((row, index) => {
      const label = String(row.label || "").trim();
      const fee = Number(row.fee) || 0;
      if (!label && !(fee > 0)) return null;

      let key = String(row.key || "").trim();
      if (!key) {
        key =
          label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || `option_${index + 1}`;
      }

      let unique = key;
      let n = 2;
      while (usedKeys.has(unique)) {
        unique = `${key}_${n}`;
        n += 1;
      }
      usedKeys.add(unique);

      return {
        key: unique,
        label: label || humanizeKey(unique),
        fee,
      };
    })
    .filter(Boolean);
};
