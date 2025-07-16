varying vec2 vUv;
uniform sampler2D u_scene;
uniform sampler2D u_char_map;
uniform vec2 u_resolution;

// ASCII characters sorted by visual density
const float char_map_width = 10.0; // Number of characters in the map

float getBrightness(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    // Define the size of our 'character' blocks
    vec2 characterSize = vec2(8.0, 12.0);

    // --- Block-level calculations ---
    // Calculate the UV for the top-left of the current character block
    vec2 blockUv = floor(vUv * u_resolution / characterSize) * characterSize / u_resolution;
    // Sample the scene texture at the center of the block to get its average color/brightness
    vec3 blockColor = texture2D(u_scene, blockUv + characterSize / u_resolution * 0.5).rgb;
    float brightness = getBrightness(blockColor);

    // --- Character selection ---
    // Map the brightness to an index in our character map
    float charIndex = floor(brightness * (char_map_width - 1.0));
    // Calculate the UV to sample the correct character from the character map texture
    vec2 charMapUv = vec2(charIndex / char_map_width, 0.0);

    // --- Pixel-level calculations ---
    // Calculate the UV coordinate *within* the current character block
    vec2 localUv = mod(vUv * u_resolution, characterSize) / characterSize;
    // Correct for aspect ratio of characters in the font map
    localUv.x /= char_map_width;
    // Combine the character's position in the map with the pixel's local position
    vec2 finalCharUv = charMapUv + localUv;

    // Sample the character texture
    float charPixel = texture2D(u_char_map, finalCharUv).r;

    // Output the final color, tinted by the original scene color
    gl_FragColor = vec4(charPixel * blockColor, 1.0);
}
