/**
 * Handles WebGL initialization and checks for WebGL2 support
 * @param gl WebGL rendering context
 */
export const initializeWebGL = (gl: WebGLRenderingContext) => {
    // Check if WebGL2 is supported
    const isWebGL2 = gl.getParameter(gl.VERSION).indexOf('WebGL 2.0') >= 0;

    if (!isWebGL2) {
        console.warn('GPU aggregation is not supported in this browser');
    }
};
