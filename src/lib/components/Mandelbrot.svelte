<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import mandelbrotVert from '$lib/shaders/mandelbrot.vert?raw';
  import mandelbrotFrag from '$lib/shaders/mandelbrot.frag?raw';
  import asciiFrag from '$lib/shaders/ascii.frag?raw';

  let container: HTMLDivElement;



  onMount(() => {
    if (!container) return;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // Mandelbrot Scene (Pass 1)
    const mandelbrotScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const interestingPoints = [
        new THREE.Vector2(-0.743643887037151, 0.131825904205330), // Seahorse Valley
        new THREE.Vector2(-0.16, 1.0405), // A nice spiral
        new THREE.Vector2(0.274, 0.006), // A detailed region
        new THREE.Vector2(-1.749, 0.001), // A minibrot
        new THREE.Vector2(0.42, 0.21) // Another interesting spot
    ];
    const randomPoint = interestingPoints[Math.floor(Math.random() * interestingPoints.length)];

    const mandelbrotUniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_offset: { value: randomPoint }
    };
    const mandelbrotMaterial = new THREE.ShaderMaterial({
      vertexShader: mandelbrotVert,
      fragmentShader: mandelbrotFrag,
      uniforms: mandelbrotUniforms,
    });
    mandelbrotScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mandelbrotMaterial));

    // Create a render target to hold the Mandelbrot texture
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    // ASCII Scene (Pass 2)
    const asciiScene = new THREE.Scene();

    // --- High-Resolution Character Map Generation ---
    const charMap = [
        ' ', '.', ':', '-', '=', '+', '*', '#', '%', '@', '&', '$', 'W', 'M', 'B', 'Q',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
        'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F',
        'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
        'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '(', ')',
        '[', ']', '{', '}', '<', '>', '/', '\\', '|', '_', '"', "'", '`', '~', ',', ';',
        '!', '?', '^', '°', '§', '€', '£', '¥', '©', '®', '™', '±', '÷', '×', '∞', 'µ',
        'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'ν', 'ξ', 'ο', 'π', 'ρ',
        'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ',
        'Ω', '∫', '∮', '∂', '∇', '√', '∛', '∜', '∝', '∑', '∏', '∐', '∔', '∯', '∰', '∱',
        '░', '▒', '▓', '█', '▄', '▀', '■', '□', '▪', '▫', '●', '○', '◆', '◇', '★', '☆',
        '←', '↑', '→', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '↨', '↬', '↭', '↮', '↯', '↰',
        '↱', '↲', '↳', '↴', '↵', '↶', '↷', '↸', '↹', '↺', '↻', '↼', '↽', '↾', '↿', '⇀',
        '⇁', '⇂', '⇃', '⇄', '⇅', '⇆', '⇇', '⇈', '⇉', '⇊', '⇋', '⇌', '⇍', '⇎', '⇏', '⇐',
        '⇑', '⇒', '⇓', '⇔', '⇕', '⇖', '⇗', '⇘', '⇙', '⇚', '⇛', '⇜', '⇝', '⇞', '⇟', '⇠',
        '⇡', '⇢', '⇣', '⇤', '⇥', '⇦', '⇧', '⇨', '⇩', '⇪', '⇫', '⇬', '⇭', '⇮', '⇯', '⇰'
    ].join('');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const charSize = 32; // Higher resolution for each character
    const mapSize = 16;
    canvas.width = charSize * mapSize;
    canvas.height = charSize * mapSize;

    ctx.fillStyle = 'white';
    ctx.font = `${charSize * 0.8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 256; i++) {
        const char = charMap[i] || ' ';
        const x = (i % mapSize) * charSize + charSize / 2;
        const y = Math.floor(i / mapSize) * charSize + charSize / 2;
        ctx.fillText(char, x, y);
    }

    const charMapTexture = new THREE.CanvasTexture(canvas);
    charMapTexture.minFilter = THREE.LinearFilter;
    charMapTexture.magFilter = THREE.LinearFilter;

    const asciiUniforms = {
      u_scene: { value: renderTarget.texture },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_char_map: { value: charMapTexture },
    };
    const asciiMaterial = new THREE.ShaderMaterial({
      vertexShader: mandelbrotVert, // We can reuse the same simple vertex shader
      fragmentShader: asciiFrag,
      uniforms: asciiUniforms,
    });
    asciiScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), asciiMaterial));

    function animate() {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      mandelbrotUniforms.u_time.value = elapsedTime;

      // 1. Render Mandelbrot to texture
      renderer.setRenderTarget(renderTarget);
      renderer.render(mandelbrotScene, camera);

      // 2. Render ASCII effect to screen
      renderer.setRenderTarget(null);
      renderer.render(asciiScene, camera);
    }

    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderTarget.setSize(window.innerWidth, window.innerHeight);
      mandelbrotUniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
      asciiUniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeChild(renderer.domElement);
      }
    };
  });
</script>

<div class="container" bind:this={container} />



<style>
  .container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  
</style>
