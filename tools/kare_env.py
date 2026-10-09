"""Kare ayarları: proje .env dosyasını güvenli okuma/yazma, maskeleme ve sağlayıcı bağlantı testi.

- Tam anahtar asla tarayıcıya dönmez: GET yalnızca maskeli değer verir (ilk 7 + son 4 ya da "ayarlı"/"boş").
- Yazma: yalnızca bilinen anahtarlar; bilinmeyen satırlar/yorumlar korunur; atomik (geçici dosya + os.replace), izin 600.
- Bağlantı testi kayıtlı .env değerleriyle yapılır; anahtar yanıta/loga yazılmaz.
Dosya yolu: KARE_ENV_FILE ortam değişkeni (testler için) ya da <proje>/.env.
"""
import https_ctx
import json
import os
import re
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLM_BASES = ('https://api.z.ai/api/coding/paas/v4', 'https://api.z.ai/api/paas/v4', 'https://open.bigmodel.cn/api/paas/v4')
GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
PROVIDERS = ('glm', 'openai', 'anthropic', 'gemini')
DEFAULTS = {'GLM_MODEL': 'glm-5.3', 'OPENAI_MODEL': 'gpt-4.1', 'ANTHROPIC_MODEL': 'claude-sonnet-5-5',
            # Gemini: kararlı (GA) Flash modeli — https://ai.google.dev/gemini-api/docs/models
            'GEMINI_MODEL': 'gemini-3.8-flash',
            'GLM_BASE_URL': GLM_BASES[0]}
MODEL_RE = r'[A-Za-z0-9][A-Za-z0-9._:/-]{0,79}'
GEMINI_MODEL_RE = r'(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9._-]{0,79}'   # URL yoluna girer: / ve : yok
SECRET_RE = r'[\x21-\x7e]{8,300}'          # yazdırılabilir ASCII, boşluk/yeni satır yok
# anahtar -> (gizli mi, izin verilen değer düzeni ya da küme)
FIELDS = {
    'AI_PROVIDER': (False, set(PROVIDERS)),
    'CARTESIA_API_KEY': (True, SECRET_RE), 'CARTESIA_VOICE': (False, r'[A-Za-z0-9_-]{1,100}'),
    'GLM_API_KEY': (True, SECRET_RE), 'GLM_MODEL': (False, MODEL_RE), 'GLM_BASE_URL': (False, set(GLM_BASES)),
    'OPENAI_API_KEY': (True, SECRET_RE), 'OPENAI_MODEL': (False, MODEL_RE),
    'ANTHROPIC_API_KEY': (True, SECRET_RE), 'ANTHROPIC_MODEL': (False, MODEL_RE),
    'GEMINI_API_KEY': (True, SECRET_RE), 'GEMINI_MODEL': (False, GEMINI_MODEL_RE),
}
LINE = re.compile(r'^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$')


def env_path():
    return Path(os.environ.get('KARE_ENV_FILE') or ROOT / '.env')


def _unquote(v):
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
        return v[1:-1]
    return v


def read_file(path=None):
    path = Path(path or env_path()); values = {}
    if path.is_file():
        for line in path.read_text(encoding='utf-8').splitlines():
            m = LINE.match(line)
            if m and not line.lstrip().startswith('#'):
                values[m[1]] = _unquote(m[2])
    return values


def values():
    """.env değerleri; aynı adlı ortam değişkenleri önceliklidir."""
    v = read_file()
    v.update({k: os.environ[k] for k in FIELDS if os.environ.get(k)})
    return v


def mask(value):
    if not value:
        return 'boş'
    return value[:7] + '…' + value[-4:] if len(value) >= 16 else 'ayarlı'


def public():
    """Ayarlar sayfası için: gizli alanlar maskeli, diğerleri açık."""
    file_values = read_file(); out = {}
    for key, (secret, _) in FIELDS.items():
        v = file_values.get(key, '')
        out[key] = {'secret': secret, 'set': bool(v), 'value': mask(v) if secret else v,
                    'default': DEFAULTS.get(key, ''), 'envOverride': bool(os.environ.get(key))}
    return {'fields': out, 'file': env_path().name, 'providers': list(PROVIDERS)}


def validate(updates):
    if not isinstance(updates, dict) or not updates:
        raise ValueError('Güncellenecek alan yok')
    if len(updates) > len(FIELDS):
        raise ValueError('Çok fazla alan')
    clean = {}
    for key, value in updates.items():
        if key not in FIELDS:
            raise ValueError(f'Bilinmeyen ayar: {str(key)[:40]}')
        if value is None:
            continue
        if not isinstance(value, str):
            raise ValueError(f'{key} metin olmalı')
        value = value.strip()
        if any(c in value for c in '\r\n\0'):
            raise ValueError(f'{key} yeni satır içeremez')
        rule = FIELDS[key][1]
        if value and (value not in rule if isinstance(rule, set) else not re.fullmatch(rule, value)):
            raise ValueError(f'{key} değeri geçersiz biçimde')
        clean[key] = value
    return clean


