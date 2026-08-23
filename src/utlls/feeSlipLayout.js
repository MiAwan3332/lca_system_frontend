import jsPDF from "jspdf";

/** Printable fee slip: 5 inches wide × 7 inches tall. */
export const SLIP_WIDTH_IN = 5;
export const SLIP_HEIGHT_IN = 7;
export const SLIP_WIDTH_MM = SLIP_WIDTH_IN * 25.4;
export const SLIP_HEIGHT_MM = SLIP_HEIGHT_IN * 25.4;

/** Print margins on 5×7 paper (applied when printing fee slips). */
export const SLIP_PRINT_MARGIN_TOP_IN = 0;
export const SLIP_PRINT_MARGIN_BOTTOM_IN = 1.9;
export const SLIP_PRINT_MARGIN_TOP_MM = SLIP_PRINT_MARGIN_TOP_IN * 25.4;
export const SLIP_PRINT_MARGIN_BOTTOM_MM = SLIP_PRINT_MARGIN_BOTTOM_IN * 25.4;
export const SLIP_PRINT_CONTENT_HEIGHT_MM =
  SLIP_HEIGHT_MM - SLIP_PRINT_MARGIN_TOP_MM - SLIP_PRINT_MARGIN_BOTTOM_MM;

/** Target print resolution for thermal / photo printers. */
export const SLIP_PRINT_DPI = 203;
export const SLIP_PRINT_WIDTH_PX = Math.round(SLIP_WIDTH_IN * SLIP_PRINT_DPI);
export const SLIP_PRINT_HEIGHT_PX = Math.round(SLIP_HEIGHT_IN * SLIP_PRINT_DPI);
export const SLIP_PAGE_SIZE_CSS = `${SLIP_WIDTH_MM}mm ${SLIP_HEIGHT_MM}mm`;

/** Brand palette — charcoal + warm gold (prints clearly in grayscale). */
const BRANDING_COLORS = {
  charcoal: [33, 37, 41],
  ink: [26, 32, 44],
  gold: [180, 130, 55],
  goldSoft: [232, 210, 170],
  white: [255, 255, 255],
  muted: [110, 110, 110],
};

/** jsPDF document sized exactly for 5×7 inch paper (width × height). */
export const createFeeSlipPdf = () =>
  new jsPDF({
    unit: "mm",
    format: [SLIP_WIDTH_MM, SLIP_HEIGHT_MM],
  });

/** Shared layout tuned for compact 5×7 slips. */
export const getFeeSlipFrame = (doc, options = {}) => {
  const includeBranding = options.includeBranding !== false;
  const usePrintMargins =
    options.usePrintMargins !== undefined
      ? options.usePrintMargins
      : !includeBranding;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = usePrintMargins ? SLIP_PRINT_MARGIN_TOP_MM : 0;
  const marginBottom = usePrintMargins ? SLIP_PRINT_MARGIN_BOTTOM_MM : 0;
  const pad = usePrintMargins ? 2.5 : 3;

  return {
    pageWidth,
    pageHeight,
    cardW: pageWidth,
    cardH: pageHeight - marginTop - marginBottom,
    cardX: 0,
    cardY: marginTop,
    pad,
    innerX: pad,
    innerW: pageWidth - pad * 2,
    includeBranding,
    usePrintMargins,
    marginTop,
    marginBottom,
    headerH: includeBranding ? 14 : 0,
    footerH: includeBranding ? 9 : 0,
    logoBox: 8,
    photoW: usePrintMargins ? 18 : 20,
    photoH: usePrintMargins ? 22 : 24,
    chipH: usePrintMargins ? 10 : 11,
    gap: usePrintMargins ? 1.2 : 1.4,
    bannerH: usePrintMargins ? 11 : 12,
  };
};

export const getFeeSlipContentStartY = (frame, offset = 1.5) =>
  frame.cardY +
  (frame.includeBranding ? frame.headerH : frame.pad * 0.4) +
  offset;

/** Modern charcoal header with gold accent and academy branding. */
export const drawFeeSlipBrandingHeader = (doc, frame, { title, logoPng }) => {
  if (!frame.includeBranding) return;

  const { cardX, cardY, cardW, innerX, headerH, logoBox } = frame;

  doc.setFillColor(...BRANDING_COLORS.charcoal);
  doc.rect(cardX, cardY, cardW, headerH, "F");

  doc.setFillColor(...BRANDING_COLORS.gold);
  doc.rect(cardX, cardY + headerH - 1, cardW, 1, "F");

  const logoBoxX = innerX;
  const logoBoxY = cardY + 2.5;
  doc.setFillColor(...BRANDING_COLORS.white);
  doc.roundedRect(logoBoxX, logoBoxY, logoBox, logoBox, 1.5, 1.5, "F");

  if (logoPng) {
    try {
      const iconPad = 1;
      doc.addImage(
        logoPng,
        "PNG",
        logoBoxX + iconPad,
        logoBoxY + iconPad,
        logoBox - iconPad * 2,
        logoBox - iconPad * 2
      );
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...BRANDING_COLORS.charcoal);
      doc.text("LCA", logoBoxX + logoBox / 2, logoBoxY + 5.5, {
        align: "center",
      });
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...BRANDING_COLORS.charcoal);
    doc.text("LCA", logoBoxX + logoBox / 2, logoBoxY + 5.5, {
      align: "center",
    });
  }

  const titleX = logoBoxX + logoBox + 2.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRANDING_COLORS.white);
  doc.text("Lahore CSS Academy", titleX, cardY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...BRANDING_COLORS.goldSoft);
  doc.text(String(title || "FEE SLIP"), titleX, cardY + 10.5);
};

/** Charcoal footer with gold top rule, contacts, and address. */
export const drawFeeSlipBrandingFooter = (doc, frame) => {
  if (!frame.includeBranding) return;

  const { cardX, cardY, cardW, cardH, innerW, footerH } = frame;
  const footerY = cardY + cardH - footerH;

  doc.setFillColor(...BRANDING_COLORS.gold);
  doc.rect(cardX, footerY, cardW, 0.8, "F");

  doc.setFillColor(...BRANDING_COLORS.charcoal);
  doc.rect(cardX, footerY + 0.8, cardW, footerH - 0.8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(...BRANDING_COLORS.white);
  doc.text(
    "0331-000-111-0  ·  0333-9800938",
    cardX + cardW / 2,
    footerY + 3.8,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(...BRANDING_COLORS.goldSoft);
  doc.text(
    "13-Sher Shah, New Garden Town, Barkat Market, Lahore",
    cardX + cardW / 2,
    footerY + 7,
    { align: "center", maxWidth: innerW }
  );
};
