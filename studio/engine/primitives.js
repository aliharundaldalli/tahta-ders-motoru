export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export function random(seed) {
  let a = Number(seed) >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const colorAt = (s, i) => s.palette[((i % s.palette.length) + s.palette.length) % s.palette.length];
export function circle(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.fillStyle = color; ctx.fill(); }
export function ellipse(ctx, x, y, rx, ry, rotation, color) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rotation, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
export function line(ctx, points, color, width = 2, progress = 1) {
  if (points.length < 2 || progress <= 0) return;
  const last = clamp(progress) * (points.length - 1), n = Math.floor(last);
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (let i = 1; i <= n; i++) ctx.lineTo(...points[i]);
  if (n < points.length - 1) ctx.lineTo(lerp(points[n][0], points[n + 1][0], last - n), lerp(points[n][1], points[n + 1][1], last - n));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
export function polygon(ctx, points, color) { if (!points.length) return; ctx.beginPath(); ctx.moveTo(...points[0]); points.slice(1).forEach(p => ctx.lineTo(...p)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
export function text(ctx, value, x, y, size, color, align = 'center', weight = 600) {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(value, x, y);
}
export function grain(ctx, seed, amount = 900, alpha = .045) {
  const r = random(seed); ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < amount; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#111111'; ctx.fillRect(r() * 1280, r() * 720, 1 + r() * 2, 1 + r() * 2); }
  ctx.restore();
}
export function wash(ctx, x, y, radius, color, seed, opacity = .07) {
  const r = random(seed); ctx.save(); ctx.fillStyle = color;
  for (let k = 0; k < 8; k++) {
    ctx.globalAlpha = opacity; const pts = [];
    for (let j = 0; j < 42; j++) { const a = j / 42 * TAU, rr = radius * (.8 + r() * .36); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .78]); }
    polygon(ctx, pts, color);
  }
  ctx.restore();
}
export function flowerPath(cx, cy, radius, count = 5) {
  return Array.from({ length: 241 }, (_, i) => { const a = i / 240 * TAU, r = radius * (.55 + .45 * Math.cos(count * a)); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
}
