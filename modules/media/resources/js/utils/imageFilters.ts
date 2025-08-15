/**
 * Modern Canvas-based image filters to replace CamanJS
 * These filters work with HTML5 Canvas and are compatible with modern browsers
 */

export interface FilterOptions {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    saturation?: number; // -100 to 100
    vibrance?: number; // -100 to 100
    exposure?: number; // -100 to 100
    hue?: number; // 0 to 360
    sepia?: number; // 0 to 100
    gamma?: number; // 0.1 to 3.0
    noise?: number; // 0 to 100
    sharpen?: number; // 0 to 100
    blur?: number; // 0 to 20
    greyscale?: boolean;
    invert?: boolean;
    // Preset filters
    clarity?: boolean;
    pinhole?: boolean;
    love?: boolean;
    jarques?: boolean;
    orangePeel?: boolean;
    sinCity?: boolean;
    grungy?: boolean;
    oldBoot?: boolean;
    lomo?: boolean;
    vintage?: boolean;
    crossProcess?: boolean;
    concentrate?: boolean;
    glowingSun?: boolean;
    sunrise?: boolean;
    nostalgia?: boolean;
    hemingway?: boolean;
    herMajesty?: boolean;
    hazyDays?: boolean;
}

export class ImageFilterProcessor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private originalImageData: ImageData | null = null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    /**
     * Load image from URL or HTMLImageElement
     */
    public async loadImage(source: string | HTMLImageElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                this.canvas.width = img.naturalWidth;
                this.canvas.height = img.naturalHeight;
                this.ctx.drawImage(img, 0, 0);
                this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                resolve();
            };

            img.onerror = reject;

            if (typeof source === 'string') {
                img.src = source;
            } else {
                img.src = source.src;
            }
        });
    }

    /**
     * Apply filters to the image
     */
    public applyFilters(filters: FilterOptions): string {
        if (!this.originalImageData) {
            throw new Error('No image loaded');
        }

        // Start with original image data
        let imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height,
        );

        // Apply filters in sequence
        if (filters.brightness !== undefined) {
            imageData = this.applyBrightness(imageData, filters.brightness);
        }

        if (filters.contrast !== undefined) {
            imageData = this.applyContrast(imageData, filters.contrast);
        }

        if (filters.saturation !== undefined) {
            imageData = this.applySaturation(imageData, filters.saturation);
        }

        if (filters.hue !== undefined) {
            imageData = this.applyHue(imageData, filters.hue);
        }

        if (filters.exposure !== undefined) {
            imageData = this.applyExposure(imageData, filters.exposure);
        }

        if (filters.gamma !== undefined) {
            imageData = this.applyGamma(imageData, filters.gamma);
        }

        if (filters.sepia !== undefined) {
            imageData = this.applySepia(imageData, filters.sepia);
        }

        if (filters.greyscale) {
            imageData = this.applyGreyscale(imageData);
        }

        if (filters.invert) {
            imageData = this.applyInvert(imageData);
        }

        if (filters.noise !== undefined) {
            imageData = this.applyNoise(imageData, filters.noise);
        }

        if (filters.sharpen !== undefined) {
            imageData = this.applySharpen(imageData, filters.sharpen);
        }

        if (filters.blur !== undefined) {
            imageData = this.applyBlur(imageData, filters.blur);
        }

        // Apply preset filters
        if (filters.clarity) {
            imageData = this.applyClarity(imageData);
        }
        if (filters.pinhole) {
            imageData = this.applyPinhole(imageData);
        }
        if (filters.love) {
            imageData = this.applyLove(imageData);
        }
        if (filters.jarques) {
            imageData = this.applyJarques(imageData);
        }
        if (filters.orangePeel) {
            imageData = this.applyOrangePeel(imageData);
        }
        if (filters.sinCity) {
            imageData = this.applySinCity(imageData);
        }
        if (filters.grungy) {
            imageData = this.applyGrungy(imageData);
        }
        if (filters.oldBoot) {
            imageData = this.applyOldBoot(imageData);
        }
        if (filters.lomo) {
            imageData = this.applyLomo(imageData);
        }
        if (filters.vintage) {
            imageData = this.applyVintage(imageData);
        }
        if (filters.crossProcess) {
            imageData = this.applyCrossProcess(imageData);
        }
        if (filters.concentrate) {
            imageData = this.applyConcentrate(imageData);
        }
        if (filters.glowingSun) {
            imageData = this.applyGlowingSun(imageData);
        }
        if (filters.sunrise) {
            imageData = this.applySunrise(imageData);
        }
        if (filters.nostalgia) {
            imageData = this.applyNostalgia(imageData);
        }
        if (filters.hemingway) {
            imageData = this.applyHemingway(imageData);
        }
        if (filters.herMajesty) {
            imageData = this.applyHerMajesty(imageData);
        }
        if (filters.hazyDays) {
            imageData = this.applyHazyDays(imageData);
        }

        // Put processed image data back to canvas
        this.ctx.putImageData(imageData, 0, 0);

        return this.canvas.toDataURL();
    }

    /**
     * Reset to original image
     */
    public reset(): string {
        if (!this.originalImageData) {
            throw new Error('No image loaded');
        }

        this.ctx.putImageData(this.originalImageData, 0, 0);
        return this.canvas.toDataURL();
    }

    /**
     * Get current canvas as data URL
     */
    public getDataURL(type?: string, quality?: number): string {
        return this.canvas.toDataURL(type, quality);
    }

    // Filter implementations
    private applyBrightness(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const factor = value * 2.55; // Convert -100:100 to -255:255

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + factor)); // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + factor)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + factor)); // B
        }

        return imageData;
    }

    private applyContrast(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const factor = (259 * (value + 255)) / (255 * (259 - value));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128)); // R
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // G
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // B
        }

        return imageData;
    }

    private applySaturation(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const factor = (value + 100) / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            data[i] = Math.max(0, Math.min(255, gray + factor * (r - gray)));
            data[i + 1] = Math.max(0, Math.min(255, gray + factor * (g - gray)));
            data[i + 2] = Math.max(0, Math.min(255, gray + factor * (b - gray)));
        }

        return imageData;
    }

    private applyHue(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const hueRotation = (value * Math.PI) / 180;

        const cos = Math.cos(hueRotation);
        const sin = Math.sin(hueRotation);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.max(
                0,
                Math.min(
                    255,
                    (0.299 + 0.701 * cos + 0.168 * sin) * r + (0.587 - 0.587 * cos + 0.33 * sin) * g + (0.114 - 0.114 * cos - 0.497 * sin) * b,
                ),
            );

            data[i + 1] = Math.max(
                0,
                Math.min(
                    255,
                    (0.299 - 0.299 * cos - 0.328 * sin) * r + (0.587 + 0.413 * cos + 0.035 * sin) * g + (0.114 - 0.114 * cos + 0.292 * sin) * b,
                ),
            );

            data[i + 2] = Math.max(
                0,
                Math.min(
                    255,
                    (0.299 - 0.3 * cos + 1.25 * sin) * r + (0.587 - 0.588 * cos - 1.05 * sin) * g + (0.114 + 0.886 * cos - 0.203 * sin) * b,
                ),
            );
        }

        return imageData;
    }

    private applyExposure(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const factor = Math.pow(2, value / 100);

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] * factor)); // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor)); // B
        }

        return imageData;
    }

    private applyGamma(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, 255 * Math.pow(data[i] / 255, 1 / value))); // R
            data[i + 1] = Math.max(0, Math.min(255, 255 * Math.pow(data[i + 1] / 255, 1 / value))); // G
            data[i + 2] = Math.max(0, Math.min(255, 255 * Math.pow(data[i + 2] / 255, 1 / value))); // B
        }

        return imageData;
    }

    private applySepia(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const factor = value / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const sepiaR = r * 0.393 + g * 0.769 + b * 0.189;
            const sepiaG = r * 0.349 + g * 0.686 + b * 0.168;
            const sepiaB = r * 0.272 + g * 0.534 + b * 0.131;

            data[i] = Math.max(0, Math.min(255, r + (sepiaR - r) * factor));
            data[i + 1] = Math.max(0, Math.min(255, g + (sepiaG - g) * factor));
            data[i + 2] = Math.max(0, Math.min(255, b + (sepiaB - b) * factor));
        }

        return imageData;
    }

    private applyGreyscale(imageData: ImageData): ImageData {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray; // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }

        return imageData;
    }

    private applyInvert(imageData: ImageData): ImageData {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]; // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
        }

        return imageData;
    }

    private applyNoise(imageData: ImageData, value: number): ImageData {
        const data = imageData.data;
        const intensity = value * 2.55;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * intensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }

        return imageData;
    }

    private applySharpen(imageData: ImageData, value: number): ImageData {
        // Simple sharpening using unsharp mask
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const factor = value / 100;

        const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

        return this.applyConvolution(imageData, sharpenKernel, factor);
    }

    private applyBlur(imageData: ImageData, value: number): ImageData {
        // Simple box blur
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const radius = Math.floor(value);

        if (radius === 0) return imageData;

        // Horizontal pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0,
                    g = 0,
                    b = 0,
                    count = 0;

                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = Math.max(0, Math.min(width - 1, x + dx));
                    const idx = (y * width + nx) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    count++;
                }

                const idx = (y * width + x) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
            }
        }

        return imageData;
    }

    private applyConvolution(imageData: ImageData, kernel: number[], factor: number = 1): ImageData {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let r = 0,
                    g = 0,
                    b = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);

                        r += data[idx] * kernel[kernelIdx];
                        g += data[idx + 1] * kernel[kernelIdx];
                        b += data[idx + 2] * kernel[kernelIdx];
                    }
                }

                const idx = (y * width + x) * 4;
                const originalIdx = idx;

                output[idx] = Math.max(0, Math.min(255, data[originalIdx] + (r - data[originalIdx]) * factor));
                output[idx + 1] = Math.max(0, Math.min(255, data[originalIdx + 1] + (g - data[originalIdx + 1]) * factor));
                output[idx + 2] = Math.max(0, Math.min(255, data[originalIdx + 2] + (b - data[originalIdx + 2]) * factor));
                output[idx + 3] = data[idx + 3]; // Alpha
            }
        }

        return new ImageData(output, width, height);
    }

    // Preset filters (combinations of basic filters)
    private applyClarity(imageData: ImageData): ImageData {
        // Clarity: Increase contrast and sharpening
        let result = this.applyContrast(imageData, 20);
        result = this.applySharpen(result, 15);
        return result;
    }

    private applyPinhole(imageData: ImageData): ImageData {
        // Pinhole: High contrast, dark vignette effect
        let result = this.applyContrast(imageData, 40);
        result = this.applyBrightness(result, -20);
        result = this.applySaturation(result, 30);
        return result;
    }

    private applyLove(imageData: ImageData): ImageData {
        // Love: Warm, romantic tones
        let result = this.applyBrightness(imageData, 10);
        result = this.applySaturation(result, 25);
        result = this.applyHue(result, 15); // Slightly warmer
        return result;
    }

    private applyJarques(imageData: ImageData): ImageData {
        // Jarques: High contrast vintage look
        let result = this.applyContrast(imageData, 35);
        result = this.applyBrightness(result, 5);
        result = this.applySaturation(result, -10);
        return result;
    }

    private applyOrangePeel(imageData: ImageData): ImageData {
        // Orange Peel: Orange-tinted warm tones
        let result = this.applyHue(imageData, 25); // Orange shift
        result = this.applySaturation(result, 20);
        result = this.applyBrightness(result, 5);
        return result;
    }

    private applySinCity(imageData: ImageData): ImageData {
        // Sin City: High contrast black and white with selective color
        let result = this.applyContrast(imageData, 60);
        result = this.applyBrightness(result, -10);
        result = this.applySaturation(result, -80); // Almost B&W
        return result;
    }

    private applyGrungy(imageData: ImageData): ImageData {
        // Grungy: Dark, gritty look
        let result = this.applyContrast(imageData, 25);
        result = this.applyBrightness(result, -25);
        result = this.applySaturation(result, -20);
        result = this.applyNoise(result, 10);
        return result;
    }

    private applyOldBoot(imageData: ImageData): ImageData {
        // Old Boot: Vintage sepia-like effect
        let result = this.applySepia(imageData, 40);
        result = this.applyContrast(result, 15);
        result = this.applyBrightness(result, -5);
        return result;
    }

    private applyLomo(imageData: ImageData): ImageData {
        // Lomo: Cross-processed film look
        let result = this.applyContrast(imageData, 30);
        result = this.applySaturation(result, 40);
        result = this.applyHue(result, 10);
        result = this.applyBrightness(result, -5);
        return result;
    }

    private applyVintage(imageData: ImageData): ImageData {
        // Vintage: Aged photo look
        let result = this.applySepia(imageData, 30);
        result = this.applyContrast(result, 10);
        result = this.applyBrightness(result, 10);
        result = this.applySaturation(result, -15);
        return result;
    }

    private applyCrossProcess(imageData: ImageData): ImageData {
        // Cross Process: Film processing technique
        let result = this.applyContrast(imageData, 25);
        result = this.applySaturation(result, 35);
        result = this.applyHue(result, 20);
        result = this.applyBrightness(result, 5);
        return result;
    }

    private applyConcentrate(imageData: ImageData): ImageData {
        // Concentrate: Enhanced clarity and color
        let result = this.applyContrast(imageData, 20);
        result = this.applySaturation(result, 25);
        result = this.applySharpen(result, 10);
        return result;
    }

    private applyGlowingSun(imageData: ImageData): ImageData {
        // Glowing Sun: Warm, bright, golden tones
        let result = this.applyBrightness(imageData, 20);
        result = this.applyHue(imageData, 30); // Golden
        result = this.applySaturation(result, 30);
        result = this.applyContrast(result, 10);
        return result;
    }

    private applySunrise(imageData: ImageData): ImageData {
        // Sunrise: Warm morning light
        let result = this.applyBrightness(imageData, 15);
        result = this.applyHue(imageData, 20); // Warm
        result = this.applySaturation(result, 20);
        result = this.applyContrast(result, 15);
        return result;
    }

    private applyNostalgia(imageData: ImageData): ImageData {
        // Nostalgia: Faded, dreamy look
        let result = this.applySepia(imageData, 20);
        result = this.applyBrightness(result, 10);
        result = this.applyContrast(result, -15);
        result = this.applySaturation(result, -25);
        return result;
    }

    private applyHemingway(imageData: ImageData): ImageData {
        // Hemingway: Classic literary feel
        let result = this.applyContrast(imageData, 35);
        result = this.applyBrightness(result, -10);
        result = this.applySaturation(result, -30);
        result = this.applySepia(result, 15);
        return result;
    }

    private applyHerMajesty(imageData: ImageData): ImageData {
        // Her Majesty: Elegant, royal tones
        let result = this.applyContrast(imageData, 20);
        result = this.applySaturation(result, 15);
        result = this.applyBrightness(result, 5);
        result = this.applyHue(imageData, 350); // Slight purple tint
        return result;
    }

    private applyHazyDays(imageData: ImageData): ImageData {
        // Hazy Days: Soft, dreamy atmosphere
        let result = this.applyBrightness(imageData, 15);
        result = this.applyContrast(result, -20);
        result = this.applySaturation(result, -10);
        result = this.applyBlur(result, 1); // Very slight blur
        return result;
    }
}
