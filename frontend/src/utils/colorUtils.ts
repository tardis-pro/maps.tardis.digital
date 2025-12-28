/**
 * Color ramp definitions for data visualization
 */
export const colorRamps: Record<string, string[]> = {
    viridis: [
        '#440154',
        '#482878',
        '#3e4a89',
        '#31688e',
        '#26838f',
        '#1f9e89',
        '#35b779',
        '#6ece58',
        '#b5de2b',
        '#fde725',
    ],
    plasma: [
        '#0d0887',
        '#46039f',
        '#7201a8',
        '#9c179e',
        '#bd3786',
        '#d8576b',
        '#ed7953',
        '#fb9f3a',
        '#fdca26',
        '#f0f921',
    ],
    inferno: [
        '#000004',
        '#1b0c41',
        '#4a0c6b',
        '#781c6d',
        '#a52c60',
        '#cf4446',
        '#ed6925',
        '#fb9b06',
        '#f7d13d',
        '#fcffa4',
    ],
    magma: [
        '#000004',
        '#180f3d',
        '#440f76',
        '#721f81',
        '#9e2f7f',
        '#cd4071',
        '#f1605d',
        '#fd9668',
        '#feca8d',
        '#fcfdbf',
    ],
    blues: [
        '#f7fbff',
        '#deebf7',
        '#c6dbef',
        '#9ecae1',
        '#6baed6',
        '#4292c6',
        '#2171b5',
        '#08519c',
        '#08306b',
    ],
    greens: [
        '#f7fcf5',
        '#e5f5e0',
        '#c7e9c0',
        '#a1d99b',
        '#74c476',
        '#41ab5d',
        '#238b45',
        '#006d2c',
        '#00441b',
    ],
    reds: [
        '#fff5f0',
        '#fee0d2',
        '#fcbba1',
        '#fc9272',
        '#fb6a4a',
        '#ef3b2c',
        '#cb181d',
        '#a50f15',
        '#67000d',
    ],
    spectral: [
        '#9e0142',
        '#d53e4f',
        '#f46d43',
        '#fdae61',
        '#fee08b',
        '#ffffbf',
        '#e6f598',
        '#abdda4',
        '#66c2a5',
        '#3288bd',
        '#5e4fa2',
    ],
    coolwarm: [
        '#3b4cc0',
        '#6788ee',
        '#9abbff',
        '#c9d7f0',
        '#edd1c2',
        '#f7a789',
        '#e36a53',
        '#b40426',
    ],
    turbo: [
        '#30123b',
        '#4662d7',
        '#35aaf4',
        '#1be5b5',
        '#71fe5f',
        '#c6e623',
        '#fdb42f',
        '#f66c19',
        '#ca2a04',
        '#7a0403',
    ],
};

/**
 * Get interpolated color from a color ramp based on a normalized value (0-1)
 */
export function getColorFromRamp(
    rampName: string,
    normalizedValue: number
): string {
    const ramp = colorRamps[rampName] || colorRamps.viridis;
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    const index = Math.floor(clampedValue * (ramp.length - 1));
    return ramp[index];
}

/**
 * Generate a CSS linear gradient string from a color ramp
 */
export function generateGradient(rampName: string): string {
    const ramp = colorRamps[rampName] || colorRamps.viridis;
    return `linear-gradient(to right, ${ramp.join(', ')})`;
}
