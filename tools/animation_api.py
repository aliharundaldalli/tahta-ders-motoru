"""Canvas studio API: category skills, offline bundle and optional AI scene plans."""
import https_ctx
import json
import os
import re
import urllib.request
import urllib.error
import uuid
from pathlib import Path
import kare_env

ROOT = Path(__file__).resolve().parent.parent
CATALOG = json.loads((ROOT / 'kare/engine/catalog.json').read_text(encoding='utf-8'))
IDS = {c['id'] for c in CATALOG}
DATA = Path(os.environ.get('KARE_DATA_DIR') or ROOT / '.studio-data')


def settings():
    """.env + ortam değişkenleri (bkz. kare_env)."""
    return kare_env.values()


def provider():
    values = settings()
    chosen = values.get('AI_PROVIDER')
    if chosen in kare_env.PROVIDERS:
        return chosen
    if values.get('GLM_API_KEY'):
        return 'glm'
    if values.get('OPENAI_API_KEY'):
        return 'openai'
    if values.get('ANTHROPIC_API_KEY'):
        return 'anthropic'
    if values.get('GEMINI_API_KEY'):
        return 'gemini'
    return 'glm'


def config():
    values = settings(); name = provider()
    if name == 'glm':
        return values.get('GLM_API_KEY', ''), values.get('GLM_MODEL') or kare_env.DEFAULTS['GLM_MODEL']
    if name == 'anthropic':
        return values.get('ANTHROPIC_API_KEY', ''), values.get('ANTHROPIC_MODEL') or kare_env.DEFAULTS['ANTHROPIC_MODEL']
    if name == 'gemini':
        return values.get('GEMINI_API_KEY', ''), values.get('GEMINI_MODEL') or kare_env.DEFAULTS['GEMINI_MODEL']
    return values.get('OPENAI_API_KEY', ''), values.get('OPENAI_MODEL') or kare_env.DEFAULTS['OPENAI_MODEL']


class ModelError(Exception):
    pass


