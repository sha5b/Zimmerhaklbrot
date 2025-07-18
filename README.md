# Zimmerhaklbrot - A Mandelbrot Set Visualizer

This project is a web-based, animated visualizer for the Mandelbrot set, built with SvelteKit and Three.js. It dynamically explores different "interesting points" of the Mandelbrot set, creating a seamless and colorful journey through its intricate fractal landscapes. The visualization is rendered using custom GLSL shaders for high performance.

## Features

*   **Animated Exploration:** Automatically cycles through a curated list of fascinating locations within the Mandelbrot set.
*   **Smooth Transitions:** Uses fading effects to smoothly transition between different views.
*   **WebGL Shaders:** Leverages custom vertex and fragment shaders for rendering the Mandelbrot set and applying effects.
*   **ASCII Art Mode:** Includes an alternative ASCII art fragment shader for a different visual style.

## Tech Stack

*   **Framework:** [SvelteKit](https://kit.svelte.dev/)
*   **3D Graphics:** [Three.js](https://threejs.org/)
*   **Language:** TypeScript
*   **Shaders:** GLSL

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Development

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev

    # or to open in a new browser tab
    npm run dev -- --open
    ```
    The application will be available at `http://localhost:5173` by default.

## Building for Production

To create a production version of the app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
