# Motor referansı (engine reference)

"Tahtada yazan öğretmen, ama dijital kusursuz senkron." 1920x1080, 30 fps. **Every frame is a pure function of time `t`**
(`window.__render(t)`): browser preview (play/scrub) and the frame-by-frame renderer run exactly the same code.
No audio/TTS is generated here; narration is only represented by word timings (`timing/words.json`).

## Quick start
```
npm install                          # mathjax-full, puppeteer-core, @fontsource/kalam (fonts are already copied to assets/fonts)
node tools/estimate_words.mjs        # timing/words.json from docs/NARRATION.md (ESTIMATE, ~2.3 words/s)
node tools/build_math.mjs            # math_cache.js  (every $tex$ / `tex:` found in lesson*.js, pre-rendered by MathJax)
open index.html                      # preview (file://, no server). ?subs=1 subtitles, ?debug, ?lesson=lesson_gallery
node tools/shots.mjs --seg=s02:3.2,14 --out=output/qa     # PNG stills (also: absolute times, --subs, --debug, --lesson=...)
node tools/export_sfx.mjs            # output/sfx.wav + output/timeline.json (+events.json)
node tools/render_video.mjs output/video.mp4 [audio.wav] [--from=s --to=s] [--subs]
node tools/determinism.mjs [lesson]  # sequential vs shuffled (scrub) render must be pixel-identical
```
Re-run `build_math.mjs` whenever a new TeX string appears in a lesson file (a missing one throws "math cache miss" in the page).
Preview keys: Space play/pause, ←/→ ±2 s (Shift ±10), `[` `]` previous/next segment, C subtitles, D debug, M sfx on/off, H hide panel, F fullscreen.
Debug (D) lists, for the current segment, each `cue` phrase, the narration time it asked for (`+seg-local`) and when the item really starts,
plus the current words with their timings, and any warnings ("late by 1.2s (queued behind previous writing)").

## Files
```
index.html, style.css        stage (1920x1080 scaled to window), preview panel (hidden with ?render)
lesson_full.js + lesson_parts/A.js   the lesson (example: Ardışık İntegraller, segments a00–a19)
src/util.js                  constants (LAY margins, COL palette), SVG helpers, easing, seeded rng, norm() for cue matching
src/text.js                  Rich node: Turkish prose wipe + MathJax glyph handwriting, nib, token boxes; mathGroup()
src/graph.js                 3D surface renderer (painter's sort), 2D graph, layers: point / curve / plane
src/board.js                 node factory (templates), containers, annotations, cue->time resolution, page layout/scroll/flip, camera, render(t)
src/sfx.js                   deterministic SFX synth (pure JS; used by preview and by export_sfx)
src/main.js                  boot, board texture, subtitles, debug overlay, preview controls, window.__render/__total/__segs/__events
tools/                       build_math, estimate_words, pack_words, words_from_alignment, shots, render_video, export_sfx, final_mix.sh, determinism
timing/words.json|.js        word timings  {segId:{duration, words:[{w,start,end}]}}  (.js is the same data wrapped for file://)
math_cache.js                generated: window.MATH = { tex: {w, asc, desc, g:[{d,c,len,x0,x1}]} }   (1000 units = 1 em, baseline y=0)
assets/fonts                 Kalam 400/700, latin + latin-ext woff2 (ç ğ ı İ ö ş ü verified); no network at runtime
```

## Look
Board `#1d2420` + seeded grain/blotches + vignette (CSS background), ink `#f1ead8`, amber `#f2b440` (key variable/point), mint `#6fd3b0`
(result/conclusion), coral `#ef7a63` (warning/NOT), grey `#a9a596` (secondary), marker highlight = translucent yellow swipe.
Prose: Kalam 48 px (titles 68 px bold, labels 44 px bold). Math: 58 px equivalent (`msize`, default 1.2 x text size).
Margins 110 px left/right, 80 px top; **bottom 130 px is never used** (`LAY.bottom = 950`); `?subs=1` fills that band with narration subtitles.
Text never shrinks: if an item does not fit, the board scrolls up (0.8 s eased, top 70 px fades) or flips to a new page (`overflow:'page'`).

