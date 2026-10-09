"""Güvenilir HTTPS bağlamı. python.org'un macOS Python'u sertifika paketiyle gelmez (CERTIFICATE_VERIFY_FAILED);
sırayla certifi, sistem paketi (/etc/ssl/cert.pem) ve varsayılan doğrulama denenir. Doğrulama asla kapatılmaz."""
import os, ssl
def context():
    try:
        import certifi; return ssl.create_default_context(cafile=certifi.where())
    except Exception: pass
    for p in ('/etc/ssl/cert.pem', '/opt/homebrew/etc/openssl@3/cert.pem', '/usr/local/etc/openssl@3/cert.pem'):
        if os.path.isfile(p): return ssl.create_default_context(cafile=p)
    return ssl.create_default_context()
CTX = context()
