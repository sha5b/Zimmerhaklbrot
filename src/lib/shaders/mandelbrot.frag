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
    vec2 c = uv * zoom + u_offset;
    vec2 z = vec2(0.0);
    float i = 0.0;

    for (int j = 0; j < MAX_ITER; j++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
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
        // Outside the set: the main vibrant coloring
        float i_smooth = i + 1.0 - log(log(length(z))) / log(2.0);
        // Outside the set: sophisticated, evolving sine-wave based color palette
        float t = u_time * 0.1 + u_color_offset;
        vec3 col1 = vec3(0.5, 0.5, 0.5); // Center of color
        vec3 col2 = vec3(0.5, 0.5, 0.5); // Amplitude of color

        // Make frequency and phase evolve over time for a more dynamic palette
        float time_slow = u_time * 0.03;
        vec3 col3 = vec3(1.0, 1.0, 0.9) + 0.2 * sin(time_slow * vec3(1.0, 1.3, 1.5)); // Frequency
        vec3 col4 = vec3(0.0, 0.15, 0.2) + 0.1 * cos(time_slow * vec3(1.2, 1.4, 1.6)); // Phase

        float pal_time = i_smooth * 0.03 + t;
        color = col1 + col2 * cos(6.28318 * (col3 * pal_time + col4));
    }
    gl_FragColor = vec4(color, u_opacity);
}
