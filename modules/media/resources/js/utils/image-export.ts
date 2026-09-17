type CropBounds = { x: number; y: number; width: number; height: number };

// Panning and fitting only change the viewport, not the exported image.
export function hasImageTransform(matrix: number[]) {
    const [a, b, c, d] = matrix;
    const scale = Math.hypot(a, b);
    return scale > 0 && [a / scale - 1, b / scale, c / scale, d / scale - 1].some((value) => Math.abs(value) > 0.00001);
}

export function imageExportBounds(width: number, height: number, matrix: number[], crop?: CropBounds) {
    const [a, b, c, d, e, f] = matrix;
    const scale = Math.hypot(a, b);
    if (!Number.isFinite(scale) || scale <= 0) throw new Error('Invalid image scale');
    const transformedWidth = Math.abs(a) * width + Math.abs(c) * height;
    const transformedHeight = Math.abs(b) * width + Math.abs(d) * height;
    const bounds = crop ?? {
        x: width / 2 + e - transformedWidth / 2,
        y: height / 2 + f - transformedHeight / 2,
        width: transformedWidth,
        height: transformedHeight,
    };
    return { ...bounds, outputWidth: Math.max(1, Math.round(bounds.width / scale)), outputHeight: Math.max(1, Math.round(bounds.height / scale)) };
}
