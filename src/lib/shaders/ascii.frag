varying vec2 vUv;
uniform sampler2D u_scene;
uniform sampler2D u_char_map;
uniform vec2 u_resolution;

const float CHAR_MAP_SIZE = 16.0; // 16x16 grid of characters
const vec2 CHAR_SIZE = vec2(10.0, 16.0); // Pixel dimensions of each character

float get_brightness(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    // Get the color and brightness of the corresponding block in the original scene
    vec3 scene_color = texture2D(u_scene, vUv).rgb;
    float brightness = get_brightness(scene_color);

    // Determine which character to use from the map based on brightness
    float char_index = floor(brightness * (CHAR_MAP_SIZE * CHAR_MAP_SIZE - 1.0));

    // Calculate the column and row of the character in the map
    float char_col = mod(char_index, CHAR_MAP_SIZE);
    float char_row = floor(char_index / CHAR_MAP_SIZE);

    // Calculate the UV coordinates for the top-left corner of the selected character
    vec2 char_uv = vec2(char_col / CHAR_MAP_SIZE, char_row / CHAR_MAP_SIZE);

    // Calculate the UV coordinates within the current character cell on the screen
    vec2 local_uv = mod(vUv * u_resolution, CHAR_SIZE) / CHAR_SIZE;

    // Scale the local UVs to match the size of a single character in the texture map
    local_uv /= CHAR_MAP_SIZE;

    // Combine the character's map position with the local pixel position
    vec2 final_uv = char_uv + local_uv;

    // Sample the character map to get the character's pixel value (alpha)
    float char_alpha = texture2D(u_char_map, final_uv).r;

    // Final color is the original scene color multiplied by the character's alpha
    gl_FragColor = vec4(scene_color * char_alpha, 1.0);
}
