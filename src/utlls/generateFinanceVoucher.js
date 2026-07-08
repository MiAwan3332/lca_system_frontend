import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getVoucherFileName } from "./financeVoucherUtils";

export const VOUCHER_PRINT_PAGE_ID = "voucher-print-page";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_ASPECT_RATIO = A4_WIDTH_MM / A4_HEIGHT_MM;

const waitForNextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

const normalizeCanvasToA4 = (sourceCanvas) => {
  const normalized = document.createElement("canvas");
  normalized.width = sourceCanvas.width;
  normalized.height = Math.round(sourceCanvas.width / A4_ASPECT_RATIO);

  const ctx = normalized.getContext("2d");
  if (!ctx) return sourceCanvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, normalized.width, normalized.height);
  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    normalized.width,
    normalized.height
  );

  return normalized;
};

const buildSinglePagePdf = (imageDataUrl) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pdf.addImage(
    imageDataUrl,
    "PNG",
    0,
    0,
    A4_WIDTH_MM,
    A4_HEIGHT_MM,
    undefined,
    "FAST"
  );

  return pdf;
};

export const captureVoucherSnapshot = async (sheetElement, canvasElement = null) => {
  if (!sheetElement) {
    throw new Error("Voucher preview is not ready.");
  }

  const previousTransform = canvasElement?.style.transform ?? "";

  if (canvasElement) {
    canvasElement.style.transform = "none";
    canvasElement.classList.add("voucher-preview-canvas--capture");
  }

  sheetElement.classList.add("voucher-sheet--capture");

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForNextFrame();

  try {
    const canvas = await html2canvas(sheetElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: sheetElement.offsetWidth,
      height: sheetElement.offsetHeight,
      scrollX: 0,
      scrollY: 0,
    });

    return normalizeCanvasToA4(canvas);
  } finally {
    sheetElement.classList.remove("voucher-sheet--capture");
    if (canvasElement) {
      canvasElement.style.transform = previousTransform;
      canvasElement.classList.remove("voucher-preview-canvas--capture");
    }
  }
};

export const snapshotToImageUrl = (canvas) => canvas.toDataURL("image/png");

export const createVoucherPrintPage = (imageDataUrl) => {
  const page = document.createElement("div");
  page.id = VOUCHER_PRINT_PAGE_ID;

  const img = document.createElement("img");
  img.src = imageDataUrl;
  img.alt = "Finance Voucher";
  page.appendChild(img);

  return page;
};

export const mountVoucherPrintPage = (imageDataUrl) => {
  if (!imageDataUrl) return;
  document.getElementById(VOUCHER_PRINT_PAGE_ID)?.remove();
  document.body.appendChild(createVoucherPrintPage(imageDataUrl));
};

export const unmountVoucherPrintPage = () => {
  document.getElementById(VOUCHER_PRINT_PAGE_ID)?.remove();
};

export const exportVoucherImage = async (sheetElement, canvasElement = null) => {
  const canvas = await captureVoucherSnapshot(sheetElement, canvasElement);
  return snapshotToImageUrl(canvas);
};

export const downloadVoucherPdf = async (
  sheetElement,
  canvasElement,
  transaction,
  existingImageUrl = null
) => {
  const imageDataUrl =
    existingImageUrl || (await exportVoucherImage(sheetElement, canvasElement));

  buildSinglePagePdf(imageDataUrl).save(getVoucherFileName(transaction));
};

export const printVoucherImage = (imageDataUrl) => {
  if (!imageDataUrl) {
    throw new Error("Voucher image is not ready.");
  }

  unmountVoucherPrintPage();

  const blob = buildSinglePagePdf(imageDataUrl).output("blob");
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  );
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  const cleanup = () => {
    URL.revokeObjectURL(blobUrl);
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        window.setTimeout(cleanup, 2000);
      }
    }, 400);
  };

  iframe.onerror = cleanup;
};

export const printVoucherSheet = async (sheetElement, canvasElement = null) => {
  const imageDataUrl = await exportVoucherImage(sheetElement, canvasElement);
  printVoucherImage(imageDataUrl);
};