def write(updates, path=None):
    """Yalnızca verilen alanları değiştirir; diğer satırlar ve yorumlar korunur. Atomik yazar, izin 600."""
    clean = validate(updates); path = Path(path or env_path())
    lines = path.read_text(encoding='utf-8').splitlines() if path.is_file() else []
    done = set()
    for i, line in enumerate(lines):
        m = LINE.match(line)
        if m and not line.lstrip().startswith('#') and m[1] in clean:
            lines[i] = f'{m[1]}={clean[m[1]]}'; done.add(m[1])
    missing = [k for k in clean if k not in done]
    if missing:
        if lines and lines[-1].strip():
            lines.append('')
        lines += [f'{k}={clean[k]}' for k in missing]
    data = ('\n'.join(lines) + '\n').encode('utf-8')
    fd, tmp = tempfile.mkstemp(prefix='.env.', suffix='.tmp', dir=str(path.parent))
    try:
        os.fchmod(fd, 0o600) if hasattr(os, 'fchmod') else None
        with os.fdopen(fd, 'wb') as f:
            f.write(data); f.flush(); os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        try: os.unlink(tmp)
        except OSError: pass
        raise
    try: os.chmod(path, 0o600)
    except OSError: pass
    return sorted(clean)


# ---------------------------------------------------------------- bağlantı testi
def _request(url, headers, body=None, timeout=15):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'User-Agent': 'kare-studio/1.0', **headers}, method='POST' if body is not None else 'GET')
    with urllib.request.urlopen(req, timeout=timeout, context=https_ctx.CTX) as r:
        return r.status


def test_provider(name):
    """Küçük, gerçek bir çağrı. Dönüş: {'ok': bool, 'message': str}; anahtar asla yanıtta yer almaz."""
    v = values()
    try:
        if name == 'cartesia':
            key = v.get('CARTESIA_API_KEY')
            if not key: return {'ok': False, 'message': 'CARTESIA_API_KEY boş'}
            _request('https://api.cartesia.ai/voices?limit=1', {'X-API-Key': key, 'Cartesia-Version': '2026-08-14'})
            msg = 'Cartesia anahtarı geçerli'
            if not v.get('CARTESIA_VOICE'): msg += ' (CARTESIA_VOICE boş: seslendirme için bir ses kimliği gir)'
            return {'ok': True, 'message': msg}
        if name == 'openai':
            key = v.get('OPENAI_API_KEY'); model = v.get('OPENAI_MODEL') or DEFAULTS['OPENAI_MODEL']
            if not key: return {'ok': False, 'message': 'OPENAI_API_KEY boş'}
            _request('https://api.openai.com/v1/models/' + urllib.request.quote(model, safe=''), {'Authorization': f'Bearer {key}'})
            return {'ok': True, 'message': f'OpenAI bağlantısı tamam · {model} erişilebilir'}
        if name == 'anthropic':
            key = v.get('ANTHROPIC_API_KEY'); model = v.get('ANTHROPIC_MODEL') or DEFAULTS['ANTHROPIC_MODEL']
            if not key: return {'ok': False, 'message': 'ANTHROPIC_API_KEY boş'}
            _request('https://api.anthropic.com/v1/models/' + urllib.request.quote(model, safe=''),
                     {'x-api-key': key, 'anthropic-version': '2023-06-01'})
            return {'ok': True, 'message': f'Anthropic bağlantısı tamam · {model} erişilebilir'}
        if name == 'gemini':
            key = v.get('GEMINI_API_KEY'); model = v.get('GEMINI_MODEL') or DEFAULTS['GEMINI_MODEL']
            if not key: return {'ok': False, 'message': 'GEMINI_API_KEY boş'}
            # models.get: ücretsiz meta veri çağrısı; anahtar başlıkta, URL'de değil.
            _request(GEMINI_BASE + '/models/' + urllib.request.quote(model, safe=''), {'x-goog-api-key': key})
            return {'ok': True, 'message': f'Gemini bağlantısı tamam · {model} erişilebilir'}
        if name == 'glm':
            key = v.get('GLM_API_KEY'); model = v.get('GLM_MODEL') or DEFAULTS['GLM_MODEL']
            base = v.get('GLM_BASE_URL') or DEFAULTS['GLM_BASE_URL']
            if not key: return {'ok': False, 'message': 'GLM_API_KEY boş'}
            if base not in GLM_BASES: return {'ok': False, 'message': 'GLM_BASE_URL resmi Z.ai/Bigmodel adresi olmalı'}
            _request(base + '/chat/completions', {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
                     {'model': model, 'messages': [{'role': 'user', 'content': 'ping'}], 'max_tokens': 8,
                      'thinking': {'type': 'disabled'}}, timeout=30)
            return {'ok': True, 'message': f'GLM bağlantısı tamam · {model} yanıt verdi'}
        return {'ok': False, 'message': 'Bilinmeyen sağlayıcı'}
    except urllib.error.HTTPError as e:      # yanıt gövdesi istemciye taşınmaz
        hint = {401: 'anahtar geçersiz', 403: 'yetki yok', 404: 'model veya uç nokta bulunamadı', 429: 'hız/kota sınırı'}.get(e.code, 'servis hatası')
        return {'ok': False, 'message': f'HTTP {e.code}: {hint}'}
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        if 'CERTIFICATE_VERIFY_FAILED' in str(e):
            return {'ok': False, 'message': 'SSL sertifikası doğrulanamadı (Python sertifika paketi eksik: pip install certifi)'}
        return {'ok': False, 'message': 'Servise erişilemedi (ağ / zaman aşımı)'}
