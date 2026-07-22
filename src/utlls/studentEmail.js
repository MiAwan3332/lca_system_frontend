/**
 * Students without a real email get an internal login address (@lca.local).
 * Never show that generated address in the UI — use N/A instead.
 */
export const isGeneratedStudentEmail = (email) => {
  const value = String(email || "").trim().toLowerCase();
  if (!value) return true;
  return value.endsWith("@lca.local") || value === "n/a";
};

export const formatStudentEmail = (email) => {
  if (isGeneratedStudentEmail(email)) return "N/A";
  return String(email).trim();
};
