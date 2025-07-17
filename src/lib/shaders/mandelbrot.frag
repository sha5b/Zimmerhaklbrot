varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;

uniform vec2 u_offset;
uniform float u_opacity;
uniform float u_color_offset;
const int MAX_ITER = 500;

// HSV to RGB color conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Faster zoom speed
    float zoom = pow(0.70, u_time);
    vec2 c = u_offset + uv * zoom;
    vec2 z = vec2(0.0);

    // Add a time-based perturbation to 'c' to make the fractal 'alive'
    float time_factor = 0.0005 * sin(u_time * 0.3);
    vec2 c_perturbed = c + vec2(time_factor, time_factor);

    float i = 0.0;
    for (int j = 0; j < MAX_ITER; j++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c_perturbed;
        if (dot(z, z) > 16.0) { // Increased escape radius for more detail
            i = float(j);
            break;
        }
    }

    vec3 color;
    if (i == 0.0) {
        // Inside the set: a brighter, pulsating glow
        float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + vUv.x * 10.0);
        vec3 base_color = hsv2rgb(vec3(fract(u_time * 0.05 + u_color_offset), 0.8, 0.3));
        color = base_color * (0.6 + pulse * 0.4);
    } else {
        // Outside the set: zoom-responsive, evolving color palette
        float i_smooth = i + 1.0 - log(log(length(z))) / log(2.0);
        float logZoom = -log(zoom); // Higher values = more zoomed in
        float t = u_time * 0.1 + u_color_offset;
        float zoom_factor = logZoom * 0.2;
        float time_slow = u_time * 0.03;

        // Palette center and amplitude shift with zoom
        vec3 col1 = vec3(0.5, 0.5, 0.5) + 0.2 * sin(zoom_factor + vec3(0.0, 1.0, 2.0));
        vec3 col2 = vec3(0.4 + 0.2 * sin(zoom_factor), 0.4 + 0.2 * cos(zoom_factor * 1.3), 0.5 + 0.2 * sin(zoom_factor * 1.7));

        // Frequency and phase evolve with both time and zoom
        vec3 col3 = vec3(1.0 + zoom_factor * 0.5, 1.0 + zoom_factor * 0.7, 0.9 + zoom_factor * 0.3) + 
                   0.2 * sin(time_slow * vec3(1.0, 1.3, 1.5));
        vec3 col4 = vec3(zoom_factor * 0.3, 0.15 + zoom_factor * 0.1, 0.2 + zoom_factor * 0.2) + 
                   0.1 * cos(time_slow * vec3(1.2, 1.4, 1.6));

        // Palette time also modulated by zoom
        float pal_time = i_smooth * (0.03 + zoom_factor * 0.02) + t;
        color = col1 + col2 * cos(6.28318 * (col3 * pal_time + col4));
    }
    gl_FragColor = vec4(color, u_opacity);
}
