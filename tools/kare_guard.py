"""Kare yükleme korumaları: dosya adı temizleme, uzantı + sihirli bayt denetimi, güvenli ZIP okuma, dizin içi yol doğrulama."""
import io
import os
import re
import stat
import zipfile
from pathlib import Path

MB = 1024 * 1024
DOCUMENT_MAX = 20 * MB
AUDIO_MAX = 20 * MB
PACKAGE_MAX = 250 * MB
ZIP_MAX_ENTRIES = 2000
ZIP_MAX_TOTAL = 500 * MB          # açılmış toplam boyut
ZIP_MAX_RATIO = 200               # tek girişte açılmış/sıkıştırılmış oranı (1 MB üstü girişlerde)
ZIP_RATIO_FLOOR = 1 * MB


def safe_name(name, limit=120):
    """Kullanıcının verdiği dosya adını yalnızca görüntüleme/uzantı için temizler; diske asla bu adla yazılmaz."""
    name = str(name or '').replace('\\', '/').split('/')[-1]
    name = re.sub(r'[\x00-\x1f\x7f]', '', name).strip().lstrip('.')
    name = name.replace('..', '.')
    return (name or 'dosya')[:limit]


def _is_docx(content):
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            check_zip(z, max_total=100 * MB)
            return 'word/document.xml' in z.namelist() and '[Content_Types].xml' in z.namelist()
    except (zipfile.BadZipFile, ValueError, OSError):
        return False


def sniff_document(name, content):
    """-> uzantı (.pdf/.docx/.txt/.md). Uzantı ile içerik uyuşmazsa ValueError."""
    suffix = Path(safe_name(name)).suffix.lower()
    if suffix not in ('.pdf', '.docx', '.txt', '.md'):
        raise ValueError('PDF, DOCX, TXT veya MD dosyası seç')
    if not content or len(content) > DOCUMENT_MAX:
        raise ValueError('Doküman 1 bayt–20 MB olmalı')
    if suffix == '.pdf' and not content[:1024].lstrip().startswith(b'%PDF-'):
        raise ValueError('Dosya içeriği PDF değil')
    if suffix == '.docx' and not (content[:4] == b'PK\x03\x04' and _is_docx(content)):
        raise ValueError('Dosya içeriği DOCX değil')
    if suffix in ('.txt', '.md'):
        if b'\x00' in content[:65536]:
            raise ValueError('Metin dosyası ikili veri içeriyor')
        try:
            content.decode('utf-8-sig')
        except UnicodeDecodeError:
            raise ValueError('Metin dosyası UTF-8 olarak kaydedilmeli') from None
    return suffix


AUDIO_MAGIC = {
    '.wav': lambda b: b[:4] == b'RIFF' and b[8:12] == b'WAVE',
    '.mp3': lambda b: b[:3] == b'ID3' or (len(b) > 1 and b[0] == 0xFF and (b[1] & 0xE0) == 0xE0),
    '.ogg': lambda b: b[:4] == b'OggS',
    '.webm': lambda b: b[:4] == b'\x1aE\xdf\xa3',
    '.m4a': lambda b: b[4:8] == b'ftyp',
}


def sniff_audio(name, content):
    suffix = Path(safe_name(name)).suffix.lower()
    if suffix not in AUDIO_MAGIC:
        raise ValueError('WAV, MP3, WebM, OGG veya M4A; en fazla 20 MB')
    if not content or len(content) > AUDIO_MAX:
        raise ValueError('WAV, MP3, WebM, OGG veya M4A; en fazla 20 MB')
    if not AUDIO_MAGIC[suffix](content[:16]):
        raise ValueError('Dosya içeriği seçilen ses biçimiyle uyuşmuyor')
    return suffix


def check_zip(archive, max_entries=ZIP_MAX_ENTRIES, max_total=ZIP_MAX_TOTAL, max_ratio=ZIP_MAX_RATIO):
    """Zip-slip, sembolik bağ ve zip bombasına karşı bütün girişleri açmadan denetler."""
    infos = archive.infolist()
    if len(infos) > max_entries:
        raise ValueError('Pakette çok fazla dosya var')
    total = 0
    for info in infos:
        name = info.filename
        parts = name.replace('\\', '/').split('/')
        if (not name or name.startswith(('/', '\\')) or re.match(r'^[A-Za-z]:', name) or '..' in parts
                or '\x00' in name or len(name) > 255):
            raise ValueError('Pakette geçersiz dosya yolu var')
        mode = info.external_attr >> 16
        if stat.S_ISLNK(mode):
            raise ValueError('Pakette sembolik bağ var')
        if info.flag_bits & 0x1:
            raise ValueError('Şifreli paket desteklenmiyor')
        total += info.file_size
        if total > max_total:
            raise ValueError('Paketin açılmış boyutu çok büyük')
        if info.file_size > ZIP_RATIO_FLOOR and info.file_size > max_ratio * max(info.compress_size, 1):
            raise ValueError('Paketteki bir dosyanın sıkıştırma oranı şüpheli (zip bombası)')
    return infos


def read_member(archive, name, limit):
    """Tek girişi, beyan edilen boyutu ve üst sınırı aşmadan okur."""
    info = archive.getinfo(name)
    if info.file_size > limit:
        raise ValueError('Paketteki dosya çok büyük')
    with archive.open(info) as stream:
        data = stream.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Paketteki dosya çok büyük')
    return data


def inside(base, path):
    """path (sembolik bağlar çözülerek) base dizininin içindeyse çözülmüş yolu döndürür, değilse ValueError."""
    base = Path(os.path.realpath(base)); real = Path(os.path.realpath(path))
    if real != base and base not in real.parents:
        raise ValueError('Yol veri dizininin dışında')
    return real
