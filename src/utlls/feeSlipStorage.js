const STORAGE_PREFIX = "lca:lastFeeSlip:";

export const saveLastFeeSlipPayload = (studentId, payload) => {
  if (!studentId || !payload) return;
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}${studentId}`,
      JSON.stringify({
        ...payload,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore storage quota / private mode failures
  }
};

export const loadLastFeeSlipPayload = (studentId) => {
  if (!studentId) return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${studentId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const buildFeeSlipPayloadFromStudent = (student, overrides = {}) => {
  const outstanding = Math.round(
    Math.max(Number(student?.pending_fee) || 0, 0)
  );
  const paidFee = Math.round(Math.max(Number(student?.paid_fee) || 0, 0));
  const payingNow =
    overrides.payingNow != null
      ? Number(overrides.payingNow)
      : outstanding > 0
        ? outstanding
        : paidFee;

  return {
    name: student?.name,
    phone: student?.phone,
    cnic: student?.cnic || "",
    rollNumber: student?.roll_number,
    batchName: student?.batch?.name || "N/A",
    batchFee: Number(student?.batch?.batch_fee) || 0,
    totalFee:
      Number(student?.total_fee) || Number(student?.batch?.batch_fee) || 0,
    paidFee,
    outstandingBalance: outstanding,
    payingNow,
    remainingAfter:
      overrides.remainingAfter != null
        ? Number(overrides.remainingAfter)
        : Math.max(outstanding - payingNow, 0),
    discountAmount: Number(overrides.discountAmount) || 0,
    paymentOption: overrides.paymentOption || (outstanding > 0 ? "full" : "full"),
    paymentMethod: overrides.paymentMethod || "Cash",
    nextInstallmentDate: overrides.nextInstallmentDate || "",
    photoUrl: student?.image || "",
    authorizedBy: overrides.authorizedBy || "",
    classStartTime: student?.batch?.class_start_time || "",
    classEndTime: student?.batch?.class_end_time || "",
    isDuplicate: true,
    ...overrides,
  };
};
