varying vec2 vUv;
uniform sampler2D u_scene;
uniform sampler2D u_char_map;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_fade_progress; // 0.0 = no fade, 1.0 = full fade

const float CHAR_COUNT = 65.0; // Number of characters in our map
const vec2 CHAR_SIZE = vec2(10.0, 16.0); // The size of each character cell on screen

// Pseudo-random function for matrix effects
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float get_brightness(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    // --- Block-level calculations ---
    // Calculate the UV for the top-left of the current character block
    vec2 block_uv = floor(vUv * u_resolution / CHAR_SIZE) * CHAR_SIZE / u_resolution;
    // Sample the scene texture at the center of the block to get its average color and brightness
    vec3 block_color = texture2D(u_scene, block_uv + CHAR_SIZE / u_resolution * 0.5).rgb;
    float brightness = get_brightness(block_color);

    // --- Character selection ---
    // Map the brightness to an index in our 1D character map
    float char_index = floor(brightness * (CHAR_COUNT - 1.0));
    
    // --- Pixel-level calculations ---
    // Calculate the UV coordinate *within* the current character block
    vec2 local_uv = mod(vUv * u_resolution, CHAR_SIZE) / CHAR_SIZE;
    
    // Calculate the UV to sample the correct character from the 1D character map texture
    // We add local_uv.x to move across the character's pixels
    float char_map_u = (char_index + local_uv.x) / CHAR_COUNT;
    vec2 char_uv = vec2(char_map_u, local_uv.y);

    // Sample the character texture to see if this pixel should be drawn
    float char_alpha = texture2D(u_char_map, char_uv).r;

    // Discard pixels that are not part of the character
    if (char_alpha < 0.5) discard;

    // Output the final color, which is the uniform color of the entire block
    gl_FragColor = vec4(block_color, 1.0);
}
