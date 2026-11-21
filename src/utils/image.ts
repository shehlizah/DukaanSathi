export interface ProcessedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
  thumbnailUrl: string;
}

function drawResizedJpeg(img: HTMLImageElement, maxDimension: number, quality: number): string {
  let { naturalWidth: width, naturalHeight: height } = img;
  if (!width || !height) {
    width = img.width || 800;
    height = img.height || 600;
  }

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize image canvas');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

export function processImageFile(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected photo file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode this image. Please choose a JPG, PNG, or WebP photo.'));
      img.onload = () => {
        try {
          const dataUrl = drawResizedJpeg(img, 1024, 0.84);
          const thumbnailUrl = drawResizedJpeg(img, 240, 0.72);
          const base64 = dataUrl.split(',')[1] || '';
          resolve({
            dataUrl,
            base64,
            mimeType: 'image/jpeg',
            thumbnailUrl,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to process image.'));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function processImageFromUrl(url: string): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Could not load sample product photo.'));
    img.onload = () => {
      try {
        const dataUrl = drawResizedJpeg(img, 1024, 0.84);
        const thumbnailUrl = drawResizedJpeg(img, 240, 0.72);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({
          dataUrl,
          base64,
          mimeType: 'image/jpeg',
          thumbnailUrl,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to process sample image.'));
      }
    };
    img.src = url;
  });
}

export function processCanvasCapture(canvas: HTMLCanvasElement): ProcessedImage {
  const img = new Image();
  const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
  const base64 = rawUrl.split(',')[1] || '';
  // Create a smaller thumbnail canvas directly
  const maxThumb = 240;
  let w = canvas.width;
  let h = canvas.height;
  if (w > maxThumb || h > maxThumb) {
    if (w >= h) {
      h = Math.round((h * maxThumb) / w);
      w = maxThumb;
    } else {
      w = Math.round((w * maxThumb) / h);
      h = maxThumb;
    }
  }
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = w;
  thumbCanvas.height = h;
  const ctx = thumbCanvas.getContext('2d');
  let thumbnailUrl = rawUrl;
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, w, h);
    thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.72);
  }
  void img;
  return {
    dataUrl: rawUrl,
    base64,
    mimeType: 'image/jpeg',
    thumbnailUrl,
  };
}

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message || '')}`;
}
