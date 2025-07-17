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
        new THREE.Vector2(-0.743643887037151, 0.131825904205330),   // 1. Seahorse Valley
        new THREE.Vector2(-0.160, 1.0405),                          // 2. Main Spiral
        new THREE.Vector2(0.274, 0.006),                            // 3. Triple Island
        new THREE.Vector2(-1.749, 0.001),                           // 4. Minibrot Sanctuary
        new THREE.Vector2(0.42, 0.21),                              // 5. Nebula Cluster
        new THREE.Vector2(-0.75, 0.11),                             // 6. Triple Spiral Valley
        new THREE.Vector2(-1.25066, 0.3775),                        // 7. Celestial Spiral
        new THREE.Vector2(0.282, 0.53),                             // 8. Antennae Spire
        new THREE.Vector2(-0.4, 0.6),                               // 9. Elephant Valley
        new THREE.Vector2(-1.77, 0.0),                              // 10. Secondary Minibrot
        new THREE.Vector2(-0.158, -1.034),                         // 11. Mirrored Abyss
        new THREE.Vector2(0.355, 0.355),                            // 12. Quad-Spiral Galaxy
        new THREE.Vector2(-0.77568377, 0.13646737),                 // 13. Deep Seahorse
        new THREE.Vector2(-0.745428, 0.113009),                     // 14. Classic Minibrot
        new THREE.Vector2(0.275, 0.48),                             // 15. Starfish Cavern
        new THREE.Vector2(-0.743643887037151, 0.131825904205330),   // 16. Seahorse Valley (Classic)
        new THREE.Vector2(-0.8, 0.156),                             // 17. Mandelbrot's Heart
        new THREE.Vector2(0.285, 0.01),                             // 18. The Main Island
        new THREE.Vector2(-1.401155, 1.79e-8),                      // 19. The Needle
        new THREE.Vector2(-0.1528, 1.0397),                         // 20. The Scepter
        new THREE.Vector2(0.34, -0.05),                             // 21. Southern Island
        new THREE.Vector2(-0.748, 0.099),                           // 22. Seahorse Tail
        new THREE.Vector2(-1.11, 0.22),                             // 23. Spiral Antenna
        new THREE.Vector2(0.45, 0.1428),                            // 24. Eastern Swirl
        new THREE.Vector2(-0.59, -0.66),                            // 25. Lower Mini-Mandel
        new THREE.Vector2(-1.78, 0.0001),                           // 26. Far West Minibrot
        new THREE.Vector2(0.38, 0.32),                              // 27. Quad-Spiral
        new THREE.Vector2(-0.73, -0.41),                            // 28. Southern Seahorse
        new THREE.Vector2(0.0, 0.65),                               // 29. North Star
        new THREE.Vector2(-1.94, 0.0),                              // 30. Ghost of Mandelbrot
        new THREE.Vector2(-0.743643887037151, 0.131825904205330),   // 31. Deep Dive Seahorse
        new THREE.Vector2(-0.160, 1.0405),                          // 32. Another Spiral
        new THREE.Vector2(0.274, 0.006),                            // 33. Island Chain
        new THREE.Vector2(-1.749, 0.001),                           // 34. Tinybrot
        new THREE.Vector2(0.42, 0.21),                              // 35. Star Cluster
        new THREE.Vector2(-0.75, 0.11),                             // 36. Another Triple Spiral
        new THREE.Vector2(-1.25066, 0.3775),                        // 37. Another Celestial Spiral
        new THREE.Vector2(0.282, 0.53),                             // 38. Another Antennae
        new THREE.Vector2(-0.4, 0.6),                               // 39. Another Elephant Valley
        new THREE.Vector2(-1.77, 0.0),                              // 40. Another Secondary Minibrot
        new THREE.Vector2(-0.158, -1.034),                         // 41. Another Mirrored Abyss
        new THREE.Vector2(0.355, 0.355),                            // 42. Another Quad-Spiral Galaxy
        new THREE.Vector2(-0.77568377, 0.13646737),                 // 43. Another Deep Seahorse
        new THREE.Vector2(-0.745428, 0.113009),                     // 44. Another Classic Minibrot
        new THREE.Vector2(0.275, 0.48)                              // 45. Another Starfish Cavern
    ];
    let activeLayer = 0;
    const cycleDuration = 20; // seconds
    const fadeDuration = 5; // seconds

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

    function setNextInterestingPoint() {
        const randomIndex = Math.floor(Math.random() * interestingPoints.length);
        const point = interestingPoints[randomIndex];
        layers[activeLayer].uniforms.u_offset.value = point;
        layers[activeLayer].uniforms.u_color_offset.value = Math.random();
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
              // Switch active layer
              mainLayer.plane.visible = false;
              mainLayer.uniforms.u_time.value = 0;
              mainLayer.uniforms.u_opacity.value = 1.0;
              // Get a new point for the now-hidden layer
              // This creates the "seamless" illusion by making the new location a minibrot of the old one.
              const nextPointIndex = Math.floor(Math.random() * interestingPoints.length);
              mainLayer.uniforms.u_offset.value = interestingPoints[nextPointIndex];
              mainLayer.uniforms.u_color_offset.value = Math.random();

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