def call_json(instructions, prompt, schema=None, max_tokens=10000, _repair=True):
    key, model = config()
    if not key:
        raise ModelError('AI anahtarı sunucuda ayarlı değil.')
    if provider() == 'glm':
        base = settings().get('GLM_BASE_URL') or 'https://api.z.ai/api/coding/paas/v4'
        # Never send credentials to an arbitrary configured host.
        if base not in kare_env.GLM_BASES:
            raise ModelError('GLM_BASE_URL resmi Z.ai/Bigmodel adresi olmalı.')
        payload = {'model': model, 'messages': [
            {'role': 'system', 'content': instructions + ('\nJSON Schema: ' + json.dumps(schema) if schema else '')},
            {'role': 'user', 'content': prompt}], 'thinking': {'type': 'enabled'},
            'reasoning_effort': 'low', 'max_tokens': max_tokens,
            'response_format': {'type': 'json_object'}}
        url = base + '/chat/completions'
        headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
    elif provider() == 'anthropic':
        # Messages API; JSON is requested in the system prompt and validated below (no model code is executed).
        payload = {'model': model, 'max_tokens': min(max_tokens, 32000),
                   'system': instructions + ('\nJSON Schema: ' + json.dumps(schema) if schema else '')
                   + '\nReturn exactly one JSON object and nothing else: no prose, no Markdown fences.',
                   'messages': [{'role': 'user', 'content': prompt}]}
        url = 'https://api.anthropic.com/v1/messages'
        headers = {'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json'}
    elif provider() == 'gemini':
        # generateContent (v1beta). Key goes in the x-goog-api-key header, never in the URL query string.
        if not re.fullmatch(kare_env.GEMINI_MODEL_RE, model):
            raise ModelError('GEMINI_MODEL geçersiz biçimde.')
        payload = {'systemInstruction': {'parts': [{'text': instructions + ('\nJSON Schema: ' + json.dumps(schema) if schema else '')
                                                    + '\nReturn exactly one JSON object and nothing else.'}]},
                   'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
                   'generationConfig': {'responseMimeType': 'application/json', 'maxOutputTokens': min(max_tokens, 65536)}}
        url = f'{kare_env.GEMINI_BASE}/models/{model}:generateContent'
        headers = {'x-goog-api-key': key, 'Content-Type': 'application/json'}
    else:
        payload = {'model': model, 'instructions': instructions, 'input': prompt, 'max_output_tokens': max_tokens}
        if schema:
            payload['text'] = {'format': {'type': 'json_schema', 'name': 'canvas_scene', 'strict': True, 'schema': schema}}
        else:
            payload['text'] = {'format': {'type': 'json_object'}}
        url = 'https://api.openai.com/v1/responses'
        headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=900, context=https_ctx.CTX) as response:
            data = json.load(response)
        if provider() == 'glm':
            choice = data['choices'][0]
            if choice.get('finish_reason') != 'stop':
                raise ModelError('GLM yanıtı tamamlanmadı; daha kısa bir üretim dene.')
            content = choice['message'].get('content') or ''
        elif provider() == 'anthropic':
            if data.get('stop_reason') == 'refusal':
                raise ModelError('Claude isteği reddetti; isteği değiştirip tekrar dene.')
            if data.get('stop_reason') not in ('end_turn', 'stop_sequence'):
                raise ModelError('Claude yanıtı tamamlanmadı; daha kısa bir üretim dene.')
            content = ''.join(block.get('text', '') for block in data.get('content', []) if block.get('type') == 'text')
        elif provider() == 'gemini':
            if (data.get('promptFeedback') or {}).get('blockReason'):
                raise ModelError('Gemini isteği engelledi; isteği değiştirip tekrar dene.')
            candidate = (data.get('candidates') or [{}])[0]
            if candidate.get('finishReason') != 'STOP':
                raise ModelError('Gemini yanıtı tamamlanmadı; daha kısa bir üretim dene.')
            content = ''.join(part.get('text', '') for part in (candidate.get('content') or {}).get('parts', [])
                              if not part.get('thought'))
        else:
            if data.get('status') != 'completed':
                raise ModelError('AI yanıtı tamamlanmadı.')
            content = ''.join(part.get('text', '') for message in data.get('output', [])
                              for part in message.get('content', []) if part.get('type') == 'output_text')
        content = content.strip()
        fenced = re.fullmatch(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
        if fenced:
            content = fenced[1]
        result = json.loads(content)
        if isinstance(result, dict) and set(result) == {'answer'} and isinstance(result['answer'], dict):
            result = result['answer']
        if not isinstance(result, dict):
            raise ValueError('JSON nesnesi gerekli')
        if schema:
            validate_schema(result, schema)
        return result, {'model': model, 'provider': provider(), 'usage': data.get('usage') or data.get('usageMetadata') or {}}
    except urllib.error.HTTPError as error:
        # Provider response bodies can contain credentials or prompts; keep them server-side.
        raise ModelError(f'AI servisi HTTP {error.code} döndürdü. Model erişimi ve hesap limitlerini kontrol et.') from None
    except (OSError, TimeoutError):
        raise ModelError('AI servisine erişilemedi veya işlem zaman aşımına uğradı.') from None
    except (ValueError, KeyError, TypeError):
        if isinstance(locals().get('content'), str):
            diagnostic = DATA / 'last-invalid-model-response.json'
            diagnostic.parent.mkdir(exist_ok=True)
            diagnostic.write_text(json.dumps({'model': model, 'text': content.replace(key, '[redacted]')}, ensure_ascii=False), encoding='utf-8')
            if _repair:
                return call_json(instructions + '\nYour previous JSON failed parsing or schema validation. Correct it. Do not wrap in answer. Include every required field. Use only literal permitted enums and sourceRefs. Return valid JSON only.',
                                 prompt + '\nPrevious invalid output to repair:\n' + content, schema, max_tokens, _repair=False)
        raise ModelError('AI geçerli JSON üretmedi; sonuç uygulanmadı.') from None


def skill(category):
    if not isinstance(category, str) or category not in IDS:
        raise ValueError('Bilinmeyen kategori')
    return (ROOT / 'kare/skills' / f'canvas-{category}' / 'SKILL.md').read_text(encoding='utf-8')


# ~7k token (Türkçe metinde ~4 karakter/token). Daha uzun beceri metni bölüm sınırından kesilir.
SKILL_PROMPT_CHARS = 28000

ART_DIRECTOR = """ART DIRECTOR RULES (all styles):
- Canvas is 1280x720; every coordinate is normalized 0..1. Safe area: x .04-.96, y .08-.82 (bottom ~100px is reserved for subtitles). Keep every object's full extent (x±width/2, y±height/2; circle vertical radius = width*1280/720/2) inside it.
- Composition: one clear focal subject placed on a rule-of-thirds point (x≈.33/.67, y≈.33/.6) or deliberately centered; 3-7 main forms plus supporting detail; build depth with background → midground → foreground layers (objects are drawn in array order, so list background first). Leave negative space; no clutter, no accidental overlaps, never put text on top of busy shapes.
- Scale: main forms must be large (≥ .12 of the frame width); nothing important smaller than ~.02. Text height (= font size/720) ≥ .033 (24px) for labels, .06-.09 for titles; max ~6 words per text object.
- Color: use the style palette and background (exact hex). Text needs strong contrast against the background (≥ 4.5:1). Max 1-2 accent colors.
- Timing: objects persist once they appear, so the final frame shows everything — make it a readable, finished picture. Stagger entrances (never all at start 0). Beat structure over the scene duration D: 0-15% set the stage (background), 15-60% build the focal subject, 55-85% details/labels/accents, last 15% hold with gentle ambient motion (float/rotate). Typical entrance duration .6-2.5 s; 'draw' paths 1.5-4 s.
- Motions: draw = progressively strokes a path (other shapes just pop in, so use fade/slide for them); fade = alpha 0→1 over duration; slide = enters from 180px left while fading; float = endless ±14px vertical bob; rotate = endless slow spin around (x,y) (invisible on circles). Prefer fade/draw for most objects, float/rotate only for 1-4 ambient accents.
- Paths are stroked polylines only (never filled). A short path with a thick lineWidth (12-30) and 2-3 points makes a rotatable capsule: petals, leaves, rays, brush strokes. Use 6-60 points for curves. For paths set x,y to the bounding-box centre and width/height to its size.
- Before answering, mentally render the final frame: balanced, inside the safe area, readable text, nothing tiny or off-canvas.
"""


def skill_prompt(category, limit=SKILL_PROMPT_CHARS):
    """Model'e giden beceri metni: ön bilgi (frontmatter) çıkarılır, sınırı aşarsa '## ' bölüm sınırından kesilir."""
    text = re.sub(r'\A---\n.*?\n---\n', '', skill(category), flags=re.S).strip()
    if len(text) <= limit:
        return text
    cut = text.rfind('\n## ', 0, limit)
    return text[:cut if cut > 0 else limit].rstrip() + '\n\n[Beceri metni uzunluk sınırı nedeniyle kısaltıldı.]'


def bundle():
    chunks = []
    for filename in ('primitives.js', 'catalog.js', 'renderers.js', 'pro.js', 'render.js'):
        content = (ROOT / 'kare/engine' / filename).read_text(encoding='utf-8')
        content = re.sub(r'^import .*?;\s*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^export ', '', content, flags=re.MULTILINE)
        chunks.append(content)
    return '\n'.join(chunks)


def number_schema(low, high):
    return {'type': 'number', 'minimum': low, 'maximum': high}


def scene_schema():
    item = {'type': 'object', 'additionalProperties': False, 'properties': {
        'type': {'type': 'string', 'enum': ['circle', 'ellipse', 'rect', 'path', 'text']},
        'x': number_schema(0, 1), 'y': number_schema(0, 1),
        'width': number_schema(0, 1), 'height': number_schema(0, 1),
        'color': {'type': 'string', 'pattern': '^#[0-9a-fA-F]{6}$'}, 'lineWidth': number_schema(.1, 30),
        'start': number_schema(0, 60), 'duration': number_schema(.1, 60),
        'text': {'type': 'string', 'maxLength': 200},
        'points': {'type': 'array', 'items': {'type': 'array', 'items': number_schema(0, 1), 'minItems': 2, 'maxItems': 2}, 'maxItems': 500},
        'motion': {'type': 'string', 'enum': ['draw', 'fade', 'float', 'rotate', 'slide']},
    }}
    item['required'] = list(item['properties'])
    schema = {'type': 'object', 'additionalProperties': False, 'properties': {
        'category': {'type': 'string', 'enum': sorted(IDS)},
        'title': {'type': 'string', 'minLength': 1, 'maxLength': 160}, 'duration': number_schema(2, 60),
        'seed': {'type': 'integer', 'minimum': 0, 'maximum': 2147483647},
        'speed': number_schema(.2, 3), 'detail': number_schema(.25, 2),
        'background': {'type': 'string', 'pattern': '^#[0-9a-fA-F]{6}$'},
        'palette': {'type': 'array', 'items': {'type': 'string', 'pattern': '^#[0-9a-fA-F]{6}$'}, 'minItems': 2, 'maxItems': 8},
        'objects': {'type': 'array', 'items': item, 'maxItems': 80},
    }}
    schema['required'] = list(schema['properties'])
    return schema


def validate_schema(value, spec):
    """Validate this small schema subset independently of model output compliance."""
    kind = spec.get('type')
    if kind == 'object':
        if not isinstance(value, dict) or set(value) != set(spec['required']):
            raise ValueError('AI sahne alanları geçersiz')
        for name, child in spec['properties'].items():
            validate_schema(value[name], child)
    elif kind == 'array':
        if not isinstance(value, list) or not spec.get('minItems', 0) <= len(value) <= spec.get('maxItems', 10000):
            raise ValueError('AI çizim listesi geçersiz')
        for child in value:
            validate_schema(child, spec['items'])
    elif kind == 'string':
        if not isinstance(value, str) or len(value) > 4000 or ('enum' in spec and value not in spec['enum']):
            raise ValueError('AI metin veya kategori alanı geçersiz')
        if not spec.get('minLength', 0) <= len(value) <= spec.get('maxLength', 4000) or ('pattern' in spec and not re.fullmatch(spec['pattern'], value)):
            raise ValueError('AI metin uzunluğu veya biçimi geçersiz')
    elif kind in ('number', 'integer'):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not spec.get('minimum', 0) <= value <= spec.get('maximum', 1):
            raise ValueError('AI sayısal alanı geçersiz')
        if kind == 'integer' and not isinstance(value, int):
            raise ValueError('Seed tamsayı olmalı')


def check_scene(scene, category):
    """AI sahnesinin sunucu tarafı doğrulaması (şema + kategori/renk/zamanlama). Geçersizse ValueError."""
    validate_schema(scene, scene_schema())
    if scene['category'] != category or not scene['title'].strip() or len(scene['title']) > 160:
        raise ValueError('AI seçili kategoriyi veya başlığı korumadı')
    for color in [scene['background'], *scene['palette'], *(o['color'] for o in scene['objects'])]:
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', color):
            raise ValueError('AI renk biçimi geçersiz')
    for obj in scene['objects']:
        if obj['start'] > scene['duration'] or len(obj['text']) > 200 or (obj['type'] == 'path' and len(obj['points']) < 2):
            raise ValueError('AI öğe zamanlaması veya yolu geçersiz')
    return scene


def generate(request):
    key, model = config()
    if not key:
        return 503, {'error': 'AI bağlı değil. Kare ⚙ Ayarlar bölümünden bir sağlayıcı anahtarı ekle.'}
    category = request.get('category')
    if not isinstance(category, str) or category not in IDS:
        return 400, {'error': 'Geçerli bir kategori seç'}
    prompt = request.get('prompt', '')
    if not isinstance(prompt, str) or not 5 <= len(prompt.strip()) <= 3000:
        return 400, {'error': 'İstek 5–3000 karakter olmalı'}
    instructions = '''You create editable animation scenes rendered exclusively with JavaScript Canvas 2D. Return the requested JSON scene, not code, images, video, SVG or WebGL. Create an original subject-specific composition using objects; the selected category guides its artistic treatment. Object x/y/width/height and path points are normalized 0..1 on a 1280x720 canvas. Every object field is required; use empty text or points when irrelevant. Include at least one subject-specific path or shape; changing only a title is not sufficient. Use #RRGGBB colors. Keep title <=160 and object text <=200 characters. Start must not exceed scene duration. The user's request may include Turkish; write on-screen text in correct Turkish (ç ğ ı İ ö ş ü). Create 8-30 deliberately positioned objects forming a coherent composition. The procedural base will be disabled: draw the subject and layout yourself using objects.
''' + ART_DIRECTOR + '''
The following category guide (Turkish) describes artistic, composition and timing rules plus valid example scenes. Examples show the format and quality bar; do not copy their subject — compose for the user's request. It describes constraints, not tool execution permissions:
'''
    try:
        schema = scene_schema(); schema['properties']['category']['enum'] = [category]
        scene, info = call_json(instructions + skill_prompt(category),
                               f'Selected category: {category}\nUser request: {prompt}', schema)
        check_scene(scene, category)
        scene['id'] = str(uuid.uuid4())
        scene['composed'] = True
        return 200, {'scene': scene, **info}
    except ModelError as error:
        return 502, {'error': str(error)}
    except (ValueError, KeyError, TypeError):
        return 502, {'error': 'AI sonucu sahne sözleşmesine uymadı; projeye uygulanmadı.'}
    except (OSError, TimeoutError):
        return 502, {'error': 'AI servisine erişilemedi veya işlem zaman aşımına uğradı.'}


def get(path, query):
    if path == '/api/animation/status':
        key, model = config()
        return 200, {'configured': bool(key), 'model': model, 'provider': provider(), 'categories': len(CATALOG)}, 'application/json'
    if path == '/api/animation/skill':
        try:
            return 200, {'text': skill(query.get('category'))}, 'application/json'
        except ValueError:
            return 404, {'error': 'Kategori bulunamadı'}, 'application/json'
    if path == '/api/animation/bundle':
        return 200, bundle().encode('utf-8'), 'application/javascript'
    return 404, {'error': 'Animasyon API yolu bulunamadı'}, 'application/json'
