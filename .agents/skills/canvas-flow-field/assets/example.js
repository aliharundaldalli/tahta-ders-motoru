import { renderScene, defaultScene } from '../../../../studio/engine/render.js';

// Call with a canvas obtained in the host page. No external images or libraries.
export function createExample(canvas) {
  const scene = defaultScene('flow-field');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  return { scene, render: seconds => renderScene(ctx, seconds, scene) };
}
