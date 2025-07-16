varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;

const int MAX_ITER = 500;

// Smooth coloring function
vec3 color(float i, vec2 z) {
    float i_smooth = i + 1.0 - log(log(length(z))) / log(2.0);
    vec3 c1 = vec3(0.0, 0.1, 0.2);
    vec3 c2 = vec3(0.5, 0.3, 0.8);
    vec3 c3 = vec3(0.9, 0.7, 0.3);
    vec3 c4 = vec3(1.0, 1.0, 1.0);

    float t = i_smooth / float(MAX_ITER);

    vec3 color = mix(c1, c2, t);
    color = mix(color, c3, pow(t, 2.0));
    color = mix(color, c4, pow(t, 4.0));

    // Add some psychedelic pulsing
    color += 0.1 * sin(t * 20.0 + u_time * 2.0);

    return color;
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Continuous zoom into a specific, interesting point
    float zoom = pow(0.75, u_time);
    vec2 offset = vec2(-0.745428, 0.113009);

    vec2 c = uv * zoom + offset;
    vec2 z = vec2(0.0);
    float i = 0.0;

    for (int j = 0; j < MAX_ITER; j++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 4.0) {
            i = float(j);
            break;
        }
    }

    if (i == 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Inside the set
    } else {
        gl_FragColor = vec4(color(i, z), 1.0);
    }
}
