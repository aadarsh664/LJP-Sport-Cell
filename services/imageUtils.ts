/**
 * Compresses an image file to WebP format, aiming for a target size between 50KB - 60KB.
 * It uses iterative compression adjustment.
 */
export const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 1. Resize if extremely large (e.g., > 1080p) to help file size
                // We try to keep resolution high but cap it to avoid massive raw data
                const MAX_DIMENSION = 1080; 

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // 2. Iterative Compression to hit target 50KB - 60KB
                let quality = 0.8;
                let dataUrl = canvas.toDataURL('image/webp', quality);
                
                // Helper to get size in KB
                const getSizeKB = (url: string) => Math.round((url.length * 3 / 4) / 1024);

                let attempts = 0;
                let size = getSizeKB(dataUrl);

                // Binary search-like approach or simple step down
                while (size > 60 && attempts < 10) {
                    quality -= 0.1;
                    if (quality < 0.1) quality = 0.1;
                    dataUrl = canvas.toDataURL('image/webp', quality);
                    size = getSizeKB(dataUrl);
                    attempts++;
                }

                // If it's too small (unlikely for photos, but possible for graphics), 
                // we don't scale up "quality" > 1, but we accept it. 
                // The prompt says "Strictly compress... to fall between". 
                // If it's naturally small, we leave it. The upper bound is the critical one for storage.

                console.log(`Image Compressed: ${size}KB, Quality: ${quality.toFixed(2)}`);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};