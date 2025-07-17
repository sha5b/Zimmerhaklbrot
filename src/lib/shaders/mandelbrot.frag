varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;

uniform vec2 u_offset;
uniform float u_opacity;
uniform float u_color_offset;
const int MAX_ITER = 500;

// Calculate zoom level for dynamic effects
float getZoomLevel() {
    return pow(0.70, u_time);
}

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

    float zoomLevel = getZoomLevel();
    float logZoom = -log(zoomLevel); // Higher values = more zoomed in
    
    vec3 color;
    if (i == 0.0) {
        // Inside the set: dynamic colors based on zoom level
        float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + vUv.x * 10.0);
        
        // Color shifts dramatically with zoom level
        float hue = fract(u_time * 0.05 + u_color_offset + logZoom * 0.1);
        float saturation = 0.6 + 0.3 * sin(logZoom * 0.5);
        float brightness = 0.2 + 0.4 * (1.0 + sin(logZoom * 0.3)) * 0.5;
        
        vec3 base_color = hsv2rgb(vec3(hue, saturation, brightness));
        color = base_color * (0.6 + pulse * 0.4);
    } else {
        // Outside the set: zoom-responsive color palette
        float i_smooth = i + 1.0 - log(log(length(z))) / log(2.0);
        
        // Dynamic color parameters based on zoom
        float t = u_time * 0.1 + u_color_offset;
        float zoom_factor = logZoom * 0.2;
        
        // Color palette shifts with zoom level
        vec3 col1 = vec3(0.5, 0.5, 0.5);
        vec3 col2 = vec3(0.4 + 0.2 * sin(zoom_factor), 0.4 + 0.2 * cos(zoom_factor * 1.3), 0.5);
        
        // Frequency and phase evolve with both time and zoom
        float time_slow = u_time * 0.03;
        vec3 col3 = vec3(1.0 + zoom_factor * 0.5, 1.0 + zoom_factor * 0.7, 0.9 + zoom_factor * 0.3) + 
                   0.2 * sin(time_slow * vec3(1.0, 1.3, 1.5));
        vec3 col4 = vec3(zoom_factor * 0.3, 0.15 + zoom_factor * 0.1, 0.2 + zoom_factor * 0.2) + 
                   0.1 * cos(time_slow * vec3(1.2, 1.4, 1.6));
        
        // More dramatic color changes at higher zoom levels
        float pal_time = i_smooth * (0.03 + zoom_factor * 0.02) + t;
        color = col1 + col2 * cos(6.28318 * (col3 * pal_time + col4));
        
        // Boost saturation and contrast at high zoom levels
        float contrast = 1.0 + zoom_factor * 0.3;
        color = pow(color, vec3(contrast));
    }
    gl_FragColor = vec4(color, u_opacity);
}
