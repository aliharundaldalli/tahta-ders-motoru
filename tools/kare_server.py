#!/usr/bin/env python3
"""Kare animasyon atölyesi sunucusu (ders kayıt stüdyosundan ayrı süreç; varsayılan port 8771).

Güvenlik:
- Yalnızca 127.0.0.1'e bağlanır. Host başlığı localhost/127.0.0.1:PORT değilse 421 (DNS rebinding).
- Her açılışta rastgele oturum anahtarı (secrets.token_urlsafe). Tarayıcı /kare/?t=ANAHTAR ile gelir; anahtar
  HttpOnly + SameSite=Strict çereze çevrilip adres çubuğundan silinir. Bütün /api/ istekleri (okuma dahil)
  çerez ya da X-Kare-Token başlığı ister, yoksa 403. Origin başlığı varsa ve bu sunucu değilse 403.
- Statik dosyalar yalnızca izinli öneklerden (kare/, assets/fonts/, mathjax, docs/kare/); noktalı yollar,
  dizin listeleme ve izinli dizin dışına çıkan sembolik bağlar 404. .env ve .studio-data asla statik sunulmaz.
- Yüklemelerde boyut sınırı gövde okunmadan önce uygulanır (413).
Çalıştır: tools/kare.sh start   (ya da: KARE_PORT=8771 $PY tools/kare_server.py)
"""
import hmac
import json
import os
import posixpath
import re
import secrets
import sys
import traceback
import uuid
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote, quote

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import animation_api            # noqa: E402
import kare_env                 # noqa: E402
import kare_guard as guard      # noqa: E402
import production_api           # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('KARE_PORT', 8771))
TOKEN = os.environ.get('KARE_TOKEN') or secrets.token_urlsafe(32)
COOKIE = f'kare_token_{PORT}'
HOSTS = {f'localhost:{PORT}', f'127.0.0.1:{PORT}'}
ORIGINS = {f'http://{h}' for h in HOSTS}
# URL öneki -> sunulabilecek gerçek dizin (sembolik bağ çözülmüş hâli bu dizinin içinde kalmalı)
STATIC = {'/kare/': 'kare', '/assets/fonts/': 'assets/fonts', '/node_modules/mathjax-full/es5/': 'node_modules/mathjax-full/es5',
          '/docs/kare/': 'docs/kare'}
LIMITS = {'/api/animation/package-import': guard.PACKAGE_MAX, '/api/animation/document': guard.DOCUMENT_MAX,
          '/api/animation/audio': guard.AUDIO_MAX, '/api/animation/generate': 50000, '/api/settings': 16384}
JSON_LIMIT = 16 * guard.MB
MEDIA_TYPES = {'.wav': 'audio/wav', '.mp4': 'video/mp4', '.json': 'application/json', '.zip': 'application/zip',
               '.srt': 'text/plain', '.vtt': 'text/vtt'}
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; "
       "object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")


def token_ok(value):
    return bool(value) and hmac.compare_digest(value.encode(), TOKEN.encode())


