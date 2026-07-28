/**
 * Create an HTMLImageElement from a URL / data URL.
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Crop an image using react-easy-crop pixel area and return a Blob.
 */
export async function getCroppedImageBlob(imageSrc, pixelCrop, mimeType = "image/jpeg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available.");
  }

  const size = Math.max(1, Math.round(Math.min(pixelCrop.width, pixelCrop.height)));
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not crop image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      0.92
    );
  });
}

export async function getCroppedImageFile(
  imageSrc,
  pixelCrop,
  fileName = `avatar-${Date.now()}.jpg`
) {
  const blob = await getCroppedImageBlob(imageSrc, pixelCrop);
  return new File([blob], fileName, { type: "image/jpeg" });
}