## Lesson format (lesson_parts/A.js)
```js
const LESSON = {
  pad: { pre: .5, post: .9 },         // silence before/after each narration segment (s)
  overflow: 'scroll',                  // 'scroll' | 'page'
  mathExtra: ['x^2'],                  // optional: extra TeX to pre-render
  scenes: [ { seg: 's02', items: [ ITEM, ITEM, ... ] }, ... ]   // scenes are played in order; a seg may appear in several scenes
};
```
**Common item fields** — timing: `cue` (Turkish phrase from the spoken text), `nth` (nth occurrence), `cueEnd:true` (use end of phrase),
`off` (s, added to the cue time), `at` (seconds from segment audio start), `gap` (s after previous item, default .25), `overlap:true`
(allow writing simultaneously with the previous writing), `id` (name for highlight/annotation targets), `mt` (extra top margin), `pos:[x,y]`
(inside a container: absolute, not part of the flow).
Strings use `$tex$` for inline math and `<amber>…</amber>`, `<mint>`, `<coral>`, `<grey>` for colored prose. TeX macros: `\amber{..} \mint{..} \coral{..} \grey{..}`, `\R`, `\grad`.
Do not put Turkish letters inside TeX; put prose outside `$…$`.

| type | fields | notes |
|---|---|---|
| `text` | `text`, `size`(48) `msize` `color` `weight` `align`(left) `indent` `dur` `cps`(16) | prose + inline math, word-wrapped to the available width; written left→right with nib |
| `math` | `tex`, same as text, `align`(center) | one display equation. glyphs drawn in x-order, ~0.09 s/glyph, clamp 0.6–2.5 s (`dur` overrides) |
| `title` | `text`, `sub` | 68 px bold centered + amber underline stroke + grey subtitle |
| `definition` | `label`('Tanım'), `items` | amber label + amber left rule, children flow below |
| `theorem` | `n` or `label`, `hyp:[items]`, `concl:[items]` | bordered box (border is drawn), "TEOREM n" label on the border; conclusion items default mint |
| `note` | `label`('NOT'), `items` | coral-edged tinted box |
| `steps` / `col` | `items`, `gap` | plain vertical stack (solution lines written one by one) |
| `row` | `items`, `gap` | equal-width columns (children are usually `col`s) |
| `graph3d` | `surface`('bumps','saddle','cone','dome','bowl') or `fn`,`x:[a,b]`,`y:[c,d]`,`z:[lo,hi]`,`polar:R`; `w`,`h`(520), `build`(1.6 s), `az`(−34) `el`(24) `zs`(.72) `rotate`(deg/s, 0) `mesh` `axes:false` `pad:[t,r,b,l]` `fitPts` `layers:[…]` `labels:[…]` | SVG painter's-sort surface, smooth teal-blue shading, corner axes triad |
| `graph2d` | `x`,`y` ranges, `layers` | axes + curve/point layers (`curve` needs `pts:s=>[x,y]`) |
| `highlight` | `target`(id, default = previous item), `tokens:[i,j]`, `color`('#ffd84a'), `alpha`(.4), `dur` | marker swipe *under* the text; tokens = word/math indices in reading order |
| `circle` `underline` `arrow` | `target`, `tokens`, `color`, `w`; arrow: `from:'left'|'right'|'up'|'down'`, `len`, `text` | hand-drawn strokes |
| `page` / `clear` | – | page flip (slide + sound) / fade-wipe; new items start at the top |
| `camera` | `zoom`, `x`, `y` (focus point in px), `dur`(1.2) | eased zoom/pan of the whole board; `zoom:1,x:960,y:540` resets. Static by default |
| `space` | `h` | vertical gap |

**graph layers** (`layers`, each has the common timing fields; by default they start after the build):
`{kind:'point', p:[x,y(,z)], label:'$P$', color, dx, dy, r, arrow}` · `{kind:'curve', along:'x'|'y', fix:c, color, w}` or `{kind:'curve', pts:s=>[x,y,z?]}` ·
`{kind:'plane', z:c | x:c | y:c, ext:[x0,x1,y0,y1], color:'plane', alpha}`. `z` is taken from the surface when omitted. `labels` are `text` items with `pos` relative to the graph block.
Note: `at`/`fix`/`p` are different keys on purpose (`at` is always time). Layers/curves are drawn on top (no occlusion test).

