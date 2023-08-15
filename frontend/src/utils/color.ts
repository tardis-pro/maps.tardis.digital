export function parseColor(color) {
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
export function parseHexColor(color) {
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

export function setOpacity(color, opacity = 127) {
  return [color[0], color[1], color[2], opacity];
}

export function applyOpacity(color, opacity = 127) {
  return [color[0], color[1], color[2], opacity];
}


import * as THREE from "three";

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


export const materialBorderGen = (geom) => {
  const uniforms = {
    diffuse: {
      value: 2
    },
    smoothness: {
      value: 0.1
    },
    color: {
      value: new THREE.Color('skyblue')
    }
  };
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
  gradient.addColorStop(0.1, 'rgba(0,59,111,1)');
  // gradient.addColorStop(0.25, 'rgba(0,59,111,0.5)');
  console.log(geom)
  gradient.addColorStop(1, 'rgba(0,59,111,1)');


  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const shadowTexture = new THREE.CanvasTexture(canvas);
  if (geom) {
    uniforms.lightmap = {
      lightMap: geom.attributes.normal,
      lightMapIntensity: geom.attributes.normal
    }
  }
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: false // Add this if you want transparency
  });
}