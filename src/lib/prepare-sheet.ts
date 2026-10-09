export const SHEET_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf";

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not prepare the image."));
    };
    reader.onerror = () => reject(new Error("Could not prepare the image."));
    reader.readAsDataURL(blob);
  });
}

function isHeic(file: File) {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/heic-sequence" ||
    file.type === "image/heif-sequence" ||
    /\.hei[cf]$/i.test(file.name)
  );
}

async function canvasFromHeic(file: File) {
  try {
    return await canvasFromImage(file);
  } catch {
    // Chrome and Firefox cannot decode HEIC on their own.
  }
  const heic2any = (await import("heic2any")).default;
  let converted: Blob | Blob[];
  try {
    converted = (await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8,
    })) as Blob | Blob[];
  } catch {
    throw new Error("Could not read that HEIC. Export it as a JPEG, or send a PDF.");
  }
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!blob) throw new Error("Could not read that HEIC. Export it as a JPEG, or send a PDF.");
  return canvasFromImage(new File([blob], "sheet.jpg", { type: "image/jpeg" }));
}

function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

async function compressCanvas(source: HTMLCanvasElement) {
  let quality = 0.74;
  let width = Math.min(source.width, 1400);
  let dataUrl = "";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const height = Math.max(1, Math.round(source.height * (width / source.width)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (!blob) throw new Error("Could not prepare the image.");
    dataUrl = await blobToDataUrl(blob);
    if (dataUrl.length <= 300_000) return dataUrl;
    quality = Math.max(0.42, quality - 0.08);
    width = Math.round(width * 0.85);
  }
  if (dataUrl.length > 400_000) {
    throw new Error("That file is still too large. Send the order pages only, or a JPEG.");
  }
  return dataUrl;
}

async function canvasFromImage(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the image.");
    context.drawImage(bitmap, 0, 0);
    return canvas;
  } finally {
    bitmap.close();
  }
}

async function canvasFromPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  const data = new Uint8Array(await file.arrayBuffer());
  let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    doc = await pdfjs.getDocument({ data }).promise;
  } catch (caught) {
    const name = caught instanceof Error ? caught.name : "";
    if (name === "PasswordException") {
      throw new Error("That PDF has a password. Remove it, or send a JPEG.");
    }
    throw new Error("Could not read that PDF.");
  }
  const count = Math.min(doc.numPages, 8);
  const targetWidth = 1100;
  const pages: HTMLCanvasElement[] = [];
  for (let number = 1; number <= count; number += 1) {
    const page = await doc.getPage(number);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: targetWidth / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not read that PDF.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas);
  }
  const gap = pages.length > 1 ? 28 : 0;
  const width = Math.max(...pages.map((page) => page.width));
  const height = pages.reduce((sum, page) => sum + page.height, 0) + gap * (pages.length - 1);
  const sheet = document.createElement("canvas");
  sheet.width = width;
  sheet.height = height;
  const context = sheet.getContext("2d");
  if (!context) throw new Error("Could not read that PDF.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  let top = 0;
  for (const page of pages) {
    context.drawImage(page, 0, top);
    top += page.height + gap;
  }
  return sheet;
}

export async function prepareSheet(file: File) {
  if (file.size > 20_000_000) {
    throw new Error("That file is too large to prepare.");
  }
  if (isPdf(file)) return compressCanvas(await canvasFromPdf(file));
  if (isHeic(file)) return compressCanvas(await canvasFromHeic(file));
  const nameOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!IMAGE_TYPES.has(file.type) && !nameOk) {
    throw new Error("Use a JPEG, a HEIC, or a PDF.");
  }
  return compressCanvas(await canvasFromImage(file));
}