class Handler(SimpleHTTPRequestHandler):
    server_version = 'Kare'
    sys_version = ''

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args):           # adres satırı loglanmaz (anahtar ?t= içinde olabilir)
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        super().end_headers()

    def reply(self, code, obj, ctype='application/json'):
        body = obj if isinstance(obj, bytes) else json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', ctype + ('; charset=utf-8' if 'json' in ctype or 'javascript' in ctype else ''))
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    # ------------------------------------------------------------ istek korumaları
    def cookie_token(self):
        for part in (self.headers.get('Cookie') or '').split(';'):
            name, _, value = part.strip().partition('=')
            if name == COOKIE:
                return value
        return ''

    def authorized(self):
        return token_ok(self.headers.get('X-Kare-Token', '')) or token_ok(self.cookie_token())

    def guard_request(self):
        """Host ve Origin denetimi. Sorun varsa yanıtı yazar ve False döner."""
        if (self.headers.get('Host') or '').lower() not in HOSTS:
            self.reply(421, {'error': 'Geçersiz Host başlığı'}); return False
        origin = self.headers.get('Origin')
        if origin is not None and origin not in ORIGINS:
            self.reply(403, {'error': 'Geçersiz Origin'}); return False
        if self.headers.get('Sec-Fetch-Site') == 'cross-site' and self.path.startswith('/api/'):
            self.reply(403, {'error': 'Siteler arası istek reddedildi'}); return False
        return True

    # ------------------------------------------------------------ GET
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        if not self.guard_request():
            return
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        path = unquote(u.path)
        if path == '/api/health':
            return self.reply(200, {'ok': True, 'app': 'kare'})
        if path.startswith('/api/'):
            if not self.authorized():
                return self.reply(403, {'error': 'Oturum anahtarı gerekli. Kare\'yi tools/kare.sh ile açılan adresten aç.'})
            return self.api_get(path, q)
        if path in ('/', '/kare'):
            self.send_response(302); self.send_header('Location', '/kare/'); self.end_headers(); return
        if 't' in q:                              # tek seferlik ?t= -> HttpOnly çerez, adres çubuğundan silinir
            if not token_ok(q['t']):
                return self.reply(403, {'error': 'Oturum anahtarı geçersiz; tools/kare.sh ile yeniden aç.'})
            self.send_response(302)
            self.send_header('Set-Cookie', f'{COOKIE}={TOKEN}; Path=/; HttpOnly; SameSite=Strict')
            self.send_header('Location', quote(u.path))
            self.end_headers(); return
        return self.static(path)

    def static(self, path):
        if any(seg.startswith('.') for seg in path.split('/') if seg) or '\\' in path or '\x00' in path:
            return self.reply(404, {'error': 'Dosya bulunamadı'})
        prefix = next((p for p in STATIC if path.startswith(p)), None)
        if not prefix:
            return self.reply(404, {'error': 'Dosya bulunamadı'})
        rel = posixpath.normpath(path[len(prefix):]) if path[len(prefix):] else ''
        if rel.startswith('..') or rel.startswith('/'):
            return self.reply(404, {'error': 'Dosya bulunamadı'})
        base = os.path.join(ROOT, STATIC[prefix])
        target = os.path.join(base, rel) if rel and rel != '.' else base
        try:
            real = guard.inside(base, target)
        except ValueError:
            return self.reply(404, {'error': 'Dosya bulunamadı'})
        if real.is_dir():
            if not path.endswith('/'):
                self.send_response(301); self.send_header('Location', quote(path + '/')); self.end_headers(); return
            real = real / 'index.html'
            if not real.is_file():
                return self.reply(404, {'error': 'Dosya bulunamadı'})
        if not real.is_file():
            return self.reply(404, {'error': 'Dosya bulunamadı'})
        ctype = self.guess_type(str(real))
        if str(real).endswith(('.js', '.mjs')):
            ctype = 'text/javascript'
        data = real.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', ctype + ('; charset=utf-8' if ctype.startswith('text/') else ''))
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def list_directory(self, path):               # dizin listesi asla verilmez
        self.reply(404, {'error': 'Dosya bulunamadı'})

    def api_get(self, path, q):
        try:
            if path == '/api/settings':
                return self.reply(200, kare_env.public())
            if path == '/api/animation/production':
                return self.reply(200, production_api.status())
            if path == '/api/animation/jobs':
                return self.reply(200, {'jobs': production_api.list_jobs()})
            if path.startswith('/api/animation/jobs/'):
                return self.reply(200, production_api.get_job(path.split('/')[-1]))
            if path.startswith('/api/animation/assets/'):
                return self.send_asset(path)
            if path.startswith('/api/animation/'):
                code, obj, content_type = animation_api.get(path, q)
                return self.reply(code, obj, content_type)
            return self.reply(404, {'error': 'API yolu bulunamadı'})
        except (FileNotFoundError, ValueError, KeyError):
            return self.reply(404, {'error': 'Üretim veya medya bulunamadı'})
        except (BrokenPipeError, ConnectionResetError):
            return

    def send_asset(self, path):
        asset = production_api.asset_path(path)   # UUID + izinli ad + veri dizini içinde (realpath)
        size = asset.stat().st_size; start, end, partial = 0, size - 1, False
        requested = self.headers.get('Range', '')
        if requested:
            match = re.fullmatch(r'bytes=(\d+)-(\d*)', requested)
            if not match:
                return self.reply(416, {'error': 'Geçersiz medya aralığı'})
            start = int(match[1]); end = min(size - 1, int(match[2]) if match[2] else size - 1); partial = True
            if start > end:
                return self.reply(416, {'error': 'Medya aralığı dosya dışında'})
        self.send_response(206 if partial else 200)
        self.send_header('Content-Type', MEDIA_TYPES[asset.suffix])
        self.send_header('Accept-Ranges', 'bytes'); self.send_header('Content-Length', str(end - start + 1))
        if partial:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        if self.command == 'HEAD':
            return
        with asset.open('rb') as stream:
            stream.seek(start); remaining = end - start + 1
            while remaining:
                chunk = stream.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk); remaining -= len(chunk)

    # ------------------------------------------------------------ POST / PUT / DELETE
    def read_body(self, path):
        """Boyut sınırını gövdeyi okumadan önce uygular. -> bytes ya da None (yanıt yazıldı)."""
        raw = self.headers.get('Content-Length')
        if raw is None:
            if self.headers.get('Transfer-Encoding'):
                self.reply(411, {'error': 'Content-Length gerekli'}); return None
            raw = '0'
        if not raw.isdigit():
            self.reply(400, {'error': 'Geçersiz Content-Length'}); return None
        length = int(raw)
        limit = next((v for k, v in LIMITS.items() if path == k or path.startswith(k + '/')), JSON_LIMIT)
        if length > limit:
            self.close_connection = True
            self.reply(413, {'error': 'Dosya/istek boyutu sınırı aşıldı'}); return None
        return self.rfile.read(length) if length else b''

    def do_PUT(self):
        self.do_POST()

    def do_DELETE(self):
        if not self.guard_request():
            return
        if not self.authorized():
            return self.reply(403, {'error': 'Oturum anahtarı gerekli'})
        self.reply(405, {'error': 'Desteklenmiyor'})

    def do_POST(self):
        if not self.guard_request():
            return
        if not self.authorized():
            return self.reply(403, {'error': 'Oturum anahtarı gerekli'})
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        path = unquote(u.path)
        body = self.read_body(path)
        if body is None:
            return
        try:
            def J():
                value = json.loads(body or b'{}')
                if not isinstance(value, dict):
                    raise ValueError('İstek JSON nesnesi olmalı')
                return value
            if path == '/api/settings' and self.command in ('PUT', 'POST'):
                kare_env.write(J())
                return self.reply(200, kare_env.public())
            if path.startswith('/api/settings/test/') and self.command == 'POST':
                return self.reply(200, kare_env.test_provider(path.rsplit('/', 1)[-1]))
            if self.command != 'POST':
                return self.reply(405, {'error': 'Desteklenmiyor'})
            if path == '/api/animation/package-import':
                return self.reply(200, production_api.pro_api.import_package(body, production_api))
            if path.startswith('/api/animation/pro/'):
                return self.reply(200, production_api.pro_api.handle(path.split('/')[-1], J(), production_api))
            if path == '/api/animation/document':
                return self.reply(200, production_api.document(q.get('name', ''), body))
            if path == '/api/animation/audio':
                return self.reply(200, production_api.upload_audio(q.get('name', ''), body))
            if path == '/api/animation/jobs':
                return self.reply(202, production_api.create_job(J()))
            if path == '/api/animation/save':
                project = production_api.validate_project(J().get('project'))
                identifier = str(uuid.uuid4())
                production_api.write(production_api.folder(identifier) / 'project.json', project)
                return self.reply(200, {'url': f'/api/animation/assets/{identifier}/project.json'})
            if path.startswith('/api/animation/cancel/'):
                return self.reply(200, production_api.cancel(path.split('/')[-1]))
            if path == '/api/animation/generate':
                code, obj = animation_api.generate(J())
                return self.reply(code, obj)
            return self.reply(404, {'error': 'API yolu bulunamadı'})
        except (ValueError, KeyError, TypeError) as e:   # json.JSONDecodeError da ValueError
            return self.reply(400, {'error': str(e) if isinstance(e, ValueError) else 'İstek alanları eksik veya geçersiz'})
        except FileNotFoundError:
            return self.reply(404, {'error': 'Kaynak bulunamadı'})
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception:
            traceback.print_exc()
            return self.reply(500, {'error': 'Sunucu hatası'})


def main():
    os.environ['KARE_TOKEN'] = TOKEN; os.environ['KARE_PORT'] = str(PORT)   # render_canvas.mjs (alt süreç) için
    production_api.DATA.mkdir(parents=True, exist_ok=True)
    production_api.recover()
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    server.daemon_threads = True
    print(f'Kare: http://localhost:{PORT}/kare/?t={TOKEN}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
