varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;

// The Mandelbrot calculation
float mandelbrot(vec2 c) {
    vec2 z = vec2(0.0, 0.0);
    int n = 0;
    for (int i = 0; i < 200; i++) {
        // The following line will be replaced dynamically
        // DYNAMIC_FORMULA_PLACEHOLDER
        z = z*z + c; // This is a fallback for the placeholder
        if (length(z) > 2.0) {
            n = i;
            break;
        }
    }
    return float(n) / 200.0;
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0; // Center the coordinates
    uv.x *= u_resolution.x / u_resolution.y; // Correct for aspect ratio

    // Initial view parameters
    float zoom = 0.5 + 0.25 * sin(u_time * 0.1); // Slow zoom animation
    vec2 offset = vec2(-0.75, 0.0);

    // Apply zoom and offset
    vec2 c = uv / zoom + offset;

    float m = mandelbrot(c);

    // Coloring
    float r = 0.5 + 0.5 * cos(3.0 + m * 15.0 + u_time * 0.5);
    float g = 0.5 + 0.5 * cos(3.5 + m * 15.0 + u_time * 0.6);
    float b = 0.5 + 0.5 * cos(4.0 + m * 15.0 + u_time * 0.7);

    gl_FragColor = vec4(r, g, b, 1.0);
}