## Timing and cues
* Segments play sequentially: segment *k* audio starts at `Σ(previous pre+duration+post) + pre`. `duration` comes from `timing/words.json`
  (estimate now, real audio later). All times printed by the tools (`timeline.json → segments[].audioStart`) are where each narration file must be placed.
* A cue phrase is normalised (lower case, Turkish diacritics folded, punctuation removed: `D'deki` → `ddeki`) and matched against consecutive
  words of that segment; a word also matches if one side starts with the other (≥5 chars: `maksimum` ~ `maksimuma`). Result = word start.
* Items are **queued**: an item never starts writing before the previous writing finished (+0.08 s); if the cue is earlier the item is late and a
  warning ("late by …") appears in the debug panel/console — shorten the earlier item (`dur`), or give it `overlap:true`. Highlights/annotations never queue.
* No cue → `at` → else right after the previous item (`gap`). A cue that cannot be found is reported and falls back to "after previous".
* Real timings: `node tools/words_from_alignment.mjs s02=align_s02.json …` (ElevenLabs character alignment → words.json), or write words.json yourself
  (same shape), then `node tools/pack_words.mjs`. Cues keep working because they only reference words.

## SFX
`src/sfx.js` synthesizes from the same event list the visuals produce (`window.__events`): chalk/pen scratch only while an item is being written
(length = write duration, seeded noise, 8–14 Hz stroke pulses), marker squeak for highlights, page flip / scroll swish, soft draw swish for graph builds,
tiny tick for points. Levels: scratch peak ≈ −20 dBFS, flip ≈ −16 dBFS (whole track peak −16, RMS ≈ −39 dBFS) → sits well under speech.
`export_sfx.mjs` writes `output/sfx.wav`; `final_mix.sh` mixes `assets/narration.wav` + sfx (narration reference 0 dB; `SFX_DB` offsets).

## Determinism / rendering notes
All randomness is seeded (`rng`, `hstr`); texture is generated from a seeded RNG. The renderer launches Chrome with `--disable-gpu --num-raster-threads=1`
because multi-threaded raster of the 5k-path surface meshes jitters by a few pixels between runs; with these flags the same sequential render is reproducible; `tools/determinism.mjs` (scrub order vs sequential order) still finds up to ~180 edge pixels (0.01 %) that differ by ≤ 21 levels on frames after a mesh build — invisible, and irrelevant for the sequential video render.
Render speed ≈ 14 fps (≈ 3x slower than real time at 30 fps for heavy graph pages).

## QA stills
`output/qa/` — `t_001.80` (label being written, nib), `t_003.70`, `t_014.10` (math line mid-write), `t_023.10` (value being written), `t_030.30`
(s02 complete with 2 marker highlights), `t_032.65` (page flip: old page fading), `t_035.45`/`t_044.15` (Teorem 2 border/lines mid-write), `t_059.15` (theorem
complete + highlight), `t_068.56`/`t_071.26`/`t_084.26`/`t_091.26` (s20: cone, dome build, complete with plane; the last has `--subs`).


## Yeni 3B motor (2026-10): birleşik derinlik sıralaması, kolonlar, hücreler, dilimler

