
import { ImageFormat } from '../types';

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return blob;
};

export const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const getTargetDimensions = (format: ImageFormat): { width: number, height: number } => {
  // Base size for calculations (short side usually)
  // We aim for dimensions that fit comfortably within model generation limits (approx 2K)
  
  switch (format) {
    case ImageFormat.RATIO_1_1: return { width: 1024, height: 1024 };
    case ImageFormat.RATIO_2_3: return { width: 1024, height: 1536 };
    case ImageFormat.RATIO_3_2: return { width: 1536, height: 1024 };
    case ImageFormat.RATIO_3_4: return { width: 1024, height: 1365 };
    case ImageFormat.RATIO_4_3: return { width: 1365, height: 1024 };
    case ImageFormat.RATIO_9_16: return { width: 1024, height: 1820 };
    case ImageFormat.RATIO_16_9: return { width: 1820, height: 1024 };
    case ImageFormat.RATIO_21_9: return { width: 2048, height: 878 }; // Adjusted to fit 2K width
    default: return { width: 1024, height: 1024 };
  }
};

export const createOutpaintingCanvas = (originalImageDataUrl: string, format: ImageFormat): Promise<string> => {
  return new Promise((resolve, reject) => {
    const target = getTargetDimensions(format);
    
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Could not get canvas context'));
    }

    // Fill background with black (our "mask" for the model to fill)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      // Use Math.min to fit the image within the canvas (contain)
      const ratio = Math.min(hRatio, vRatio);

      const finalWidth = img.width * ratio;
      const finalHeight = img.height * ratio;

      // Center the image
      const x = (canvas.width - finalWidth) / 2;
      const y = (canvas.height - finalHeight) / 2;
      
      ctx.drawImage(img, x, y, finalWidth, finalHeight);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = originalImageDataUrl;
  });
};
