<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import mandelbrotVert from '$lib/shaders/mandelbrot.vert?raw';
  import mandelbrotFrag from '$lib/shaders/mandelbrot.frag?raw';
  import asciiFrag from '$lib/shaders/ascii.frag?raw';

  let container: HTMLDivElement;
  let formula = 'z*z + c'; // Default formula
  let mandelbrotMaterial: THREE.ShaderMaterial;

  // A simple (and unsafe) parser to convert formula to GLSL
  function updateFormula() {
    if (mandelbrotMaterial) {
        mandelbrotMaterial.fragmentShader = mandelbrotFrag.replace('// DYNAMIC_FORMULA_PLACEHOLDER', formulaToGlsl(formula));
        mandelbrotMaterial.needsUpdate = true;
    }
  }

  function formulaToGlsl(f: string): string {
    // WARNING: This is not a safe parser. It's for demonstration only.
    // A real application would need a proper parsing library.
    if (f.trim() === 'z*z + c') {
      return `
        vec2 new_z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
        z = new_z + c;
      `;
    }
    if (f.trim() === 'z*z*z + c') {
        // cpow(z, 3) + c
        return `
        float r = length(z);
        float angle = atan(z.y, z.x);
        float new_r = pow(r, 3.0);
        vec2 new_z = new_r * vec2(cos(3.0 * angle), sin(3.0 * angle));
        z = new_z + c;
        `;
    }
    // Add more formulas here...
    return `
        vec2 new_z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
        z = new_z + c;
      `; // Fallback to default
  }


  onMount(() => {
    if (!container) return;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // Mandelbrot Scene (Pass 1)
    const mandelbrotScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mandelbrotUniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };
    mandelbrotMaterial = new THREE.ShaderMaterial({
      vertexShader: mandelbrotVert,
      fragmentShader: mandelbrotFrag.replace('// DYNAMIC_FORMULA_PLACEHOLDER', formulaToGlsl(formula)),
      uniforms: mandelbrotUniforms,
    });


    mandelbrotScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mandelbrotMaterial));

    // Create a render target to hold the Mandelbrot texture
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    // ASCII Scene (Pass 2)
    const asciiScene = new THREE.Scene();

    // Create character map texture
    const charMap = ' .:-=+*#%@';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 24;
    ctx.fillStyle = 'white';
    ctx.font = '24px monospace';
    ctx.fillText(charMap, 0, 20);
    const charMapTexture = new THREE.CanvasTexture(canvas);
    charMapTexture.minFilter = THREE.NearestFilter;
    charMapTexture.magFilter = THREE.NearestFilter;

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

<div class="input-container">
  <input type="text" bind:value={formula} on:change={updateFormula} placeholder="e.g., z*z + c" />
</div>

<style>
  .container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .input-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
  }

  input {
    background-color: rgba(20, 20, 20, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #eee;
    font-family: 'Courier New', Courier, monospace;
    padding: 10px 15px;
    border-radius: 5px;
    text-align: center;
    font-size: 1.2em;
    outline: none;
    transition: all 0.2s ease;
  }

  input:focus {
    border-color: rgba(255, 255, 255, 0.7);
    background-color: rgba(0, 0, 0, 0.8);
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
</style>
