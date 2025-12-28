import * as THREE from 'three';

type ColorArray = number[] | Uint8ClampedArray;
type ColorInput = string | number[];

export function parseColor(color: ColorInput): number[] | Uint8ClampedArray {
    if (Array.isArray(color)) {
        if (color.length === 3) {
            return [color[0], color[1], color[2], 255];
        }
        return color;
    }
    if (typeof color === 'string') {
        return parseHexColor(color);
    }
    return [0, 0, 0, 255];
}

// Parse a hex color
export function parseHexColor(color: string): Uint8ClampedArray {
    const array = new Uint8ClampedArray(4);
    if (color.length === 7) {
        const value = parseInt(color.substring(1), 16);
        array[0] = Math.round(value / 65536);
        array[1] = Math.round((value / 256) % 256);
        array[2] = Math.round(value % 256);
        array[3] = 255;
    } else if (color.length === 9) {
        const value = parseInt(color.substring(1), 16);
        array[0] = Math.round(value / 16777216);
        array[1] = Math.round(value / 65536) % 256;
        array[2] = Math.round(value / 256) % 256;
        array[3] = value % 256;
    }
    return array;
}

export function setOpacity(color: ColorArray, opacity = 127): number[] {
    return [color[0], color[1], color[2], opacity];
}

export function applyOpacity(color: ColorArray, opacity = 127): number[] {
    return [color[0], color[1], color[2], opacity];
}

export const vertexShader = `
varying vec3 vUv;
void main()	{
    vUv = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;
export const fragmentShader = `
varying vec3 vUv;

