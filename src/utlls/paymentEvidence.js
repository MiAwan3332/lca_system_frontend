/** Normalize payment evidence value (string or array) to URL list. */
export const getPaymentEvidenceUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

/** Append one or more evidence files onto FormData under payment_evidence. */
export const appendPaymentEvidenceFiles = (formData, files) => {
  const list = Array.isArray(files) ? files.filter(Boolean) : files ? [files] : [];
  list.forEach((file) => {
    formData.append("payment_evidence", file);
  });
  return list.length > 0;
};
