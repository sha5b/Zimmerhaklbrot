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
        // Inside the set: a dark, shimmering version of the current palette
        float hue = fract(u_time * 0.02);
        color = hsv2rgb(vec3(hue, 0.8, 0.15));
    } else {
        // Outside the set: the main vibrant coloring
        float i_smooth = i + 1.0 - log(log(length(z))) / log(2.0);
        float hue = fract(i_smooth * 0.015 + u_time * 0.02 + u_color_offset);
        float saturation = 0.9;
        float value = 0.9;
        color = hsv2rgb(vec3(hue, saturation, value));
    }
    gl_FragColor = vec4(color, u_opacity);
}
