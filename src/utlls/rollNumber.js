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
