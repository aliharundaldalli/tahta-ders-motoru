// Usage: node tools/render_video.mjs output/video.mp4 [audio.wav] [--from=0] [--to=seconds] [--lesson=lesson_parts/X] [--words=path.js] [--fps=30]
// Frame-by-frame 1920x1080 @30fps (window.__render(t)) -> ffmpeg. Without audio a silent video is produced.
import puppeteer from 'puppeteer-core'; import { spawn } from 'child_process'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2), flag = k => args.find(a => a.startsWith('--' + k + '='))?.split('=')[1], FPS = +(flag('fps') || 30);
const [out, audio] = args.filter(a => !a.startsWith('--')); const T0 = Date.now();
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--num-raster-threads=1', '--disable-gpu'] });
const page = await browser.newPage(); await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto('file://' + here + '/index.html?render' + (args.includes('--subs') ? '&subs=1' : '') + (flag('lesson') ? '&lesson=' + flag('lesson') : '') + (flag('words') ? '&words=' + flag('words') : '')); await page.waitForFunction('window.__ready');
const TOTAL = await page.evaluate(() => window.__total), from = +(flag('from') || 0), to = Math.min(TOTAL, +(flag('to') || TOTAL)), N = Math.round(FPS * (to - from));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...(audio ? ['-ss', String(from), '-i', audio, '-c:a', 'aac', '-b:a', '192k', '-af', 'apad'] : []), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-t', String(to - from), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let i = 0; i < N; i++) {
  await page.evaluate(x => window.__render(x), from + i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 300 === 0) console.log('frame', i, '/', N, ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('done', out, N, 'frames,', (N / ((Date.now() - T0) / 1000)).toFixed(1), 'fps render speed');