void main() {
  // Calculate wood rings
  float frequency = 0.05;
  float noiseValue = sin(vUv.z * frequency + sin(vUv.x * frequency));

  // Add some noise for realism
  float grain = fract(sin(dot(vUv.xy, vec2(12.9898, 78.233))) * 43758.5453);
  grain *= 0.1;

  // Mix wood color
  vec3 woodColor = mix(vec3(0.4, 0.2, 0.07), vec3(0.6, 0.3, 0.1), noiseValue + grain);

  gl_FragColor = vec4(woodColor, 1.0);
}
`;

interface GeometryWithAttributes {
    attributes: {
        normal: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
    };
}

type MaterialUniforms = Record<string, { value: unknown }>;

export const materialBorderGen = (
    geom: GeometryWithAttributes | null
): THREE.ShaderMaterial => {
    const uniforms: MaterialUniforms = {
        diffuse: {
            value: 2,
        },
        smoothness: {
            value: 0.1,
        },
        color: {
            value: new THREE.Color('skyblue'),
        },
    };
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not get 2d context from canvas');
    }
    const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
    );
    gradient.addColorStop(0.1, 'rgba(0,59,111,1)');
    // gradient.addColorStop(0.25, 'rgba(0,59,111,0.5)');
    console.log(geom);
    gradient.addColorStop(1, 'rgba(0,59,111,1)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // shadowTexture is created but not used - keeping for potential future use
    new THREE.CanvasTexture(canvas);
    if (geom) {
        uniforms.lightmap = {
            value: {
                lightMap: geom.attributes.normal,
                lightMapIntensity: geom.attributes.normal,
            },
        };
    }
    return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: false, // Add this if you want transparency
    });
};

export const colorRamps: Record<string, string[]> = {
    viridis: [
        'rgb(68,1,84)',
        'rgb(72,35,116)',
        'rgb(64,67,135)',
        'rgb(52,94,141)',
        'rgb(41,120,142)',
        'rgb(32,144,140)',
        'rgb(34,167,132)',
        'rgb(68,190,112)',
        'rgb(121,209,81)',
        'rgb(189,222,38)',
        'rgb(253,231,37)',
    ],
    magma: [
        'rgb(0,0,4)',
        'rgb(40,11,52)',
        'rgb(101,21,87)',
        'rgb(158,39,111)',
        'rgb(212,70,120)',
        'rgb(244,120,128)',
        'rgb(249,170,141)',
        'rgb(250,219,170)',
        'rgb(252,253,191)',
    ],
    plasma: [
        'rgb(13,8,135)',
        'rgb(75,3,161)',
        'rgb(125,3,168)',
        'rgb(168,20,151)',
        'rgb(203,42,118)',
        'rgb(231,70,81)',
        'rgb(248,117,47)',
        'rgb(252,171,42)',
        'rgb(240,225,77)',
    ],
    inferno: [
        'rgb(0,0,4)',
        'rgb(51,13,53)',
        'rgb(102,26,77)',
        'rgb(153,50,79)',
        'rgb(200,88,72)',
        'rgb(233,136,69)',
        'rgb(249,188,64)',
        'rgb(252,229,161)',
    ],
    turbo: [
        'rgb(30,60,180)',
        'rgb(35,94,207)',
        'rgb(31,127,225)',
        'rgb(37,159,228)',
        'rgb(57,190,210)',
        'rgb(93,216,181)',
        'rgb(138,236,144)',
        'rgb(183,246,106)',
        'rgb(224,243,77)',
        'rgb(249,222,58)',
        'rgb(253,183,50)',
        'rgb(239,134,52)',
        'rgb(213,84,58)',
        'rgb(176,42,60)',
        'rgb(129,22,66)',
    ],
    blues: [
        'rgb(247,251,255)',
        'rgb(222,235,247)',
        'rgb(198,219,239)',
        'rgb(158,202,225)',
        'rgb(107,174,214)',
        'rgb(66,146,198)',
        'rgb(33,113,181)',
        'rgb(8,81,156)',
        'rgb(8,48,107)',
    ],
    reds: [
        'rgb(255,245,240)',
        'rgb(254,224,210)',
        'rgb(252,187,161)',
        'rgb(252,146,114)',
        'rgb(251,106,74)',
        'rgb(239,59,44)',
        'rgb(203,24,29)',
        'rgb(165,15,21)',
        'rgb(103,0,13)',
    ],
    greens: [
        'rgb(247,252,245)',
        'rgb(229,245,224)',
        'rgb(199,233,192)',
        'rgb(161,217,155)',
        'rgb(116,196,118)',
        'rgb(65,171,93)',
        'rgb(35,139,69)',
        'rgb(0,109,44)',
        'rgb(0,68,27)',
    ],
    spectral: [
        'rgb(158,1,66)',
        'rgb(213,62,79)',
        'rgb(244,109,67)',
        'rgb(253,174,97)',
        'rgb(254,224,139)',
        'rgb(255,255,191)',
        'rgb(230,245,152)',
        'rgb(171,221,164)',
        'rgb(102,194,165)',
        'rgb(50,136,189)',
        'rgb(94,79,162)',
    ],
};

interface FeatureWithProperties {
    properties: Record<string, unknown>;
}

export const generateScaleFunction = (
    features: FeatureWithProperties[],
    property: string,
    colorRamp: string,
    _range: [number, number]
): ((value: number) => number[] | string) => {
    if (!features.length || !property) return () => [0, 0, 0, 0];

    // Extract values for the selected property
    const values = features
        .map((f) => f.properties[property])
        .filter(
            (v): v is number =>
                v !== undefined && v !== null && typeof v === 'number'
        );

    if (!values.length) return () => [0, 0, 0, 0];

    // Calculate min and max
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Create a function that maps a value to a color in the selected color ramp
    return (value: number): number[] | string => {
        if (value === undefined || value === null) return [0, 0, 0, 0];

        const normalizedValue = (value - min) / (max - min) || 0;
        const rampColors = colorRamps[colorRamp] || colorRamps.viridis;
        const index = Math.min(
            Math.floor(normalizedValue * rampColors.length),
            rampColors.length - 1
        );

        return rampColors[index];
    };
};

export const getColorForValue = (
    value: number,
    colorRamp: string,
    range: [number, number] = [0, 100]
): number[] => {
    if (value === undefined || value === null) return [0, 0, 0, 0];

    // Normalize value between 0 and 1 based on range
    const normalizedValue = (value - range[0]) / (range[1] - range[0]);

    // Clamp between 0 and 1
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));

    // Get the color array
    const rampColors = colorRamps[colorRamp] || colorRamps.viridis;

    // Calculate the index in the color array
    const index = Math.min(
        Math.floor(clampedValue * (rampColors.length - 1)),
        rampColors.length - 2
    );

    // Parse the RGB values from the color string
    const color1 = rampColors[index].match(/\d+/g)?.map(Number) || [0, 0, 0];
    const color2 = rampColors[index + 1].match(/\d+/g)?.map(Number) || [
        0, 0, 0,
    ];

    // Calculate the precise position between the two colors
    const t = clampedValue * (rampColors.length - 1) - index;

    // Interpolate between the two colors
    const r = Math.round(color1[0] * (1 - t) + color2[0] * t);
    const g = Math.round(color1[1] * (1 - t) + color2[1] * t);
    const b = Math.round(color1[2] * (1 - t) + color2[2] * t);

    return [r, g, b, 255];
};
