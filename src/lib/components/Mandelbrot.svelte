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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // Mandelbrot Scene (Pass 1)
    const mandelbrotScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const interestingPoints = [
        new THREE.Vector2(-0.743643887037151, 0.131825904205330),   // Main Seahorse Valley
        new THREE.Vector2(-0.160, 1.0405),                          // Spiral region
        new THREE.Vector2(0.274, 0.006),                            // Detailed island
        new THREE.Vector2(-1.749, 0.001),                           // Minibrot
        new THREE.Vector2(0.42, 0.21),                              // Another interesting spot
        new THREE.Vector2(-0.75, 0.11),                             // Triple spiral valley
        new THREE.Vector2(-1.25066, 0.3775),                        // A beautiful spiral
        new THREE.Vector2(0.282, 0.53),                             // Antennae-like structures
        new THREE.Vector2(-0.4, 0.6),                               // Elephant valley
        new THREE.Vector2(-1.77, 0.0),                              // Another minibrot
        new THREE.Vector2(-0.158, -1.034),                         // Mirrored spiral
        new THREE.Vector2(0.355, 0.355),                            // Quad-spiral
        new THREE.Vector2(-0.77568377, 0.13646737),                 // Deep seahorse
        new THREE.Vector2(-0.745428, 0.113009),                     // Original interesting point
        new THREE.Vector2(0.275, 0.48)                              // Star-like feature
    ];
    let activeLayer = 0;
    const cycleDuration = 20; // seconds
    const fadeDuration = 1.5; // seconds - much shorter for less visible fade
    let currentPointIndex = Math.floor(Math.random() * interestingPoints.length);
    let skipAttempts = 0;
    const maxSkipAttempts = 3;
    
    // Function to detect if we're zooming into a boring/black region
    function isBoringRegion(point: THREE.Vector2, zoomLevel: number): boolean {
        // Simple heuristic: check if point is too close to main bulb center
        const mainBulbDistance = point.distanceTo(new THREE.Vector2(-0.5, 0.0));
        const miniBulbDistance = point.distanceTo(new THREE.Vector2(-1.0, 0.0));
        
        // At high zoom levels, avoid points too close to main features
        if (zoomLevel < 0.001) {
            return mainBulbDistance < 0.1 || miniBulbDistance < 0.05;
        }
        
        return false;
    }

    function createMandelbrotLayer(startIndex: number) {
        const uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_offset: { value: interestingPoints[startIndex] },
            u_opacity: { value: 1.0 },
            u_color_offset: { value: Math.random() }
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

    function getNextPointIndex(currentIndex: number) {
        return (currentIndex + 1) % interestingPoints.length;
    }

    // Initialize layers with random starting points
    const layers = [
        createMandelbrotLayer(currentPointIndex),
        createMandelbrotLayer(getNextPointIndex(currentPointIndex))
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
      const mainLayer = layers[activeLayer];
      const secondaryLayer = layers[1 - activeLayer];

      // Update time for the main layer
      mainLayer.uniforms.u_time.value += delta;

      const cycleTime = mainLayer.uniforms.u_time.value;
      const currentZoom = Math.pow(0.70, cycleTime);
      
      // Check if current region is boring and skip if needed
      if (cycleTime > 5.0 && skipAttempts < maxSkipAttempts) {
          const currentPoint = mainLayer.uniforms.u_offset.value;
          if (isBoringRegion(currentPoint, currentZoom)) {
              // Skip to next point immediately
              currentPointIndex = getNextPointIndex(currentPointIndex);
              mainLayer.uniforms.u_offset.value = interestingPoints[currentPointIndex].clone();
              mainLayer.uniforms.u_time.value = 0;
              mainLayer.uniforms.u_color_offset.value = Math.random();
              skipAttempts++;
              return; // Skip this frame
          }
      }

      // Check if it's time to start the cross-fade
      if (cycleTime > cycleDuration - fadeDuration && !secondaryLayer.plane.visible) {
          // Start the next layer's animation
          secondaryLayer.plane.visible = true;
          secondaryLayer.uniforms.u_time.value = 0;
          secondaryLayer.uniforms.u_opacity.value = 0;
      }

      // Handle the new background fade-in approach
      if (secondaryLayer.plane.visible) {
          secondaryLayer.uniforms.u_time.value += delta;
          const fadeProgress = (cycleTime - (cycleDuration - fadeDuration)) / fadeDuration;

          // New behavior: mainLayer stays fully opaque, fade in secondaryLayer underneath
          mainLayer.uniforms.u_opacity.value = 1.0;
          secondaryLayer.uniforms.u_opacity.value = fadeProgress;

          // Check if the fade is complete
          if (fadeProgress >= 1.0) {
              // Switch active layer
              mainLayer.plane.visible = false;
              mainLayer.uniforms.u_time.value = 0;
              mainLayer.uniforms.u_opacity.value = 1.0;

              // Prepare the now-background layer for the next transition
              currentPointIndex = getNextPointIndex(currentPointIndex);
              const nextPointIndex = getNextPointIndex(currentPointIndex);

              // Ensure we're not picking a boring region
              let attempts = 0;
              let targetPoint = interestingPoints[nextPointIndex];
              while (attempts < 5 && isBoringRegion(targetPoint, 1.0)) {
                  currentPointIndex = getNextPointIndex(currentPointIndex);
                  targetPoint = interestingPoints[getNextPointIndex(currentPointIndex)];
                  attempts++;
              }

              // Set the hidden (background) layer to fly to the next interesting point
              mainLayer.uniforms.u_offset.value = targetPoint.clone();
              mainLayer.uniforms.u_color_offset.value = Math.random();

              skipAttempts = 0; // Reset skip attempts for new cycle

              activeLayer = 1 - activeLayer;
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