node tools/render_video.mjs output/video.mp4 [audio.wav] [--from=s --to=s] [--subs] [--lesson=lesson_parts/DEMO] [--words=x.js] [--fps=30]
src/graph.js                 classic 3D surface renderer (painter's sort), 2D graph, layers: point / curve / plane / box
src/graph3u.js               unified-depth 3D graph: surfaces + solids + columns + wedges + slices in one sorted face list, camera orbit
`--words=path/to/words.js` (shots, warnings, render_video) loads another word-timing file, e.g. `--words=../ders-kutupsal/timing/words.js`
to check `lesson_full` while this project's `timing/` is still empty. `lesson_parts/DEMO.js` is a narration-free demo of the 3D layers below
(it defines its own segment durations, items use `at`): `node tools/shots.mjs 9 19 33 --lesson=lesson_parts/DEMO --out=output/demo`.

## Unified 3D (src/graph3u.js)
A `graph3d` switches to the unified renderer **automatically** when it uses a layer kind `cols`, `wedge`, `solid`, `slices`, `orbit` or `pulse`,
or has `orbit` / `unified:true`. Otherwise the classic renderer is used unchanged (older lessons render pixel-identically).
In unified mode every frame collects surface cells, solid/column/wedge/slice/box/plane faces and depth lines into **one list, painter-sorted
by face depth** (true view depth incl. elevation), drawn into a reused pool of `<path>`s; it repaints only when the camera, the build or a layer's
animation state changed. Rules that make the sort robust: tall side faces are split into vertical pieces; caps of prisms sort by their farthest
vertex (whatever stands on them is drawn after); faces hidden between touching columns are not emitted; opaque closed solids are back-face culled;
**translucent `solid` patches are "shells"**: their back faces are drawn first, everything else, then their front faces (so things inside a
translucent hemisphere/cone look inside). Points and normal curves stay on top (re-projected when the camera moves); `curve` with `depth:true`
becomes a depth-sorted polyline (hidden behind solids). Light is attached to the camera (classic light at az −34°; `light:'world'` to fix it).

Graph options (in addition to the classic ones): `aspect:'equal'` (same scale on x, y, z — needed for spheres/cones), `axes:'origin'`
(x/y/z axes through the origin as depth-sorted lines, labels at the tips; default is the classic corner triad, which now follows the camera),
`floor:true` (dashed floor square in origin mode), `axisExt` (.22, origin-axes overshoot), `showSurf:false` (keep `fn` for the columns but do not
draw it), no `fn` at all (empty stage: give `x`,`y`,`z`), `surfAlpha`, `mesh`, `fn2`/`op2`/`opWall` as before, `n` / `nr`,`nt` (surface grid,
default 48 / 40x72 here). Layer common fields as for other layers: `cue`/`off`/`at`/`gap`/`dur`/`id`, `until:id` (fades out over `outDur` .5 s when
that layer starts), `out:localSec` (fade out at that local time), `alpha`, `color` (`amber`, `mint`, `coral`, … or `'surf'` = height palette),
`edges:false`, `ec`/`ew` (edge color/width), `pulse` (see below), `bias` (depth bias, + = drawn later).

| kind | fields | animation |
|---|---|---|
| `cols` | rectangular grid `x:[a,b], y:[c,d], n:[nx,ny]` (default graph range, n 6) **or** polar grid `r:[r0,r1], th:[t0,t1]` (radians), `n:[nr,nt]`, `center:[cx,cy]`; `z0` number or `(x,y)=>z` (default floor 0), `hi:(x,y)=>z` (default graph `fn`), `sample:'center'\|[u,v]\|'min'\|'max'`, `shrink` (0..0.3 gap), `seg` (arc pieces) | columns rise from `z0` (easeOut, no overshoot): `order:'sweep'\|'radial'\|'random'\|'none'`, `stagger` (1.2 s total spread), `grow` (.5 s each); `dur = stagger+grow` |
| `wedge` | cylindrical `r:[r0,r1], th:[t0,t1], z:[z0,z1]` **or** spherical `sph:true, rho:[ρ0,ρ1], th:[θ0,θ1], phi:[φ0,φ1]`; `center:[x,y,z]`, `seg`, `segPhi` | `anim:'grow'` (z for cylindrical, ρ for spherical; default) \| `'fade'` \| `'explode'` \| `'none'`; `explode: d` slides the cell out from the origin by d after appearing; `dur` (.9) |
| `solid` | `param:(u,v)=>[x,y,z]`, `u:[u0,u1]`, `v:[v0,v1]`, `n:[nu,nv]` (24), `alpha` (.42), `mesh:true` (grid lines, `mc` color), `shell` (default true: back→inside→front passes), `ctr:[x,y,z]` (inside point, default centroid), `cull`, `shade:false` | `reveal:'sweep'` (appears along u; default) \| `'fade'` \| `'none'`; `dur` (1.2) |
| `slices` | `axis:'z'\|'x'\|'y'`, `range:[a,b]`, `n` (8), `disk: l=>radius` + `center:[c1,c2]`, or `poly: l=>[[p,q],...]` (cross-section in the other two coordinates), `seg` (40), `sample:'mid'\|'lo'\|'hi'` | `mode:'stack'` (slabs appear one after another and stay; `stagger` 1.6 s, `grow` .4 s) \| `'sweep'` (one slab moves from a to b in `dur` 3 s) |
| `orbit` | `az`, `el` (deg, targets), `dur` (2.5) | camera turns with ease in/out from its current az/el at the layer's cue |
| `pulse` | `target:id`, `n` (2), `per` (.7 s) | highlights a face layer (brighter fill, amber thicker edges) |
| `box` `plane` `curve` `point` | as classic (box/plane become sorted faces; plane outline = depth lines) | as classic |

`pulse` on a face layer itself: `pulse:true` (after its animation), `pulse: localSec`, `pulse:{at, n, per}` or an array of these.

Camera: `az`, `el` (deg) as before; `rotate` (deg/s, constant); **`orbit`** on the graph: `orbit:{ to: azDeg, el: elDeg?, dur: 3, at: localSec }`
or keyframes `orbit:[{t, az, el}, …]` (t = seconds from the graph start; eased between keyframes), or cue-timed `{kind:'orbit'}` layers.
Axes, labels, points and curves follow the camera; `fitView` frames the content for every camera in the orbit range (no clipping while turning).

```js
/* Riemann columns that refine: n=6 rises, then n=12 replaces it */
{ type: 'graph3d', fn: (x, y) => 4 - x * x - y * y, x: [-1.4, 1.4], y: [-1.4, 1.4], z: [0, 4], zs: 1, surfAlpha: .22, layers: [
  { kind: 'cols', id: 'c6', n: 6, order: 'sweep', stagger: 1.6, cue: 'sütunlar', until: 'c12' },
  { kind: 'cols', id: 'c12', n: 12, order: 'sweep', stagger: 1.8, cue: 'daha ince' } ] }
/* polar columns (cylindrical wedge prisms) + slow camera turn */
{ type: 'graph3d', fn: (x, y) => 4 - x * x - y * y, polar: 2, z: [0, 4], zs: 1, surfAlpha: .28, orbit: { to: 6, dur: 4.5, at: 5 },
  layers: [{ kind: 'cols', r: [0, 2], th: [0, 2 * Math.PI], n: [5, 16], order: 'radial', stagger: 2.2 }] }
/* one cylindrical cell, then a spherical one that slides out and pulses */
{ kind: 'wedge', id: 'wc', r: [1, 1.6], th: [20 * D, 60 * D], z: [.5, 1.1], color: 'amber', cue: 'hacim elemanı', pulse: { at: 2 } }
{ kind: 'wedge', sph: true, rho: [1.2, 1.8], th: [20 * D, 60 * D], phi: [30 * D, 60 * D], color: 'mint', explode: .25, pulse: true }
/* translucent hemisphere filled with disks (aspect equal, axes through the origin) */
{ type: 'graph3d', x: [-2, 2], y: [-2, 2], z: [0, 2], aspect: 'equal', axes: 'origin', layers: [
  { kind: 'solid', param: (u, v) => [2 * Math.sin(u) * Math.cos(v), 2 * Math.sin(u) * Math.sin(v), 2 * Math.cos(u)], u: [0, Math.PI / 2], v: [0, 2 * Math.PI], n: [12, 40], color: 'mint', alpha: .26, mesh: true },
  { kind: 'slices', axis: 'z', range: [0, 2], n: 8, disk: z => Math.sqrt(4 - z * z), color: 'amber', stagger: 3.2 } ] }
/* ice-cream cone: cone + sphere cap shells, columns between them, orbit */
{ kind: 'solid', param: (s, v) => [s * Math.cos(v), s * Math.sin(v), s], u: [0, Math.SQRT2], v: [0, 2 * Math.PI], n: [8, 40], color: 'coral', alpha: .3, mesh: true }
{ kind: 'cols', r: [0, Math.SQRT2], n: [4, 14], z0: (x, y) => Math.hypot(x, y), hi: (x, y) => Math.sqrt(4 - x * x - y * y), color: 'amber', order: 'radial' }
{ kind: 'orbit', az: 26, dur: 5, cue: 'çevirelim' }
{ kind: 'curve', depth: true, pts: s => [1.6 * Math.cos(s), 1.6 * Math.sin(s), 1.1], color: 'mint', w: 6 }   // hidden behind solids
```
Performance (1080p, `render_video`): ~60–100 ms per frame incl. capture for scenes with 2–3k faces (JS paint 3–11 ms).
Limitations: painter's sort (no per-pixel depth): intersecting faces (e.g. a column poking through a translucent surface) can interleave;
shells assume the content is inside them; points and non-depth curves are always on top; slices `poly` caps are single polygons.

