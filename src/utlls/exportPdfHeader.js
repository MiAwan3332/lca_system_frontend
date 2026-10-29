import { accessFetch as fetch } from './accessRequests';

// Colours of the dashboard sidebar, so exported files match the app.
export const EXPORT_HEADER_COLORS = {
  background: [34, 34, 34],
  accent: [255, 203, 130],
  title: [255, 255, 255],
  subtitle: [255, 203, 130],
  label: [158, 158, 158],
  value: [245, 236, 220],
  divider: [74, 74, 74],
};

const LOGO_WIDTH = 138;
const LOGO_HEIGHT = 37;

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(blob);
  });

/** The full academy logo (mark and name) for dark backgrounds, as a PNG; null if it cannot be drawn. */
export async function loadExportLogo(widthPx = 600) {
  try {
    const res = await fetch("/logo_dark.svg");
    if (!res.ok) return null;
    const svgDataUrl = await blobToDataUrl(new Blob([await res.text()], { type: "image/svg+xml" }));
    const img = new Image();
    img.decoding = "async";
    img.src = svgDataUrl;
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = Math.round((widthPx * LOGO_HEIGHT) / LOGO_WIDTH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

const fit = (doc, text, maxWidth) => {
  let value = String(text ?? "");
  if (doc.getTextWidth(value) <= maxWidth) return value;
  while (value.length > 1 && doc.getTextWidth(`${value}…`) > maxWidth) value = value.slice(0, -1);
  return `${value}…`;
};

/**
 * Dark header band used by every exported PDF: logo, report title and subtitle on the left,
 * labelled details (dates, filters) on the right. Returns the band's height in mm.
 */
export function drawExportHeader(doc, { logo, title, subtitle = "", details = [], margin = 10, height = 18 }) {
  const C = EXPORT_HEADER_COLORS;
  const pageWidth = doc.internal.pageSize.getWidth();
  const accentH = 0.9;
  const bandH = height - accentH;

  doc.setFillColor(...C.background);
  doc.rect(0, 0, pageWidth, bandH, "F");
  doc.setFillColor(...C.accent);
  doc.rect(0, bandH, pageWidth, accentH, "F");

  const logoH = Math.min(9, bandH - 6);
  const logoW = (logoH * LOGO_WIDTH) / LOGO_HEIGHT;
  let x = margin;
  if (logo) {
    doc.addImage(logo, "PNG", x, (bandH - logoH) / 2, logoW, logoH, undefined, "FAST");
    x += logoW + 5;
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.3);
    doc.line(x, 4, x, bandH - 4);
    x += 5;
  }

  const middle = bandH / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...C.title);
  doc.text(title, x, subtitle ? middle - 0.6 : middle + 1.6);
  const titleEnd = x + doc.getTextWidth(title);
  let leftEnd = titleEnd;
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.subtitle);
    doc.text(subtitle, x, middle + 4.2);
    leftEnd = Math.max(titleEnd, x + doc.getTextWidth(subtitle));
  }

  // Details run right to left, each a small grey label above a light value, split by thin dividers.
  let right = pageWidth - margin;
  const gap = 4.5;
  const room = right - leftEnd - 8;
  const maxEach = Math.max(34, Math.min(60, room / Math.max(details.length, 1) - gap * 2));
  [...details].filter((item) => item && item.value !== undefined && item.value !== null && item.value !== "").reverse().forEach((item, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const value = fit(doc, item.value, maxEach);
    const valueWidth = doc.getTextWidth(value);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    const label = String(item.label || "").toUpperCase();
    const width = Math.max(valueWidth, doc.getTextWidth(label));
    if (right - width < leftEnd + 6) return;
    if (index > 0) {
      doc.setDrawColor(...C.divider);
      doc.setLineWidth(0.3);
      doc.line(right + gap, 4.5, right + gap, bandH - 4.5);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...C.label);
    doc.text(label, right, middle - 1.6, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.value);
    doc.text(value, right, middle + 3, { align: "right" });
    right -= width + gap * 2;
  });

  return height;
}
