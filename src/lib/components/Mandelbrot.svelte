<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { interestingPoints } from '$lib/utils/interestingPoints';
  import mandelbrotVert from '$lib/shaders/mandelbrot.vert?raw';
  import mandelbrotFrag from '$lib/shaders/mandelbrot.frag?raw';
  import asciiFrag from '$lib/shaders/ascii.frag?raw';

  let container: HTMLDivElement;



  onMount(() => {
    if (!container) return;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // Mandelbrot Scene (Pass 1)
    const mandelbrotScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    let activeLayer = 0;
    const cycleDuration = 20; // seconds
    const fadeDuration = 5; // seconds

    function createMandelbrotLayer(startIndex: number) {
        const uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_offset: { value: interestingPoints[startIndex] },
            u_opacity: { value: 1.0 },
            u_color_offset: { value: Math.random() },
            u_rotation: { value: 0.0 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: mandelbrotVert,
            fragmentShader: mandelbrotFrag,
            uniforms: uniforms,
            transparent: true
        });

        const plane = new THREE.Mesh(planeGeometry, material);
        plane.visible = false;
        mandelbrotScene.add(plane);

        return { plane, material, uniforms };
    }

    function setNextInterestingPoint() {
        // This function sets the next point on the layer that is currently *not* active.
        const inactiveLayer = 1 - activeLayer;
        const randomIndex = Math.floor(Math.random() * interestingPoints.length);
        const point = interestingPoints[randomIndex];
        layers[inactiveLayer].uniforms.u_offset.value = point;
        layers[inactiveLayer].uniforms.u_color_offset.value = Math.random();
    }

    // Initialize layers
    const initialIndex = Math.floor(Math.random() * interestingPoints.length);
    const layers = [
        createMandelbrotLayer(initialIndex),
        createMandelbrotLayer(Math.floor(Math.random() * interestingPoints.length))
    ];
    layers[0].plane.visible = true;

    // Create a render target to hold the Mandelbrot texture
    const dpr = Math.min(window.devicePixelRatio, 2);
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth * dpr, window.innerHeight * dpr);

    // ASCII Scene (Pass 2)
    const asciiScene = new THREE.Scene();

    // --- High-Resolution Character Map Generation ---
    // New 'hacker/leet' character set, sorted by visual density
    const charMap = '`.,\':;!|i-_~"^<>()[]{}?r/\*17JczunvjxtfL\CYE52F3Z469APX0$&%#@WMB'.split('').join(' ');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 32; // Increased font size for crisper characters
    const charCount = (charMap.length + 1) / 2;

    canvas.width = charCount * fontSize;
    canvas.height = fontSize;
    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(charMap, canvas.width / 2, canvas.height / 2);

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

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update rotation for all layers
      layers.forEach(layer => {
        layer.uniforms.u_rotation.value = elapsedTime * 0.1;
      });

      const mainLayer = layers[activeLayer];
      const secondaryLayer = layers[1 - activeLayer];

      // Update time for the main layer
      mainLayer.uniforms.u_time.value += delta;

      const cycleTime = mainLayer.uniforms.u_time.value;

      // Check if it's time to start the cross-fade
      if (cycleTime > cycleDuration - fadeDuration && !secondaryLayer.plane.visible) {
          // Start the next layer's animation
          secondaryLayer.plane.visible = true;
          secondaryLayer.uniforms.u_time.value = 0;
          secondaryLayer.uniforms.u_opacity.value = 0;
      }

      // Handle the cross-fade
      if (secondaryLayer.plane.visible) {
          secondaryLayer.uniforms.u_time.value += delta;
          const fadeProgress = (cycleTime - (cycleDuration - fadeDuration)) / fadeDuration;
          mainLayer.uniforms.u_opacity.value = 1.0 - fadeProgress;
          secondaryLayer.uniforms.u_opacity.value = fadeProgress;

          // Check if the fade is complete
          if (fadeProgress >= 1.0) {
              // The fade is complete. Reset the layer that just faded out.
              mainLayer.plane.visible = false;
              mainLayer.uniforms.u_time.value = 0;
              mainLayer.uniforms.u_opacity.value = 1.0; // Reset for its next use

              // Switch to the new active layer.
              activeLayer = 1 - activeLayer;

              // Prepare the now-hidden layer with a new point for the next cycle.
              setNextInterestingPoint();
          }
      }

      // 1. Render Mandelbrot to texture
      renderer.setRenderTarget(renderTarget);
      renderer.render(mandelbrotScene, camera);

      // 2. Render ASCII to screen
      renderer.setRenderTarget(null);
      renderer.render(asciiScene, camera);
    };

    animate();

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(dpr);
      renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
      layers[0].uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
      layers[1].uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
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
