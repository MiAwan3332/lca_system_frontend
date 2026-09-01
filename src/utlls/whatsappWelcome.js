export const whatsappWelcomeDescription = (wa) => {
  if (!wa) return undefined;
  if (wa.sent) return "Welcome WhatsApp sent.";
  const reason = wa.reason || wa.error;
  if (reason) return `WhatsApp not sent: ${reason}`;
  if (wa.skipped) {
    return "WhatsApp welcome not sent — connect WhatsApp and check Templates.";
  }
  return undefined;
};
