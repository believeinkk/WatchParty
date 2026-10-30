"use client";

import { useEffect, useRef } from 'react';

export default function TubesBackground({ children }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let app = null;

    const initTubes = async () => {
      try {
        const tubesModule = await import(
          /* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js'
        );
        const TubesCursor = tubesModule.default;
        if (canvasRef.current) {
          app = TubesCursor(canvasRef.current, {
            tubes: {
              colors: ['#f967fb', '#e50914', '#53bc28'],
              lights: {
                intensity: 200,
                colors: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
              },
            },
          });
        }
      } catch (err) {
        console.error('Failed to load TubesCursor:', err);
      }
    };

    initTubes();

    const handleClick = () => {
      if (!app?.tubes) return;
      const randomColors = (count) =>
        new Array(count)
          .fill(0)
          .map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

      app.tubes.setColors(randomColors(3));
      app.tubes.setLightsColors(randomColors(4));
    };

    const handleResize = () => {
      if (app?.three?.resize) {
        app.three.resize();
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (app?.dispose) {
        app.dispose();
      } else if (app?.destroy) {
        app.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed Fullscreen 3D Canvas Background — Persists across all pages */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-100/40 dark:bg-zinc-950 transition-colors duration-300">
        <canvas
          ref={canvasRef}
          id="canvas"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        {/* Subtle Ambient Radial Vignette for Visual Depth */}
        <div className="absolute inset-0 bg-radial-[at_center] from-transparent via-zinc-950/20 to-zinc-950/80 pointer-events-none" />
      </div>
      <div className="relative z-10 w-full min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
