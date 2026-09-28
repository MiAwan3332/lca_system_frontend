/** Online → On, On Campus → OC (matches backend roll prefix). */
export const resolveBatchModeCode = (batchType) => {
  const type = String(batchType || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (type === "online") return "On";
  if (type === "on campus" || type === "oncampus") return "OC";
  return "";
};

export const normalizeRollNickname = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/** Preview like OC-MARATHON-1 */
export const buildRollNumberSample = (batchType, rollNickname, seq = 1) => {
  const mode = resolveBatchModeCode(batchType);
  const nick = normalizeRollNickname(rollNickname) || "NICK";
  if (mode) return `${mode}-${nick}-${seq}`;
  return `${nick}-${seq}`;
};

/**
 * Trailing sequence from rolls like OC-Marathon-1 / OC-MARATHON-12.
 * Prefers `-(\d+)$`, then any final digit run.
 */
export const extractRollSequence = (rollNumber) => {
  const roll = String(rollNumber || "").trim();
  if (!roll) return null;
  const hyphenMatch = roll.match(/-(\d+)$/);
  if (hyphenMatch) {
    const seq = Number(hyphenMatch[1]);
    return Number.isFinite(seq) ? seq : null;
  }
  const digitMatch = roll.match(/(\d+)\s*$/);
  if (digitMatch) {
    const seq = Number(digitMatch[1]);
    return Number.isFinite(seq) ? seq : null;
  }
  return null;
};

/** Prefix before the trailing sequence (for grouping similar roll patterns). */
export const extractRollPrefix = (rollNumber) => {
  const roll = String(rollNumber || "").trim();
  if (!roll) return "";
  return roll
    .replace(/-\d+\s*$/, "")
    .replace(/\d+\s*$/, "")
    .replace(/[-_\s]+$/g, "")
    .toLowerCase();
};

/**
 * Ascending roll order: OC-Marathon-1, OC-Marathon-2, … OC-Marathon-10
 * (by trailing numeric segment), then name / id.
 */
export const compareStudentsByRollAscending = (a, b) => {
  const rollA = String(a?.roll_number || "").trim();
  const rollB = String(b?.roll_number || "").trim();

  if (!rollA && rollB) return 1;
  if (rollA && !rollB) return -1;

  if (rollA || rollB) {
    const prefixA = extractRollPrefix(rollA);
    const prefixB = extractRollPrefix(rollB);
    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB, undefined, { sensitivity: "base" });
    }

    const seqA = extractRollSequence(rollA);
    const seqB = extractRollSequence(rollB);
    if (seqA != null && seqB != null && seqA !== seqB) {
      return seqA - seqB;
    }
    if (seqA != null && seqB == null) return -1;
    if (seqA == null && seqB != null) return 1;

    if (rollA !== rollB) {
      return rollA.localeCompare(rollB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }
  }

  const nameA = String(a?.name || "")
    .trim()
    .toLowerCase();
  const nameB = String(b?.name || "")
    .trim()
    .toLowerCase();
  if (nameA !== nameB) {
    return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
  }
  return String(a?._id || "").localeCompare(String(b?._id || ""));
};
