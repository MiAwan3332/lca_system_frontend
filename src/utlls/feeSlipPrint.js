import * as pdfjsLib from "pdfjs-dist";
import {
  SLIP_HEIGHT_IN,
  SLIP_HEIGHT_MM,
  SLIP_PAGE_SIZE_CSS,
  SLIP_PRINT_DPI,
  SLIP_PRINT_HEIGHT_PX,
  SLIP_PRINT_MARGIN_BOTTOM_IN,
  SLIP_PRINT_MARGIN_TOP_IN,
  SLIP_PRINT_WIDTH_PX,
  SLIP_WIDTH_IN,
  SLIP_WIDTH_MM,
} from "./feeSlipLayout";

pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.js`;

const buildPrintHtml = (imageDataUrl) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>&#8203;</title>
<style>
  @page {
    size: ${SLIP_PAGE_SIZE_CSS};
    margin: 0 !important;
  }
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: ${SLIP_WIDTH_MM}mm;
    height: ${SLIP_HEIGHT_MM}mm;
    overflow: hidden;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  img {
    width: ${SLIP_WIDTH_MM}mm;
    height: ${SLIP_HEIGHT_MM}mm;
    max-width: ${SLIP_WIDTH_MM}mm;
    max-height: ${SLIP_HEIGHT_MM}mm;
    display: block;
    object-fit: fill;
  }
  @media print {
    html, body {
      width: ${SLIP_WIDTH_MM}mm !important;
      height: ${SLIP_HEIGHT_MM}mm !important;
    }
    img {
      width: ${SLIP_WIDTH_MM}mm !important;
      height: ${SLIP_HEIGHT_MM}mm !important;
      page-break-before: avoid;
      page-break-after: avoid;
    }
  }
</style>
</head>
<body>
  <img id="slip" src="${imageDataUrl}" alt="" width="${SLIP_PRINT_WIDTH_PX}" height="${SLIP_PRINT_HEIGHT_PX}" />
</body>
</html>`;

const pdfBytesToImageDataUrl = async (pdfBytes) => {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const canvas = document.createElement("canvas");
  canvas.width = SLIP_PRINT_WIDTH_PX;
  canvas.height = SLIP_PRINT_HEIGHT_PX;

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, SLIP_PRINT_WIDTH_PX, SLIP_PRINT_HEIGHT_PX);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = SLIP_PRINT_WIDTH_PX / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const offsetX = Math.max(0, (SLIP_PRINT_WIDTH_PX - viewport.width) / 2);
  const offsetY = Math.max(0, (SLIP_PRINT_HEIGHT_PX - viewport.height) / 2);

  context.save();
  context.translate(offsetX, offsetY);
  await page.render({ canvasContext: context, viewport }).promise;
  context.restore();

  return canvas.toDataURL("image/png");
};

const printImageDataUrl = (imageDataUrl) =>
  new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = `${SLIP_WIDTH_MM}mm`;
    iframe.style.height = `${SLIP_HEIGHT_MM}mm`;
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    if (!win) {
      document.body.removeChild(iframe);
      reject(new Error("Could not open print frame."));
      return;
    }

    // Browser print headers often show the page title — blank both during print
    const previousTitle = document.title;
    document.title = " ";

    const cleanup = () => {
      document.title = previousTitle;
      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    };

    win.document.open();
    win.document.write(buildPrintHtml(imageDataUrl));
    win.document.close();
    try {
      win.document.title = " ";
    } catch {
      // ignore cross-frame title issues
    }

    const img = win.document.getElementById("slip");
    if (!img) {
      cleanup();
      reject(new Error("Failed to prepare slip for printing."));
      return;
    }

    img.onload = () => {
      win.focus();
      win.print();
      cleanup();
      resolve();
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load slip for printing."));
    };
  });

/** Print a jsPDF fee slip at exactly 5×7 inches without browser header/footer chrome. */
export const printFeeSlipPdf = async (doc) => {
  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
  const imageDataUrl = await pdfBytesToImageDataUrl(pdfBytes);
  await printImageDataUrl(imageDataUrl);
};

/** Print a fee slip PDF fetched from a URL (stored slip on server). */
export const printFeeSlipFromUrl = async (slipUrl) => {
  if (!slipUrl) {
    throw new Error("Fee slip URL is missing.");
  }

  const response = await fetch(slipUrl, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to load fee slip for printing.");
  }

  const pdfBytes = new Uint8Array(await response.arrayBuffer());
  const imageDataUrl = await pdfBytesToImageDataUrl(pdfBytes);
  await printImageDataUrl(imageDataUrl);
};

/** Print a fee slip PDF blob at exactly 5×7 inches. */
export const printFeeSlipBlob = async (blob) => {
  const pdfBytes = new Uint8Array(await blob.arrayBuffer());
  const imageDataUrl = await pdfBytesToImageDataUrl(pdfBytes);
  await printImageDataUrl(imageDataUrl);
};

export const SLIP_PRINT_SIZE_LABEL = `${SLIP_WIDTH_IN}" wide × ${SLIP_HEIGHT_IN}" tall (${SLIP_PRINT_DPI} DPI, top ${SLIP_PRINT_MARGIN_TOP_IN}" / bottom ${SLIP_PRINT_MARGIN_BOTTOM_IN}" margin)`;
