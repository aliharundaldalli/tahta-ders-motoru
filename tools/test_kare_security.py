"""Kare sunucusu güvenlik testleri (ağ/AI anahtarı gerekmez).

Çalıştır:  $PY -m unittest tools/test_kare_security.py   (ya da: $PY tools/test_kare_security.py)
Boş bir portta geçici .env ve veri dizini ile gerçek bir tools/kare_server.py süreci başlatır.
"""
import ast
import http.client
import io
import json
import os
import re
import secrets
import socket
import stat
import subprocess
import sys
import tempfile
import time
import unittest
import uuid
import zipfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import kare_env      # noqa: E402
import kare_guard    # noqa: E402

FAKE_KEY = 'sk-test-' + 'A1b2C3d4' * 5 + 'WXYZ'      # sahte; gerçek anahtar değil


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0)); return s.getsockname()[1]


def zip_bytes(entries, compression=zipfile.ZIP_DEFLATED):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', compression) as z:
        for name, data, *mode in entries:
            info = zipfile.ZipInfo(name); info.compress_type = compression
            if mode: info.external_attr = mode[0] << 16
            z.writestr(info, data)
    return buf.getvalue()


class KareServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        base = Path(cls.tmp.name)
        cls.env_file = base / 'test.env'; cls.env_file.write_text('# yorum satırı\nOTHER_SETTING=keep-me\n')
        cls.data = base / 'data'
        cls.port = free_port(); cls.token = secrets.token_urlsafe(24)
        env = {**os.environ, 'KARE_PORT': str(cls.port), 'KARE_TOKEN': cls.token, 'KARE_ENV_FILE': str(cls.env_file),
               'KARE_DATA_DIR': str(cls.data)}
        for k in kare_env.FIELDS: env.pop(k, None)
        cls.proc = subprocess.Popen([sys.executable, str(TOOLS / 'kare_server.py')], cwd=str(ROOT), env=env,
                                    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        for _ in range(100):
            try:
                if cls.request('GET', '/api/health')[0] == 200: break
            except OSError: pass
            time.sleep(.1)
        else:
            cls.proc.kill(); raise RuntimeError('Kare sunucusu başlamadı: ' + cls.proc.stderr.read().decode()[-2000:])

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try: cls.proc.wait(5)
        except subprocess.TimeoutExpired: cls.proc.kill()
        cls.proc.stderr.close(); cls.tmp.cleanup()

    @classmethod
    def request(cls, method, path, body=None, headers=None, token=None, host=None):
        conn = http.client.HTTPConnection('127.0.0.1', cls.port, timeout=10)
        h = {'Host': host or f'127.0.0.1:{cls.port}', **(headers or {})}
        if token: h['X-Kare-Token'] = token
        conn.putrequest(method, path, skip_host=True, skip_accept_encoding=True)   # yol olduğu gibi (normalleştirilmeden)
        for k, v in h.items(): conn.putheader(k, v)
        data = body if isinstance(body, bytes) else (json.dumps(body).encode() if body is not None else None)
        if data is not None and 'Content-Length' not in h: conn.putheader('Content-Length', str(len(data)))
        conn.endheaders()
        if data: conn.send(data)
        r = conn.getresponse(); content = r.read(); conn.close()
        return r.status, content, r

    def auth(self, method, path, body=None, headers=None):
        return self.request(method, path, body, headers, token=self.token)

    # --- oturum anahtarı
    def test_missing_or_wrong_token_is_403(self):
        for path in ('/api/settings', '/api/animation/status', '/api/animation/jobs'):
            self.assertEqual(self.request('GET', path)[0], 403, path)
            self.assertEqual(self.request('GET', path, token='yanlis-anahtar')[0], 403, path)
        self.assertEqual(self.request('PUT', '/api/settings', {'GLM_MODEL': 'x'})[0], 403)
        self.assertEqual(self.request('POST', '/api/animation/jobs', {'type': 'render'})[0], 403)
        self.assertEqual(self.request('POST', '/api/settings/test/glm', {})[0], 403)
        self.assertEqual(self.request('DELETE', '/api/settings')[0], 403)
        self.assertEqual(self.auth('GET', '/api/settings')[0], 200)

    def test_token_exchange_sets_strict_httponly_cookie(self):
        self.assertEqual(self.request('GET', '/kare/?t=yanlis')[0], 403)
        status, _, r = self.request('GET', f'/kare/?t={self.token}')
        self.assertEqual(status, 302); self.assertEqual(r.getheader('Location'), '/kare/')
        cookie = r.getheader('Set-Cookie')
        self.assertIn('HttpOnly', cookie); self.assertIn('SameSite=Strict', cookie)
        name_value = cookie.split(';')[0]
        self.assertEqual(self.request('GET', '/api/settings', headers={'Cookie': name_value})[0], 200)
        self.assertEqual(self.request('GET', '/api/settings', headers={'Cookie': name_value.split('=')[0] + '=x'})[0], 403)

    def test_single_scene_voice_job_checks(self):
        scene = {'id': str(uuid.uuid4()), 'category': 'line-art', 'title': 'Sahne', 'duration': 5, 'seed': 1, 'speed': 1,
                 'detail': 1, 'background': '#1d2420', 'palette': ['#f1ead8', '#f2b440'], 'objects': [], 'narration': 'Merhaba.'}
        body = {'type': 'voice', 'project': {'version': 1, 'scenes': [scene]}, 'provider': 'cartesia'}
        self.assertEqual(self.request('POST', '/api/animation/jobs', {**body, 'sceneIndex': 0})[0], 403)
        self.assertEqual(self.auth('POST', '/api/animation/jobs', {**body, 'sceneIndex': 0},
                                   {'Origin': 'http://evil.example'})[0], 403)
        for extra in ({'sceneIndex': 1}, {'sceneIndex': -1}, {'sceneIndex': '0'}, {'sceneId': 'yok'}):
            status, content, _ = self.auth('POST', '/api/animation/jobs', {**body, **extra})
            self.assertEqual(status, 400, extra); self.assertIn('error', json.loads(content))

    # --- Origin / Host
    def test_bad_origin_is_403(self):
        for origin in ('http://evil.example', f'http://localhost:{self.port + 1}', 'null'):
            self.assertEqual(self.auth('PUT', '/api/settings', {'GLM_MODEL': 'glm-5.3'}, {'Origin': origin})[0], 403, origin)
        self.assertEqual(self.auth('PUT', '/api/settings', {'GLM_MODEL': 'glm-5.3'}, {'Origin': f'http://localhost:{self.port}'})[0], 200)
        self.assertEqual(self.auth('GET', '/api/settings', headers={'Sec-Fetch-Site': 'cross-site'})[0], 403)

    def test_bad_host_is_rejected(self):
        for host in ('evil.example', f'evil.example:{self.port}', f'localhost:{self.port + 1}', '0.0.0.0:%d' % self.port):
            self.assertIn(self.request('GET', '/kare/', host=host)[0], (403, 421), host)
            self.assertIn(self.auth('GET', '/api/settings', headers={'Host': host})[0], (403, 421), host)
        self.assertEqual(self.request('GET', '/kare/', host=f'localhost:{self.port}')[0], 200)

    # --- statik dosyalar
    def test_dotfiles_and_internals_are_404(self):
        for path in ('/.env', '/.env.example', '/.git/config', '/.studio-data/', '/kare/../.env', '/kare/%2e%2e/.env',
                     '/kare/%2E%2E/%2Eenv', '/kare/..%2f.env', '/assets/fonts/../../.env', '/tools/kare_server.py',
                     '/studio/script.json', '/kare/skills/', '/node_modules/', '/kare/.hidden', '/package.json'):
            self.assertEqual(self.request('GET', path)[0], 404, path)
        self.assertEqual(self.request('GET', '/kare/')[0], 200)
        self.assertEqual(self.request('GET', '/kare/engine/render.js')[0], 200)
        _, _, r = self.request('GET', '/kare/')
        self.assertIn("frame-ancestors 'none'", r.getheader('Content-Security-Policy'))

    # --- yüklemeler
    def test_oversized_upload_is_413_before_reading(self):
        for path, size in (('/api/animation/document?name=a.pdf', 20 * 1024 * 1024 + 1),
                           ('/api/animation/audio?name=a.wav', 20 * 1024 * 1024 + 1),
                           ('/api/animation/package-import', 250 * 1024 * 1024 + 1),
                           ('/api/settings', 20000)):
            conn = http.client.HTTPConnection('127.0.0.1', self.port, timeout=10)
            conn.putrequest('POST', path, skip_host=True); conn.putheader('Host', f'127.0.0.1:{self.port}')
            conn.putheader('X-Kare-Token', self.token); conn.putheader('Content-Length', str(size)); conn.endheaders()
            r = conn.getresponse(); self.assertEqual(r.status, 413, path); conn.close()   # gövde hiç gönderilmedi

    def test_wrong_magic_bytes_are_400(self):
        cases = [('/api/animation/document?name=ders.pdf', b'Bu bir PDF degil ama uzantisi pdf ' * 3),
                 ('/api/animation/document?name=ders.docx', b'PK\x03\x04 sahte docx ' * 5),
                 ('/api/animation/document?name=ders.docx', zip_bytes([('readme.txt', b'not a docx')])),
                 ('/api/animation/document?name=ders.txt', b'\x00\x01\x02 ikili veri ' * 5),
                 ('/api/animation/document?name=program.exe', b'MZ' + b'\x00' * 100),
                 ('/api/animation/audio?name=ses.wav', b'ID3 bu wav degil' + b'\x00' * 100),
                 ('/api/animation/audio?name=ses.mp3', b'RIFF\x00\x00\x00\x00WAVE' + b'\x00' * 100),
                 ('/api/animation/package-import', b'PDF%-not-a-zip' * 10)]
        for path, body in cases:
            status, content, _ = self.auth('POST', path, body)
            self.assertEqual(status, 400, (path, content))
        # geçerli metin: üretilmiş UUID klasöre yazılır, kullanıcı dosya adı diske girmez
        status, content, _ = self.auth('POST', '/api/animation/document?name=..%2F..%2Fevil%2Fders.md',
                                       '# Başlık\nYeterince uzun bir eğitim metni burada yer alıyor.\n'.encode())
        self.assertEqual(status, 200, content)
        result = json.loads(content); self.assertNotIn('/', result['name']); self.assertNotIn('..', result['name'])
        self.assertTrue((self.data / result['id'] / 'document.json').is_file())
        self.assertFalse((ROOT.parent / 'evil').exists())

    # --- ZIP içe aktarma
    def package(self, extra):
        project = {'version': 1, 'name': 'x', 'scenes': []}
        return zip_bytes([('project.json', json.dumps(project).encode()), *extra])

    def test_zip_with_parent_path_is_rejected(self):
        for entry in (('../evil.wav', b'x'), ('media/../../evil.wav', b'x'), ('/abs/evil.wav', b'x'), ('C:/evil.wav', b'x')):
            status, content, _ = self.auth('POST', '/api/animation/package-import', self.package([entry]))
            self.assertEqual(status, 400, (entry[0], content))
            self.assertIn('yol', json.loads(content)['error'])
        status, content, _ = self.auth('POST', '/api/animation/package-import', self.package([('media/link.wav', b'/etc/passwd', stat.S_IFLNK | 0o777)]))
        self.assertEqual(status, 400, content); self.assertIn('sembolik', json.loads(content)['error'])

    def test_zip_bomb_ratio_is_rejected(self):
        bomb = self.package([('media/bomb.wav', b'\0' * (40 * 1024 * 1024))])
        self.assertLess(len(bomb), 200 * 1024)
        status, content, _ = self.auth('POST', '/api/animation/package-import', bomb)
        self.assertEqual(status, 400, content); self.assertIn('bomba', json.loads(content)['error'])

    def test_zip_limits_direct(self):
        many = zip_bytes([(f'f{i}.txt', b'x') for i in range(kare_guard.ZIP_MAX_ENTRIES + 1)], zipfile.ZIP_STORED)
        with zipfile.ZipFile(io.BytesIO(many)) as z, self.assertRaises(ValueError): kare_guard.check_zip(z)
        big = zip_bytes([('a.bin', os.urandom(1024))], zipfile.ZIP_STORED)
        with zipfile.ZipFile(io.BytesIO(big)) as z:
            with self.assertRaises(ValueError): kare_guard.check_zip(z, max_total=100)
            with self.assertRaises(ValueError): kare_guard.read_member(z, 'a.bin', 100)

    # --- medya yolu
    def test_asset_path_traversal_is_404(self):
        ident = str(uuid.uuid4())
        for path in (f'/api/animation/assets/{ident}/../../.env', f'/api/animation/assets/{ident}/%2e%2e/%2e%2e/.env',
                     '/api/animation/assets/../../.env', f'/api/animation/assets/{ident}/project.json',
                     f'/api/animation/assets/{ident}/evil.sh', '/api/animation/assets/not-a-uuid/project.json'):
            self.assertEqual(self.auth('GET', path)[0], 404, path)
        # veri dizinindeki sembolik bağ dışarıyı gösteriyorsa reddedilir
        outside = Path(self.tmp.name) / 'outside.json'; outside.write_text('{"secret": 1}')
        folder = self.data / ident; folder.mkdir(parents=True)
        (folder / 'project.json').symlink_to(outside)
        self.assertEqual(self.auth('GET', f'/api/animation/assets/{ident}/project.json')[0], 404)

    # --- ayarlar
    def test_settings_masked_atomic_and_validated(self):
        status, content, _ = self.auth('GET', '/api/settings')
        fields = json.loads(content)['fields']
        self.assertEqual(fields['GLM_API_KEY']['value'], 'boş'); self.assertFalse(fields['GLM_API_KEY']['set'])
        status, content, _ = self.auth('PUT', '/api/settings', {'ANTHROPIC_API_KEY': FAKE_KEY, 'AI_PROVIDER': 'anthropic'})
        self.assertEqual(status, 200, content)
        self.assertNotIn(FAKE_KEY, content.decode())
        self.assertEqual(json.loads(content)['fields']['ANTHROPIC_API_KEY']['value'], FAKE_KEY[:7] + '…' + FAKE_KEY[-4:])
        self.assertNotIn(FAKE_KEY, self.auth('GET', '/api/settings')[1].decode())
        text = self.env_file.read_text()
        self.assertIn('# yorum satırı', text); self.assertIn('OTHER_SETTING=keep-me', text)
        self.assertIn(f'ANTHROPIC_API_KEY={FAKE_KEY}', text)
        self.assertEqual(stat.S_IMODE(self.env_file.stat().st_mode), 0o600)
        for bad in ({'GLM_API_KEY': 'abc\nEVIL=1'}, {'UNKNOWN_KEY': 'x'}, {'AI_PROVIDER': 'evil'}, {'GLM_BASE_URL': 'https://evil.example/v4'},
                    {'OPENAI_MODEL': 'a b'}, {'GLM_API_KEY': 'x' * 400}, {'CARTESIA_VOICE': '../../x'}):
            self.assertEqual(self.auth('PUT', '/api/settings', bad)[0], 400, bad)
        self.assertNotIn('EVIL=1', self.env_file.read_text())
        self.assertEqual(self.auth('PUT', '/api/settings', {'ANTHROPIC_API_KEY': '', 'AI_PROVIDER': ''})[0], 200)
        self.assertEqual(json.loads(self.auth('GET', '/api/settings')[1])['fields']['ANTHROPIC_API_KEY']['value'], 'boş')
        # boş anahtarla bağlantı testi ağa çıkmadan cevap verir
        result = json.loads(self.auth('POST', '/api/settings/test/anthropic', {})[1])
        self.assertFalse(result['ok']); self.assertIn('boş', result['message'])

    def test_gemini_settings_masked_and_validated(self):
        status, content, _ = self.auth('GET', '/api/settings')
        body = json.loads(content)
        self.assertIn('gemini', body['providers'])
        self.assertTrue(body['fields']['GEMINI_API_KEY']['secret']); self.assertFalse(body['fields']['GEMINI_MODEL']['secret'])
        self.assertEqual(body['fields']['GEMINI_MODEL']['default'], kare_env.DEFAULTS['GEMINI_MODEL'])
        status, content, _ = self.auth('PUT', '/api/settings', {'GEMINI_API_KEY': FAKE_KEY, 'GEMINI_MODEL': 'gemini-3.8-flash', 'AI_PROVIDER': 'gemini'})
        self.assertEqual(status, 200, content)
        self.assertNotIn(FAKE_KEY, content.decode())
        fields = json.loads(content)['fields']
        self.assertEqual(fields['GEMINI_API_KEY']['value'], FAKE_KEY[:7] + '…' + FAKE_KEY[-4:])
        self.assertEqual(fields['GEMINI_MODEL']['value'], 'gemini-3.8-flash'); self.assertEqual(fields['AI_PROVIDER']['value'], 'gemini')
        self.assertNotIn(FAKE_KEY, self.auth('GET', '/api/settings')[1].decode())
        # model kimliği URL yoluna girer: /, :, ?, .., boşluk reddedilir
        for bad in ('models/../x', 'gemini:generate', 'a..b', 'x?key=1', 'a b', '-lead'):
            self.assertEqual(self.auth('PUT', '/api/settings', {'GEMINI_MODEL': bad})[0], 400, bad)
        self.assertEqual(self.auth('PUT', '/api/settings', {'GEMINI_API_KEY': 'k\nEVIL=1'})[0], 400)
        self.assertEqual(self.auth('PUT', '/api/settings', {'GEMINI_API_KEY': '', 'GEMINI_MODEL': '', 'AI_PROVIDER': ''})[0], 200)
        result = json.loads(self.auth('POST', '/api/settings/test/gemini', {})[1])
        self.assertFalse(result['ok']); self.assertIn('GEMINI_API_KEY boş', result['message'])

    def test_gemini_connection_test_uses_header_not_url(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as d:
            env = Path(d) / '.env'; env.write_text(f'GEMINI_API_KEY={FAKE_KEY}\n')
            with patch.dict(os.environ, {'KARE_ENV_FILE': str(env)}), patch.object(kare_env.urllib.request, 'urlopen') as call:
                for k in kare_env.FIELDS: os.environ.pop(k, None)
                call.return_value.__enter__.return_value.status = 200
                result = kare_env.test_provider('gemini')
        self.assertTrue(result['ok'], result); self.assertNotIn(FAKE_KEY, json.dumps(result))
        req = call.call_args.args[0]
        self.assertEqual(req.get_method(), 'GET')
        self.assertEqual(req.full_url, 'https://generativelanguage.googleapis.com/v1beta/models/' + kare_env.DEFAULTS['GEMINI_MODEL'])
        self.assertNotIn(FAKE_KEY, req.full_url); self.assertNotIn('key=', req.full_url)
        self.assertEqual({k.lower(): v for k, v in req.header_items()}['x-goog-api-key'], FAKE_KEY)

    def test_mask(self):
        self.assertEqual(kare_env.mask(''), 'boş'); self.assertEqual(kare_env.mask('short-key'), 'ayarlı')
        self.assertEqual(kare_env.mask(FAKE_KEY), FAKE_KEY[:7] + '…' + FAKE_KEY[-4:])


class StaticRules(unittest.TestCase):
    """Kod kuralları: alt süreçlerde shell=True yok; model çıktısı eval/exec/new Function ile çalıştırılmaz."""
    KARE_PY = ['kare_server.py', 'kare_env.py', 'kare_guard.py', 'animation_api.py', 'production_api.py', 'pro_api.py']

    def test_no_shell_true_and_timeouts(self):
        for name in self.KARE_PY:
            src = (TOOLS / name).read_text(encoding='utf-8')
            self.assertNotRegex(src, r'shell\s*=\s*True', name)
            self.assertNotRegex(src, r'(?<![\w.])(eval|exec)\s*\(', name)
            self.assertNotIn('os.system(', src, name)
            for node in ast.walk(ast.parse(src)):          # her subprocess.run/communicate çağrısında zaman aşımı
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr in ('run', 'communicate') \
                        and isinstance(node.func.value, ast.Name) and node.func.value.id in ('subprocess', 'process'):
                    self.assertIn('timeout', [k.arg for k in node.keywords], f'{name}:{node.lineno}')
                if isinstance(node, ast.Call) and any(k.arg == 'shell' for k in node.keywords):
                    self.fail(f'{name}:{node.lineno} shell= kullanılmamalı')

    def test_no_dynamic_code_in_kare_js(self):
        for path in [*(ROOT / 'kare').glob('*.js'), *(ROOT / 'kare/engine').glob('*.js'), TOOLS / 'pro_contract.mjs']:
            src = path.read_text(encoding='utf-8')
            self.assertNotRegex(src, r'\bnew Function\b|(?<![\w.])eval\s*\(|setTimeout\(\s*[\'"`]', path.name)


if __name__ == '__main__':
    unittest.main()
