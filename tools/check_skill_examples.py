"""Kare beceri örneklerini doğrular: her kare/skills/canvas-*/SKILL.md içindeki ```json sahne bloklarını
1) AI sahne şeması + sunucu kontrolleri (animation_api.check_scene),
2) gerçek motor doğrulaması ve kalite denetimi (tools/pro_contract.mjs → validateProject + qualityCheck),
3) kompozisyon kuralları (güvenli alan, metin boyu/çakışma/kontrast, kademeli girişler)
ile denetler. Ağ veya API anahtarı gerekmez.

Çalıştır:  python tools/check_skill_examples.py      (çıkış kodu 0 = hepsi geçerli)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import animation_api as api  # noqa: E402

BLOCK = re.compile(r'```json\n(.*?)\n```', re.S)
SAFE = (.04, .96, .08, .84)       # metin için güvenli alan (altta altyazı bandı)
CHAR_EM = .56                      # Manrope ortalama karakter genişliği (em)


def lum(c):
    v = [int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    v = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in v]
    return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]


def contrast(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)


def text_lines(o):
    """wrappedText ile aynı açgözlü satır kırma; karakter genişliği tahminidir."""
    size = min(max(o['height'] * 720, 12), 110); width = max(o['width'] * 1280, 80)
    lines, cur = 0, ''
    for word in o['text'].split():
        nxt = (cur + ' ' + word).strip()
        if cur and len(nxt) * size * CHAR_EM > width:
            lines += 1; cur = word
        else:
            cur = nxt
    return lines + (1 if cur else 0), size, max(len(w) for w in o['text'].split()) * size * CHAR_EM <= width


def text_box(o):
    n, size, _ = text_lines(o)
    half_h = n * size * 1.28 / 2 / 720
    return o['x'] - o['width'] / 2, o['x'] + o['width'] / 2, o['y'] - half_h, o['y'] + half_h


def lint(scene):
    errors = []; objs = scene['objects']; d = scene['duration']
    if not 3 <= len(objs) <= 40:
        errors.append(f'{len(objs)} nesne: 3–40 arası olmalı')
    if not any(o['type'] == 'path' for o in objs):
        errors.append('en az bir path gerekli')
    starts = [o['start'] for o in objs]
    if len(set(starts)) < 3:
        errors.append('girişler kademeli değil (en az 3 farklı start)')
    if starts.count(0) > max(2, .35 * len(objs)):
        errors.append('çok fazla nesne t=0 anında başlıyor')
    for i, o in enumerate(objs):
        tag = f'nesne {i} ({o["type"]} {o["text"][:20]!r})'
        if o['start'] > d * .9:
            errors.append(f'{tag}: son %10 içinde başlıyor')
        ry = o['width'] * 1280 / 720 / 2 if o['type'] == 'circle' else o['height'] / 2
        pad = 14 / 720 if o['motion'] == 'float' else 0
        if o['x'] - o['width'] / 2 < -1e-9 or o['x'] + o['width'] / 2 > 1 + 1e-9 or o['y'] - ry - pad < -1e-9 or o['y'] + ry + pad > 1 + 1e-9:
            errors.append(f'{tag}: çerçeve dışına taşıyor')
        if o['type'] == 'path':
            xs = [p[0] for p in o['points']]; ys = [p[1] for p in o['points']]
            if abs((min(xs) + max(xs)) / 2 - o['x']) > .01 or abs((min(ys) + max(ys)) / 2 - o['y']) > .01:
                errors.append(f'{tag}: path x/y sınır kutusu merkezinde değil')
        if o['type'] == 'text':
            n, size, word_fits = text_lines(o)
            if size < 20:
                errors.append(f'{tag}: metin çok küçük ({size:.0f}px)')
            if n > 3 or not word_fits:
                errors.append(f'{tag}: metin genişliğe sığmıyor ({n} satır)')
            if len(o['text'].split()) > 8:
                errors.append(f'{tag}: metin 8 kelimeden uzun')
            x0, x1, y0, y1 = text_box(o)
            if x0 < SAFE[0] or x1 > SAFE[1] or y0 < SAFE[2] or y1 > SAFE[3]:
                errors.append(f'{tag}: metin güvenli alanın dışında')
            if contrast(o['color'], scene['background']) < 4.5:
                errors.append(f'{tag}: metin kontrastı < 4.5')
    texts = [o for o in objs if o['type'] == 'text']
    for i, a in enumerate(texts):
        for b in texts[i + 1:]:
            ax0, ax1, ay0, ay1 = text_box(a); bx0, bx1, by0, by1 = text_box(b)
            if ax0 < bx1 and bx0 < ax1 and ay0 < by1 and by0 < ay1:
                errors.append(f'metinler çakışıyor: {a["text"][:20]!r} / {b["text"][:20]!r}')
    return errors


def collect():
    examples, problems = [], []
    skills = sorted((ROOT / 'kare/skills').glob('canvas-*/SKILL.md'))
    for path in skills:
        category = path.parent.name[len('canvas-'):]
        content = path.read_text(encoding='utf-8')
        if not content.startswith(f'---\nname: canvas-{category}\n'):
            problems.append(f'{category}: frontmatter name eksik')
        blocks = BLOCK.findall(content)
        if len(blocks) < 2:
            problems.append(f'{category}: en az 2 json örneği gerekli ({len(blocks)})')
        for n, block in enumerate(blocks, 1):
            label = f'{category}#{n}'
            try:
                scene = json.loads(block)
                api.check_scene(scene, category)
            except (ValueError, KeyError, TypeError) as e:
                problems.append(f'{label}: şema/sunucu doğrulaması: {e}'); continue
            problems += [f'{label}: {e}' for e in lint(scene)]
            examples.append((label, scene))
    return skills, examples, problems


def engine_check(examples):
    project = {'version': 1, 'name': 'skill examples',
               # narration sesle ilgili uyarılar üretir (ses dosyası yok); görsel denetim için çıkarılır.
               'scenes': [{**{k: v for k, v in scene.items() if k != 'narration'}, 'id': label, 'composed': True}
                          for label, scene in examples]}
    run = subprocess.run(['node', str(TOOLS / 'pro_contract.mjs')], input=json.dumps(project), capture_output=True,
                         text=True, cwd=str(ROOT), timeout=120)
    if run.returncode:
        return [f'motor doğrulaması başarısız: {run.stderr.strip()[:500]}']
    issues = json.loads(run.stdout)['issues']
    return [f'{i["scene"]}: kalite denetimi: {i["message"]} ({i["object"]})' for i in issues]


def main():
    skills, examples, problems = collect()
    if examples:
        problems += engine_check(examples)
    for p in problems:
        print('HATA', p)
    print(f'{len(skills)} beceri, {len(examples)} örnek sahne, {len(problems)} sorun')
    return 1 if problems or len(skills) != len(api.IDS) else 0


if __name__ == '__main__':
    sys.exit(main())
