const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

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

export async function prepareSheet(file: File) {
  const nameOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!ALLOWED.has(file.type) && !nameOk) {
    throw new Error("Use a JPEG, PNG, or WebP.");
  }
  if (file.size > 12_000_000) {
    throw new Error("That file is too large to prepare.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    let quality = 0.74;
    let maxSide = 1200;
    let dataUrl = "";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (!blob) throw new Error("Could not prepare the image.");
      dataUrl = await blobToDataUrl(blob);
      if (dataUrl.length <= 300_000) return dataUrl;
      quality -= 0.12;
      maxSide = Math.round(maxSide * 0.85);
    }
    if (dataUrl.length > 400_000) {
      throw new Error("That sheet is still too large. Try a closer crop.");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
