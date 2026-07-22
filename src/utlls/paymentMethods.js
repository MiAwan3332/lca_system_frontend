/** Fee payment methods shown in collection UIs. */
export const FEE_PAYMENT_METHODS = ["Cash", "Online Payment"];

export const isOnlinePaymentMethod = (method) =>
  method === "Online Payment" || method === "Online";

export const requiresPaymentEvidence = (method) =>
  isOnlinePaymentMethod(method);
